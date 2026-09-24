import Parser from 'rss-parser'
import { getDb, ensureIndexes } from './mongo'
import { classifyAndSummarize } from './llm'
import { notifyUser } from './push'

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'RadarPessoalBot/1.0 (+news-aggregator)' },
})

// Curated Brazilian sources. Each has a hint for default channel.
const SOURCES = [
  { name: 'G1',            channelHint: null,           url: 'https://g1.globo.com/rss/g1/' },
  { name: 'G1 Política',   channelHint: 'politica',     url: 'https://g1.globo.com/rss/g1/politica/' },
  { name: 'G1 Mundo',      channelHint: 'mundo',        url: 'https://g1.globo.com/rss/g1/mundo/' },
  { name: 'G1 Pop&Arte',   channelHint: 'celebridades', url: 'https://g1.globo.com/rss/g1/pop-arte/' },
  { name: 'GE',            channelHint: 'futebol',      url: 'https://ge.globo.com/dynamo/futebol/rss2.xml' },
  { name: 'UOL Esporte',   channelHint: 'futebol',      url: 'https://rss.uol.com.br/feed/esporte.xml' },
  { name: 'Poder360',      channelHint: 'politica',     url: 'https://www.poder360.com.br/feed/' },
  { name: 'BBC Brasil',    channelHint: 'mundo',        url: 'https://feeds.bbci.co.uk/portuguese/rss.xml' },
]

const CHANNEL_KEYWORDS = {
  politica: /\b(polític|congress|senado|câmara|stf|planalto|governo|ministr|presidente|lula|bolsonaro|eleic|partido|pl|mp\b|reforma|deputado|senador)/i,
  futebol: /\b(futebol|flamengo|palmeiras|corinthians|são paulo|santos|grêmio|internacional|cruzeiro|atlético|vasco|fluminense|botafogo|brasileir|libertadores|copa|seleção|jogador|técnico|treinador|gol)/i,
  celebridades: /\b(cantor|celebridade|globo|novela|reality|bbb|anitta|filme|série|show|cinema|oscar|grammy|rock in rio|festival|ator|atriz)/i,
  mundo: /\b(mundo|internacional|estados unidos|eua|europa|ucrânia|russia|china|argentina|onu|união europeia|guerra|clima|nasa)/i,
}

function slugify(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0, 80)
}

function classifyByKeywords(text) {
  for (const [ch, re] of Object.entries(CHANNEL_KEYWORDS)) {
    if (re.test(text)) return ch
  }
  return 'mundo'
}

function relativeTime(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

function extractImage(item) {
  const media = item['media:content'] || item.enclosure?.url
  if (typeof media === 'object') return media.$?.url || media.url || null
  if (typeof media === 'string') return media
  if (item.enclosure?.url) return item.enclosure.url
  const html = item['content:encoded'] || item.content || ''
  const m = html.match(/<img[^>]+src="([^">]+)"/)
  if (m) return m[1]
  return null
}

const FALLBACK_IMG = {
  politica: 'https://images.pexels.com/photos/10464798/pexels-photo-10464798.jpeg',
  futebol: 'https://images.unsplash.com/photo-1610201477480-2605bbc65c11',
  celebridades: 'https://images.unsplash.com/photo-1614115866447-c9a299154650',
  mundo: 'https://images.unsplash.com/photo-1609116911621-2fc68d5bac5e',
}

export async function runIngest({ useLLM = true, limitPerSource = 8 } = {}) {
  await ensureIndexes()
  const db = await getDb()
  const stats = { sources: 0, newArticles: 0, newEvents: 0, updatedEvents: 0, errors: [], llmCalls: 0 }

  for (const src of SOURCES) {
    try {
      const feed = await parser.parseURL(src.url)
      stats.sources++
      const items = (feed.items || []).slice(0, limitPerSource)
      for (const item of items) {
        if (!item.link || !item.title) continue

        // Skip duplicate URL
        const dup = await db.collection('articles').findOne({ url: item.link })
        if (dup) continue

        const description = (item.contentSnippet || item.summary || item.content || '').slice(0, 800)
        const combined = `${item.title} ${description}`
        let channel = src.channelHint || classifyByKeywords(combined)
        let importance = 3
        let status = 'atualizacao'
        let topics = []
        let summary = description.slice(0, 300)

        if (useLLM) {
          const ai = await classifyAndSummarize({
            title: item.title, description, sourceName: src.name,
          })
          stats.llmCalls++
          if (ai) {
            channel = ai.channel || channel
            importance = Number(ai.importance) || importance
            status = ai.status || status
            topics = Array.isArray(ai.topics) ? ai.topics.slice(0, 4) : []
            summary = ai.summary || summary
          }
        }

        const image = extractImage(item) || FALLBACK_IMG[channel] || FALLBACK_IMG.mundo
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date()

        // Store article
        await db.collection('articles').insertOne({
          id: crypto.randomUUID(),
          url: item.link, title: item.title, description,
          sourceName: src.name, channel, image,
          publishedAt, createdAt: new Date(),
        }).catch(() => {})
        stats.newArticles++

        // Group into event by simple heuristic: similar title in same channel within last 24h.
        const twentyFourAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const existing = await db.collection('events').findOne({
          channel,
          createdAt: { $gt: twentyFourAgo },
          $or: [
            { title: item.title },
            { normalizedTitle: normalizeTitle(item.title) },
          ],
        })

        if (existing) {
          // Update event: add source, bump updatedAt, add timeline entry
          const sources = existing.sources || []
          if (!sources.some(s => s.name === src.name)) {
            sources.push({ name: src.name, url: item.link, time: relativeTime(publishedAt) })
          }
          const timeline = existing.timeline || []
          timeline.push({ time: publishedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), title: `${src.name} publicou nova cobertura` })
          await db.collection('events').updateOne(
            { _id: existing._id },
            { $set: { sources, timeline, updatedAt: new Date() } }
          )
          stats.updatedEvents++
        } else {
          const isPremium = channel !== 'mundo' // mundo has more free content for demo
          const slug = `${slugify(item.title)}-${Date.now().toString(36).slice(-4)}`
          const evtDoc = {
            id: crypto.randomUUID(),
            slug,
            channel,
            title: item.title,
            normalizedTitle: normalizeTitle(item.title),
            summary,
            fullContent: description,
            image,
            status,
            importance,
            isPremium,
            topics,
            sources: [{ name: src.name, url: item.link, time: relativeTime(publishedAt) }],
            timeline: [{ time: publishedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), title: `${src.name} — publicação inicial` }],
            communityCount: 0,
            communityLive: 0,
            createdAt: publishedAt,
            updatedAt: new Date(),
            createdAtDisplay: relativeTime(publishedAt),
            updatedAtDisplay: relativeTime(publishedAt),
          }
          await db.collection('events').insertOne(evtDoc)
          stats.newEvents++

          // Fan-out notifications to users following any of the topics
          if (importance >= 4 && topics.length) {
            const followers = await db.collection('users').find({
              followedTopics: { $in: topics },
            }).toArray()
            for (const u of followers) {
              await notifyUser(u.id, {
                title: `⚡ ${topics[0]}: nova atualização`,
                body: item.title,
                url: `/evento/${slug}`,
                type: 'topic-update',
                eventId: evtDoc.id,
              }).catch(() => {})
            }
          }
        }
      }
    } catch (e) {
      stats.errors.push(`${src.name}: ${e.message}`)
    }
  }
  return stats
}

function normalizeTitle(t) {
  return String(t).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(w => w.length > 3).slice(0, 6).join(' ')
}
