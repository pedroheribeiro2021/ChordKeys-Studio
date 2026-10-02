import { useRef } from "react";
import { ACCEPTED_FILES } from "../utils/importers";

const PLACEHOLDER = `Cole a cifra aqui ou abra um arquivo (.txt, .pdf, ChordPro). Ex.:

C              G/B
Quando a luz dos olhos meus

Vazio, o ▶ toca uma progressão de exemplo.`;

export default function ChordInput({
  value,
  onChange,
  onPasteText,
  onPasteFromClipboard,
  onOpenFile,
  isImporting,
  importMessage,
  beatsPerChord,
  onBeatsPerChordChange,
  onClear,
}) {
  const fileRef = useRef(null);

  // Colar numa caixa vazia passa pela limpeza (cabeçalho, tablatura, tabs)
  const handlePaste = (e) => {
    if (value.trim()) return;
    const text = e.clipboardData?.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    onPasteText(text);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onOpenFile(file);
  };

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn" onClick={onPasteFromClipboard} disabled={isImporting}>
          Colar cifra
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => fileRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? "Abrindo…" : "Abrir arquivo"}
        </button>
        <input ref={fileRef} type="file" accept={ACCEPTED_FILES} hidden onChange={handleFile} />
      </div>

      {importMessage && (
        <p className={importMessage.error ? "error" : "muted"} role="status">
          {importMessage.text}
        </p>
      )}

      <textarea
        className="input"
        aria-label="Cifra"
        placeholder={PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        rows={10}
        spellCheck={false}
      />

      <div className="row">
        <label className="field-label" htmlFor="beats-per-chord">
          Batidas por acorde
        </label>
        <select
          id="beats-per-chord"
          className="input input-auto"
          value={beatsPerChord}
          onChange={(e) => onBeatsPerChordChange(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 6, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost push-right" onClick={onClear}>
          Limpar
        </button>
      </div>
    </div>
  );
}
