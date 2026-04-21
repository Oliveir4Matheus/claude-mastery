// chapters.js
// Lista de capítulos do curso. Template vazio — o cookbook preenche isto.
//
// Contrato de cada capítulo:
//   id          — identificador estável (ex.: 'ch01'). Usado como chave no banco.
//   num         — rótulo exibido (ex.: 'Capítulo 01').
//   title       — título do capítulo.
//   objective   — frase única explicando o que o aluno vai aprender.
//   week        — rótulo livre (ex.: 'Semana 1', 'Módulo A', 'Parte I').
//   icon        — 1 emoji/caractere para o card e o mapa.
//   quiz        — array de questões (≥5 recomendado). Campos:
//                   question, options[4], correct (índice 0-3),
//                   explanation (texto curto do porquê),
//                   whyPrompt (pergunta aberta de elaboração, opcional).
//   checkpoints — retrieval practice inline. Campos:
//                   insertAfter (seletor CSS dentro do HTML do capítulo),
//                   prompt, expectedAnswer.
//   challenges  — desafios práticos. Campos:
//                   id (único), title, description, criteria[].
//
// O HTML renderizável de cada capítulo mora em src/data/extracted.json,
// na chave `chapters[*].content` com mesmo `id`.

const placeholderQuiz = [
  {
    question: 'Conteúdo em geração — o cookbook preencherá este quiz na Fase 6.',
    options: ['Aguardar geração', 'Opção B', 'Opção C', 'Opção D'],
    correct: 0,
    explanation: 'O conteúdo real será gerado por subagents Sonnet na fase de geração de capítulos.',
  },
];

export const CHAPTERS = [
  {
    id: 'ch01',
    num: 'Capítulo 01',
    title: 'Jupyter e IPython: Seu Ambiente',
    objective: 'Dominar o Jupyter Notebook e IPython como ambiente para análise interativa de dados.',
    week: 'Semana 1',
    icon: '📓',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch02',
    num: 'Capítulo 02',
    title: 'NumPy: Arrays, Indexação e Broadcasting',
    objective: 'Criar, indexar e operar arrays NumPy usando broadcasting e vetorização.',
    week: 'Semana 1',
    icon: '⚡',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch03',
    num: 'Capítulo 03',
    title: 'pandas Series: Dados Unidimensionais',
    objective: 'Compreender Series como estrutura rotulada 1D e suas operações básicas.',
    week: 'Semana 2',
    icon: '📈',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch04',
    num: 'Capítulo 04',
    title: 'pandas DataFrame: O Núcleo',
    objective: 'Construir e manipular DataFrames, a estrutura central da análise com pandas.',
    week: 'Semana 2',
    icon: '📊',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch05',
    num: 'Capítulo 05',
    title: 'Seleção e Indexação Avançada',
    objective: 'Selecionar dados com precisão usando .loc, .iloc e indexação booleana.',
    week: 'Semana 2',
    icon: '🎯',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch06',
    num: 'Capítulo 06',
    title: 'Carregando e Inspecionando Dados',
    objective: 'Importar CSV, Excel e JSON e inspecionar DataFrames com head, info e describe.',
    week: 'Semana 3',
    icon: '📥',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch07',
    num: 'Capítulo 07',
    title: 'Limpeza e Transformação de Dados',
    objective: 'Tratar valores faltantes, duplicatas, tipos e transformar colunas com apply e map.',
    week: 'Semana 3',
    icon: '🧹',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch08',
    num: 'Capítulo 08',
    title: 'Manipulação: Merge, Concat e Pivot',
    objective: 'Combinar, concatenar e remodelar DataFrames com merge, concat e pivot_table.',
    week: 'Semana 3',
    icon: '🔀',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch09',
    num: 'Capítulo 09',
    title: 'GroupBy e Agregação',
    objective: 'Aplicar o padrão split-apply-combine para analisar dados por grupos.',
    week: 'Semana 4',
    icon: '🧮',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch10',
    num: 'Capítulo 10',
    title: 'Matplotlib e Gráficos',
    objective: 'Criar gráficos exploratórios e informativos com matplotlib e pandas.plot.',
    week: 'Semana 4',
    icon: '📉',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch11',
    num: 'Capítulo 11',
    title: 'EDA Guiada: Do Dado Novo ao Insight',
    objective: 'Aplicar um método sistemático de análise exploratória em datasets desconhecidos.',
    week: 'Semana 4',
    icon: '🔎',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
  {
    id: 'ch12',
    num: 'Capítulo 12',
    title: 'Case Final: Análise de MovieLens',
    objective: 'Integrar todas as técnicas do curso em um projeto real de análise de dados.',
    week: 'Semana 5',
    icon: '🎬',
    quiz: placeholderQuiz,
    checkpoints: [],
    challenges: [],
  },
];
