// A nota soa enquanto a tecla está apertada (mouse, toque ou Enter/Espaço)
export default function Key({ note, isBlack, isActive, onPress, onRelease }) {
  const classes = ["key", isBlack ? "key-black" : "key-white", isActive && "is-active"];

  const release = () => onRelease(note);

  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(" ")}
      aria-label={note}
      onPointerDown={(e) => {
        // Mantém os eventos nesta tecla mesmo se o dedo escorregar
        e.currentTarget.setPointerCapture?.(e.pointerId);
        onPress(note);
      }}
      onPointerUp={release}
      // O navegador cancela o toque quando ele vira rolagem do teclado
      onPointerCancel={release}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          onPress(note);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" || e.key === " ") release();
      }}
      onBlur={release}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
