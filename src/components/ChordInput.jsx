export default function ChordInput({ value, onChange, onPlay }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Custom Song</h3>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ width: "300px" }}
      />

      <br />

      <button onClick={onPlay} style={{ marginTop: "10px" }}>
        Play Input
      </button>
    </div>
  );
}
