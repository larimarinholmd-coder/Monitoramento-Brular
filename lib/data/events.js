// Mock data for Radar Pessoal — Phase 1
// Structure mirrors the real domain: Channels, Events, Sources, Timeline
// Ready to be replaced by real ingest pipeline in Phase 2.

export const CHANNELS = [
  { id: 'politica', name: 'Política', color: '#ef4444', tagline: 'Poder, decisões, impacto real.', price: 14.90 },
  { id: 'futebol', name: 'Futebol', color: '#10b981', tagline: 'Times, transferências, bastidores.', price: 14.90 },
  { id: 'celebridades', name: 'Celebridades', color: '#a855f7', tagline: 'Entretenimento, cultura, fama.', price: 12.90 },
  { id: 'mundo', name: 'Mundo', color: '#3b82f6', tagline: 'Geopolítica, ciência, tendências globais.', price: 14.90 },
]

export const ALL_ACCESS_PRICE = 34.90

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

// status: 'agora' (LIVE) | 'importante' | 'desenvolvimento' | 'atualizacao'
// importance: 1 (baixa) to 5 (crítica)
export const EVENTS = [
  {
    id: 'evt-01', slug: 'flamengo-anuncia-novo-treinador',
    channel: 'futebol', title: 'Flamengo anuncia novo treinador em coletiva-relâmpago',
    summary: 'Diretoria confirma contratação após 48h de negociação. Anúncio oficial foi feito há poucos minutos e treinador já se apresenta amanhã cedo no Ninho.',
    fullContent: 'A diretoria do Flamengo confirmou nesta manhã a contratação do novo comandante para a próxima temporada. O acordo, fechado após 48 horas de negociação intensa, prevê contrato de dois anos com metas específicas de conquistas continentais. O treinador chega ao Rio hoje à noite e comanda o primeiro treino amanhã às 9h, com portões fechados. Fontes internas confirmam que o técnico terá autonomia total para escolher a comissão técnica, algo que pesou na decisão. O acordo salarial ficou próximo ao teto do clube, mas com bônus por metas.',
    image: IMG.futebol, status: 'agora', importance: 5, isPremium: true,
    createdAt: 'há 12 min', updatedAt: 'há 4 min',
    topics: ['Flamengo', 'Brasileirão', 'Contratações'],
    sources: [
      { name: 'GE', time: 'há 12 min' },
      { name: 'ESPN', time: 'há 8 min' },
      { name: 'UOL Esporte', time: 'há 6 min' },
      { name: 'Coluna do Fla', time: 'há 4 min' },
    ],
    timeline: [
      { time: '06:12', title: 'Rumor sobre negociação avançada surge em blog especializado' },
      { time: '07:40', title: 'Diretoria convoca coletiva-relâmpago para as 09h' },
      { time: '08:55', title: 'Presidente chega ao Ninho do Urubu' },
      { time: '09:03', title: 'Contratação anunciada oficialmente' },
      { time: '09:20', title: 'Treinador embarca com destino ao Rio' },
    ],
    communityCount: 327, communityLive: 58,
  },
  {
    id: 'evt-02', slug: 'stf-julga-marco-temporal-hoje',
    channel: 'politica', title: 'STF retoma julgamento do marco temporal ainda hoje',
    summary: 'Ministros voltam a se reunir às 14h. Placar está em 3 a 2, e votos decisivos podem sair ainda nesta tarde.',
    fullContent: 'O Supremo Tribunal Federal retoma às 14h desta quarta-feira o julgamento do marco temporal das terras indígenas. O placar parcial está em 3 votos a 2 pela inconstitucionalidade da tese, e a expectativa é de que ao menos mais três ministros votem hoje. Segundo bastidores, dois ministros estudam pedir vista, o que adiaria por até 90 dias a conclusão. Advogados do governo e da bancada ruralista já circulam pelos gabinetes desde o começo da manhã.',
    image: IMG.politica, status: 'importante', importance: 5, isPremium: true,
    createdAt: 'há 42 min', updatedAt: 'há 18 min',
    topics: ['STF', 'Marco Temporal', 'Congresso'],
    sources: [
      { name: 'Folha', time: 'há 42 min' },
      { name: 'G1', time: 'há 31 min' },
      { name: 'Estadão', time: 'há 18 min' },
    ],
    timeline: [
      { time: 'Ontem 19h', title: 'Sessão suspensa após voto do relator' },
      { time: 'Hoje 08h', title: 'Ministros começam a chegar em Brasília' },
      { time: 'Hoje 10h', title: 'Reunião de gabinete confirma retomada' },
    ],
    communityCount: 891, communityLive: 142,
  },
  {
    id: 'evt-03', slug: 'anitta-anuncia-nova-turne',
    channel: 'celebridades', title: 'Anitta anuncia turnê mundial com 42 datas em 3 continentes',
    summary: 'Cantora divulgou o roteiro completo em live no Instagram. Vendas começam sexta-feira às 10h.',
    fullContent: 'Anitta anunciou nesta manhã sua maior turnê internacional até hoje, com 42 datas confirmadas passando por Estados Unidos, Europa e Ásia. A brasileira que se apresentará em arenas como o Madison Square Garden e a O2 Arena em Londres, revelou o roteiro completo em live no Instagram que teve mais de 2 milhões de visualizações simultâneas. A pré-venda começa sexta-feira às 10h para fãs do fã-clube oficial, e as vendas gerais na segunda seguinte.',
    image: IMG.celeb, status: 'atualizacao', importance: 3, isPremium: true,
    createdAt: 'há 1h 20min', updatedAt: 'há 35 min',
    topics: ['Anitta', 'Música', 'Shows'],
    sources: [ { name: 'Quem', time: 'há 1h 20min' }, { name: 'GShow', time: 'há 55 min' } ],
    timeline: [
      { time: '07:00', title: 'Prints vazam nas redes sociais' },
      { time: '09:30', title: 'Anúncio oficial em live no Instagram' },
    ],
    communityCount: 214, communityLive: 31,
  },
  {
    id: 'evt-04', slug: 'ue-aprova-pacote-energia',
    channel: 'mundo', title: 'União Europeia aprova pacote de € 210 bi para transição energética',
    summary: 'Acordo histórico assinado em Bruxelas. Impacto direto no preço do gás no Brasil nos próximos meses.',
    fullContent: 'Após 14 horas de negociação, os 27 países da União Europeia aprovaram um pacote de 210 bilhões de euros para acelerar a transição energética até 2030. O acordo prevê investimentos massivos em energia eólica, solar e hidrogênio verde. Analistas apontam que o pacote pode pressionar o preço do gás natural globalmente e afetar exportações brasileiras de commodities energéticas nos próximos trimestres.',
    image: IMG.mundo, status: 'importante', importance: 4, isPremium: false,
    createdAt: 'há 2h', updatedAt: 'há 1h',
    topics: ['União Europeia', 'Energia', 'Economia global'],
    sources: [ { name: 'Reuters', time: 'há 2h' }, { name: 'BBC', time: 'há 1h 30min' }, { name: 'AFP', time: 'há 1h' } ],
    timeline: [
      { time: 'Ontem', title: 'Rascunho vazado sugere impasse' },
      { time: 'Madrugada', title: 'Negociação estende-se por 14 horas' },
      { time: 'Manhã', title: 'Acordo é finalmente selado' },
    ],
    communityCount: 87, communityLive: 12,
  },
  {
    id: 'evt-05', slug: 'palmeiras-negocia-atacante-europeu',
    channel: 'futebol', title: 'Palmeiras avança por atacante europeu de € 12 mi',
    summary: 'Negociação em fase final. Jogador já autorizou proposta e clube define detalhes com agente.',
    image: IMG.futebol2, status: 'desenvolvimento', importance: 4, isPremium: true,
    createdAt: 'há 3h', updatedAt: 'há 45 min',
    topics: ['Palmeiras', 'Contratações', 'Mercado da bola'],
    sources: [ { name: 'Fabrizio Romano', time: 'há 3h' }, { name: 'GE', time: 'há 2h' } ],
    timeline: [
      { time: 'Ontem noite', title: 'Primeiro contato com o agente' },
      { time: 'Hoje 7h', title: 'Proposta formal enviada' },
    ],
    communityCount: 156, communityLive: 22,
  },
  {
    id: 'evt-06', slug: 'congresso-vota-reforma-tributaria',
    channel: 'politica', title: 'Câmara vota fase 2 da Reforma Tributária hoje à noite',
    summary: 'Governo tem 280 votos garantidos. Oposição promete obstrução, mas presidente da Casa deve pautar.',
    image: IMG.politica2, status: 'desenvolvimento', importance: 4, isPremium: true,
    createdAt: 'há 5h', updatedAt: 'há 1h',
    topics: ['Câmara', 'Reforma Tributária', 'Governo'],
    sources: [ { name: 'Folha', time: 'há 5h' }, { name: 'Estadão', time: 'há 3h' } ],
    timeline: [
      { time: '08:00', title: 'Líderes se reúnem no gabinete da presidência' },
      { time: '11:30', title: 'Base do governo confirma 280 votos' },
    ],
    communityCount: 445, communityLive: 68,
  },
  {
    id: 'evt-07', slug: 'oscar-2026-indicados-brasileiros',
    channel: 'celebridades', title: 'Filme brasileiro entra no top 10 de apostas para o Oscar 2026',
    summary: 'Produção nacional aparece em listas de críticos internacionais após premiação em Berlim.',
    image: IMG.celeb, status: 'atualizacao', importance: 3, isPremium: true,
    createdAt: 'há 6h', updatedAt: 'há 3h',
    topics: ['Cinema brasileiro', 'Oscar', 'Berlim'],
    sources: [ { name: 'Variety', time: 'há 6h' }, { name: 'Omelete', time: 'há 4h' } ],
    timeline: [ { time: 'Ontem', title: 'Filme vence prêmio em Berlim' } ],
    communityCount: 42, communityLive: 8,
  },
  {
    id: 'evt-08', slug: 'apagao-argentina-brasil-conexao',
    channel: 'mundo', title: 'Apagão na Argentina afeta interligação com sul do Brasil',
    summary: 'ONS confirma queda momentânea no sistema. Sem impacto no fornecimento nacional.',
    image: IMG.mundo2, status: 'atualizacao', importance: 2, isPremium: false,
    createdAt: 'há 7h', updatedAt: 'há 5h',
    topics: ['Argentina', 'Energia', 'Brasil'],
    sources: [ { name: 'Clarín', time: 'há 7h' }, { name: 'ONS', time: 'há 6h' } ],
    timeline: [ { time: '05:20', title: 'Rede argentina registra falha' }, { time: '05:45', title: 'ONS isola interconexão' } ],
    communityCount: 18, communityLive: 3,
  },
  {
    id: 'evt-09', slug: 'seleção-convocacao-eliminatorias',
    channel: 'futebol', title: 'Seleção Brasileira: convocação sai amanhã com 3 surpresas',
    summary: 'Técnico deve chamar dois jogadores da base e um retorno inesperado da Premier League.',
    image: IMG.futebol3, status: 'desenvolvimento', importance: 3, isPremium: true,
    createdAt: 'há 8h', updatedAt: 'há 6h',
    topics: ['Seleção', 'Eliminatórias', 'Convocação'],
    sources: [ { name: 'GE', time: 'há 8h' } ],
    timeline: [ { time: 'Manhã', title: 'Comissão técnica finaliza lista' } ],
    communityCount: 92, communityLive: 14,
  },
  {
    id: 'evt-10', slug: 'ministra-saude-recua-decreto',
    channel: 'politica', title: 'Ministra da Saúde recua e revoga decreto após pressão',
    summary: 'Após 72h de crise, texto polêmico foi revogado. Novo decreto sai na próxima semana.',
    image: IMG.politica, status: 'atualizacao', importance: 3, isPremium: true,
    createdAt: 'ontem', updatedAt: 'ontem',
    topics: ['Governo', 'Saúde', 'Decreto'],
    sources: [ { name: 'G1', time: 'ontem' } ],
    timeline: [ { time: '3 dias atrás', title: 'Decreto publicado' }, { time: 'Ontem', title: 'Revogação anunciada' } ],
    communityCount: 234, communityLive: 0,
  },
]

export function getEventsByChannel(channelId) {
  return EVENTS.filter(e => e.channel === channelId)
}

export function getEventBySlug(slug) {
  return EVENTS.find(e => e.slug === slug)
}

export function getChannelById(id) {
  return CHANNELS.find(c => c.id === id)
}

// Compute channel stats for the Home based on user's subscription
export function getChannelStats(channelId) {
  const evts = getEventsByChannel(channelId)
  const importantCount = evts.filter(e => e.importance >= 4).length
  return {
    total: evts.length,
    important: importantCount,
    live: evts.filter(e => e.status === 'agora').length,
  }
}
