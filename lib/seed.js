// Seeds the database with initial mock events on cold start so /api/events isn't empty
// before the RSS ingest runs.
import { getDb, ensureIndexes } from './mongo'

const IMG = {
  politica: 'https://images.pexels.com/photos/10464798/pexels-photo-10464798.jpeg',
  politica2: 'https://images.unsplash.com/photo-1579532536935-619928decd08',
  futebol: 'https://images.unsplash.com/photo-1610201477480-2605bbc65c11',
  futebol2: 'https://images.unsplash.com/photo-1665413811870-5b29a250f64a',
  futebol3: 'https://images.unsplash.com/photo-1556764420-e37ef4cdfa5c',
  celeb: 'https://images.unsplash.com/photo-1614115866447-c9a299154650',
  mundo: 'https://images.unsplash.com/photo-1609116911621-2fc68d5bac5e',
  mundo2: 'https://images.unsplash.com/photo-1567018902823-7d03ee5cb9f1',
}

function rel(mins) {
  if (mins < 60) return `há ${mins} min`
  const h = Math.floor(mins / 60)
  return `há ${h}h`
}

let seeded = false
export async function seedIfEmpty() {
  if (seeded) return
  await ensureIndexes()
  const db = await getDb()
  const count = await db.collection('events').countDocuments()
  if (count > 0) { seeded = true; return }

  const now = new Date()
  const items = [
    { slug: 'flamengo-anuncia-novo-treinador', channel: 'futebol', title: 'Flamengo anuncia novo treinador em coletiva-relâmpago',
      summary: 'Diretoria confirma contratação após 48h de negociação. Anúncio oficial foi feito há poucos minutos e treinador já se apresenta amanhã cedo no Ninho.',
      fullContent: 'A diretoria do Flamengo confirmou nesta manhã a contratação do novo comandante para a próxima temporada. O acordo, fechado após 48 horas de negociação intensa, prevê contrato de dois anos com metas específicas de conquistas continentais. O treinador chega ao Rio hoje à noite e comanda o primeiro treino amanhã às 9h.',
      image: IMG.futebol, status: 'agora', importance: 5, isPremium: true,
      topics: ['Flamengo', 'Brasileirão', 'Contratações'], mins: 12 },
    { slug: 'stf-julga-marco-temporal-hoje', channel: 'politica', title: 'STF retoma julgamento do marco temporal ainda hoje',
      summary: 'Ministros voltam a se reunir às 14h. Placar está em 3 a 2, e votos decisivos podem sair ainda nesta tarde.',
      image: IMG.politica, status: 'importante', importance: 5, isPremium: true,
      topics: ['STF', 'Marco Temporal', 'Congresso'], mins: 42 },
    { slug: 'anitta-anuncia-nova-turne', channel: 'celebridades', title: 'Anitta anuncia turnê mundial com 42 datas em 3 continentes',
      summary: 'Cantora divulgou o roteiro completo em live no Instagram. Vendas começam sexta-feira às 10h.',
      image: IMG.celeb, status: 'atualizacao', importance: 3, isPremium: true,
      topics: ['Anitta', 'Música', 'Shows'], mins: 80 },
    { slug: 'ue-aprova-pacote-energia', channel: 'mundo', title: 'União Europeia aprova pacote de € 210 bi para transição energética',
      summary: 'Acordo histórico assinado em Bruxelas. Impacto direto no preço do gás no Brasil nos próximos meses.',
      image: IMG.mundo, status: 'importante', importance: 4, isPremium: false,
      topics: ['União Europeia', 'Energia', 'Economia global'], mins: 120 },
    { slug: 'palmeiras-negocia-atacante-europeu', channel: 'futebol', title: 'Palmeiras avança por atacante europeu de € 12 mi',
      summary: 'Negociação em fase final. Jogador já autorizou proposta e clube define detalhes com agente.',
      image: IMG.futebol2, status: 'desenvolvimento', importance: 4, isPremium: true,
      topics: ['Palmeiras', 'Contratações', 'Mercado da bola'], mins: 180 },
    { slug: 'congresso-vota-reforma-tributaria', channel: 'politica', title: 'Câmara vota fase 2 da Reforma Tributária hoje à noite',
      summary: 'Governo tem 280 votos garantidos. Oposição promete obstrução, mas presidente da Casa deve pautar.',
      image: IMG.politica2, status: 'desenvolvimento', importance: 4, isPremium: true,
      topics: ['Câmara', 'Reforma Tributária', 'Governo'], mins: 300 },
    { slug: 'apagao-argentina-brasil', channel: 'mundo', title: 'Apagão na Argentina afeta interligação com sul do Brasil',
      summary: 'ONS confirma queda momentânea no sistema. Sem impacto no fornecimento nacional.',
      image: IMG.mundo2, status: 'atualizacao', importance: 2, isPremium: false,
      topics: ['Argentina', 'Energia', 'Brasil'], mins: 420 },
    { slug: 'selecao-convocacao-eliminatorias', channel: 'futebol', title: 'Seleção: convocação sai amanhã com 3 surpresas',
      summary: 'Técnico deve chamar dois jogadores da base e um retorno inesperado da Premier League.',
      image: IMG.futebol3, status: 'desenvolvimento', importance: 3, isPremium: true,
      topics: ['Seleção', 'Eliminatórias', 'Convocação'], mins: 480 },
  ]

  const docs = items.map(x => ({
    id: crypto.randomUUID(),
    slug: x.slug, channel: x.channel, title: x.title, normalizedTitle: x.title.toLowerCase().slice(0, 40),
    summary: x.summary, fullContent: x.fullContent || x.summary,
    image: x.image, status: x.status, importance: x.importance, isPremium: x.isPremium,
    topics: x.topics,
    sources: [{ name: 'Radar Editorial', url: '#', time: rel(x.mins) }],
    timeline: [{ time: new Date(now.getTime() - x.mins*60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), title: 'Primeira reportagem' }],
    communityCount: Math.floor(Math.random() * 400) + 20,
    communityLive: Math.floor(Math.random() * 60),
    createdAt: new Date(now.getTime() - x.mins*60000),
    updatedAt: new Date(now.getTime() - Math.floor(x.mins * 0.4) * 60000),
    createdAtDisplay: rel(x.mins), updatedAtDisplay: rel(Math.floor(x.mins*0.4) || 3),
  }))
  await db.collection('events').insertMany(docs)
  seeded = true
}
