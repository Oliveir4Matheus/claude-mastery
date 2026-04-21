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

export const CHAPTERS = [
  {
    id: 'ch01',
    num: 'Capítulo 01',
    title: 'Título do primeiro capítulo',
    objective: 'Defina em uma frase o que o aluno aprenderá.',
    week: 'Semana 1',
    icon: '📘',
    quiz: [
      {
        question: 'Pergunta de exemplo — substitua pelo conteúdo real.',
        options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        correct: 0,
        explanation: 'Explique por que a opção correta é correta.',
        whyPrompt: 'Pergunta aberta para forçar elaboração (opcional).',
      },
    ],
    checkpoints: [],
    challenges: [
      {
        id: 'ch01-c1',
        title: 'Exercício prático de exemplo',
        description: 'Descreva o que o aluno deve fazer no mundo real.',
        criteria: ['Critério verificável 1', 'Critério verificável 2'],
      },
    ],
  },
];
