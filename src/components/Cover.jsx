import { COVER_HTML } from '../data/content';

export default function Cover({ onStart }) {
  return (
    <div className="cover-page">
      <div dangerouslySetInnerHTML={{ __html: COVER_HTML }} />
      <div className="cover-start-wrap">
        <button className="cover-start-btn" onClick={onStart}>
          Começar <span className="cover-start-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
