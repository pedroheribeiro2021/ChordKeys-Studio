export default function Key({ note, isBlack, isActive, onPlay }) {
  const classes = ["key", isBlack ? "key-black" : "key-white", isActive && "is-active"];

  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(" ")}
      aria-label={note}
      onClick={() => onPlay(note)}
    />
  );
}
