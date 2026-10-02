import { useMemo, useState } from "react";
import GuitarChordDiagram from "./GuitarChordDiagram";
import SaveSong from "./SaveSong";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { formatSheet, sheetChords } from "../utils/sheet";
import { simplifyChord, suggestCapo } from "../utils/guitar";
import { transposeChord } from "../utils/transpose";

const MAX_CAPO = 7;
const SPEED_STEP_PX = 4; // px/s por nível de velocidade
const FONT_SIZES = [12, 13, 14, 16, 18, 20, 22];

const formatTranspose = (value) => (value > 0 ? `+${value}` : `${value}`);

export default function GuitarView({
  text,
  meta,
  onSave,
  transpose,
  onTransposeChange,
  capo,
  onCapoChange,
  simplify,
  onSimplifyChange,
  onGoTo,
}) {
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [fontIndex, setFontIndex] = useState(2);

  useAutoScroll(scrolling, speed * SPEED_STEP_PX, () => setScrolling(false));

  // Com capo na casa N, a cifra mostra o formato tocado (N semitons abaixo do som real)
  const lines = useMemo(
    () =>
      formatSheet(text, (chord) => {
        const shaped = transposeChord(chord, transpose - capo);
        return simplify ? simplifyChord(shaped) : shaped;
      }),
    [text, transpose, capo, simplify],
  );

  const chords = useMemo(() => sheetChords(lines), [lines]);

  // Sugestão calculada sobre os acordes no tom que soa (sem capo)
  const suggestion = useMemo(() => {
    const sounding = sheetChords(formatSheet(text, (c) => transposeChord(c, transpose)));
    return suggestCapo(sounding, { maxCapo: MAX_CAPO, simplify });
  }, [text, transpose, simplify]);

  if (!text.trim()) {
    return (
      <section className="card stack">
        <h2 className="card-title">Violão</h2>
        <p className="muted">
          Nenhuma cifra aberta. Cole uma no Estúdio ou abra uma das suas cifras salvas.
        </p>
        <div className="row">
          <button type="button" className="btn" onClick={() => onGoTo("estudio")}>
            Ir para o Estúdio
          </button>
          <button type="button" className="btn" onClick={() => onGoTo("cifras")}>
            Minhas cifras
          </button>
        </div>
      </section>
    );
  }

  const capoIsBetter = suggestion.capo !== capo && suggestion.barres < suggestion.barresWithoutCapo;

  return (
    <>
      <section className="card" aria-labelledby="guitar-title">
        <div className="card-header">
          <div>
            <h2 className="song-title" id="guitar-title">
              {meta.title || "Cifra sem título"}
            </h2>
            {meta.artist && <p className="muted">{meta.artist}</p>}
          </div>
          <SaveSong meta={meta} onSave={onSave} />
        </div>

        <div className="guitar-controls">
          <button
            type="button"
            className="btn btn-sm"
            aria-pressed={simplify}
            onClick={() => onSimplifyChange(!simplify)}
          >
            Simplificar acordes
          </button>

          <label className="row field-label">
            Capo
            <select
              className="input input-auto"
              value={capo}
              onChange={(e) => onCapoChange(Number(e.target.value))}
            >
              <option value={0}>Sem capo</option>
              {Array.from({ length: MAX_CAPO }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}ª casa
                </option>
              ))}
            </select>
          </label>

          <div className="row" role="group" aria-label="Tamanho da letra">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setFontIndex((i) => Math.max(0, i - 1))}
              aria-label="Diminuir letra"
            >
              A−
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setFontIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
              aria-label="Aumentar letra"
            >
              A+
            </button>
          </div>
        </div>

        {capoIsBetter && (
          <p className="hint">
            {suggestion.capo === 0
              ? "Sem capo"
              : `Capo na ${suggestion.capo}ª casa`}{" "}
            deixa {suggestion.barres === 0 ? "nenhum acorde" : `${suggestion.barres} acorde(s)`} com
            pestana (hoje: {suggestion.barresWithoutCapo}).{" "}
            <button type="button" className="link" onClick={() => onCapoChange(suggestion.capo)}>
              Usar
            </button>
          </p>
        )}

        {chords.length > 0 && (
          <div className="guitar-diagrams" aria-label="Desenhos dos acordes">
            {chords.map((chord) => (
              <GuitarChordDiagram key={chord} chord={chord} />
            ))}
          </div>
        )}
      </section>

      <section className="card" aria-label="Cifra">
        {(capo > 0 || transpose !== 0) && (
          <p className="muted sheet-info">
            {capo > 0 && `Capo na ${capo}ª casa. `}
            {transpose !== 0 && `Tom ${formatTranspose(transpose)}.`}
          </p>
        )}
        <pre className="sheet" style={{ fontSize: FONT_SIZES[fontIndex] }}>
          {lines.map((line, i) =>
            line.type === "text" ? (
              <div key={i}>{line.text || " "}</div>
            ) : (
              <div key={i}>
                {line.parts.map((part, j) =>
                  part.chord ? (
                    <b key={j} className="sheet-chord">
                      {part.text}
                    </b>
                  ) : (
                    <span key={j}>{part.text}</span>
                  ),
                )}
              </div>
            ),
          )}
        </pre>
      </section>

      <div className="transport" role="region" aria-label="Rolagem automática">
        <div className="transport-inner">
          <div className="transport-main">
            <button
              type="button"
              className="btn btn-primary transport-play"
              onClick={() => setScrolling((s) => !s)}
              aria-label={scrolling ? "Parar rolagem" : "Rolar automaticamente"}
            >
              {scrolling ? "❚❚" : "▼"}
            </button>

            <div className="stepper" role="group" aria-label="Velocidade da rolagem">
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => setSpeed((s) => Math.max(1, s - 1))}
                aria-label="Mais devagar"
              >
                −
              </button>
              <span className="transpose-value" aria-live="polite">
                Vel. {speed}
              </span>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => setSpeed((s) => Math.min(10, s + 1))}
                aria-label="Mais rápido"
              >
                +
              </button>
            </div>

            <div className="transpose" role="group" aria-label="Tom">
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => onTransposeChange(transpose - 1)}
                aria-label="Baixar meio tom"
              >
                −
              </button>
              <span className="transpose-value">Tom {formatTranspose(transpose)}</span>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => onTransposeChange(transpose + 1)}
                aria-label="Subir meio tom"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
