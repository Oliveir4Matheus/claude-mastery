export default function ProgressBar({ current, total }) {
  const pct = ((current + 1) / total * 100).toFixed(2);
  return (
    <div className="reader-progress">
      <div className="reader-progress-fill" style={{ width: pct + '%' }} />
    </div>
  );
}
