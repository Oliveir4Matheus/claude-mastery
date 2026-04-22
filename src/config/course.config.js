// course.config.js
// Manifesto único do curso. O cookbook edita este arquivo.
//
// Preencha aqui tudo que é específico do seu curso:
//   brand      — nome, tagline, logo, textos do certificado
//   theme      — paleta de cores (injetada em runtime como CSS vars)
//   worlds     — agrupamento de capítulos em "mundos" do JourneyMap
//
// A lista de capítulos continua em `src/data/chapters.js` e o HTML em
// `src/data/extracted.json` (content/cover/toc). O cookbook popula os três.

export const COURSE = {
  brand: {
    name: import.meta.env.VITE_BRAND_NAME || 'Data Analysis com Python',
    shortName: import.meta.env.VITE_BRAND_SHORT || 'DataPy',
    tagline: import.meta.env.VITE_BRAND_TAGLINE || 'Transforme dados em decisões com Python, pandas e Jupyter.',
    logo: '📊',
    storagePrefix: import.meta.env.VITE_BRAND_STORAGE_PREFIX || 'datapy-course',
    certificateWatermark: import.meta.env.VITE_BRAND_CERT_WATERMARK || 'L E A R N  D A T A  A N A L Y S I S  W I T H  P Y T H O N',
    certificateFooter: 'Plataforma de Aprendizagem Interativa  |  Certificado verificável',
    validateUrl: import.meta.env.VITE_VALIDATE_URL || '/validate',
  },

  theme: {
    primary: '#A855F7',
    primaryLight: '#C084FC',
    primaryDark: '#7E22CE',
    bg0: '#0F0F14',
    bg1: '#16161D',
    bg2: '#1C1C26',
    bgt: '#0A0A10',
    tx: '#E8E4DF',
    tx2: '#9B9690',
    tx3: '#6B6560',
    green: '#6BCB77',
    red: '#E85D5D',
    blue: '#5B8DEF',
    purple: '#B07FD0',
    border: '#2A2A35',
  },

  // Ligar/desligar features do motor. O cookbook pode desligar, nunca adicionar.
  // Quiz e SRS são o coração do motor — não há flag para desligá-los.
  features: {
    streaks: true,         // contagem de dias seguidos de revisão
    challenges: true,      // desafios práticos por capítulo
    journeyMap: true,      // Mapa da Jornada visual
    certificates: true,    // certificados de capítulo
    worldCertificates: true, // certificados de mundo completo
    analytics: true,       // abas de gráficos no ProfilePage
    retrievalCheckpoints: true, // checkpoints inline durante a leitura
    calibration: true,     // calibração de confiança no quiz
  },

  // Agrupamento de capítulos no Mapa da Jornada.
  // O ID de cada capítulo deve bater com o `id` em src/data/chapters.js.
  // Se nenhum mundo for definido, o Mapa esconde as faixas e exibe apenas nós.
  worlds: [
    {
      id: 'world-1',
      label: 'MUNDO 1',
      sub: 'FUNDAMENTOS',
      emoji: '🌱',
      chapterIds: ['ch01'],
    },
    {
      id: 'world-2',
      label: 'MUNDO 2',
      sub: 'DOMINANDO PANDAS',
      emoji: '🐼',
      chapterIds: ['ch02', 'ch03', 'ch04'],
    },
    {
      id: 'world-3',
      label: 'MUNDO 3',
      sub: 'DO DADO BRUTO AO LIMPO',
      emoji: '🧪',
      chapterIds: ['ch05', 'ch06', 'ch07'],
    },
    {
      id: 'world-4',
      label: 'MUNDO 4',
      sub: 'ANÁLISE E INSIGHT',
      emoji: '🎯',
      chapterIds: ['ch08', 'ch09', 'ch10', 'ch11'],
    },
  ],
};

// Aplica a paleta do tema em CSS vars (--co, --bg0, etc.)
// Chamado uma vez no boot a partir de main.jsx.
export function applyTheme() {
  const t = COURSE.theme;
  const root = document.documentElement.style;
  root.setProperty('--co', t.primary);
  root.setProperty('--co-l', t.primaryLight);
  root.setProperty('--co-d', t.primaryDark);
  root.setProperty('--bg0', t.bg0);
  root.setProperty('--bg1', t.bg1);
  root.setProperty('--bg2', t.bg2);
  root.setProperty('--bgt', t.bgt);
  root.setProperty('--tx', t.tx);
  root.setProperty('--tx2', t.tx2);
  root.setProperty('--tx3', t.tx3);
  root.setProperty('--grn', t.green);
  root.setProperty('--red', t.red);
  root.setProperty('--blu', t.blue);
  root.setProperty('--pur', t.purple);
  root.setProperty('--brd', t.border);
  document.title = COURSE.brand.name;
}
