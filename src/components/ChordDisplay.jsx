export default function ChordDisplay({ currentChord }) {
  return (
    <div
      style={{
        marginTop: "20px",
        color: "#ff4d4f",
        fontSize: "32px",
        fontWeight: "bold",
      }}
    >
      <h2>{currentChord ? `Playing: ${currentChord}` : "No chord playing"}</h2>
    </div>
  );
}
