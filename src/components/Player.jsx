export default function Player({ onPlay, onPause, onStop }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Player</h3>

      <button onClick={onPlay}>Play</button>
      <button onClick={onPause}>Pause</button>
      <button onClick={onStop}>Stop</button>
    </div>
  );
}
