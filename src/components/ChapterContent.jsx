import { CONTENT } from '../data/content';

export default function ChapterContent({ chapter, onQuiz }) {
  return (
    <div className="chapter-page">
      <div dangerouslySetInnerHTML={{ __html: CONTENT[chapter.id] || '' }} />
      <div className="chapter-footer">
        <p className="chapter-footer-label">Conteúdo concluído? Teste seus conhecimentos.</p>
        <button className="chapter-quiz-btn" onClick={onQuiz}>
          Fazer Avaliação →
        </button>
      </div>
    </div>
  );
}
