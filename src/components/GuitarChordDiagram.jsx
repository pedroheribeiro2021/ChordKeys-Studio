import { getGuitarShape } from "../utils/guitar";

const STRINGS = 6;
const FRETS_SHOWN = 4;
const X0 = 14;
const STRING_GAP = 12;
const Y0 = 22;
const FRET_GAP = 16;

const stringX = (s) => X0 + s * STRING_GAP;
const WIDTH = stringX(STRINGS - 1) - X0;

// Diagrama do acorde no braço: cordas na vertical (6ª à esquerda), casas na horizontal
export default function GuitarChordDiagram({ chord }) {
  const shape = getGuitarShape(chord);
  if (!shape) return null;

  const { frets, barre } = shape;
  const pressed = frets.filter((f) => f > 0);
  const maxFret = Math.max(0, ...pressed);
  const baseFret = maxFret <= FRETS_SHOWN ? 1 : Math.min(...pressed);
  const fretY = (f) => Y0 + (f - baseFret + 0.5) * FRET_GAP;

  const barreStrings = barre
    ? frets.map((f, s) => (f === barre ? s : null)).filter((s) => s !== null)
    : [];

  const description = frets
    .map((f, s) => `${6 - s}ª ${f < 0 ? "não toca" : f === 0 ? "solta" : `casa ${f}`}`)
    .join(", ");

  return (
    <figure className="guitar-diagram">
      <figcaption>{chord}</figcaption>
      <svg viewBox="0 0 88 100" role="img" aria-label={`${chord}: ${description}`}>
        {/* Pestana do braço (só aparece quando o desenho começa na 1ª casa) */}
        {baseFret === 1 ? (
          <rect x={X0 - 1} y={Y0 - 3} width={WIDTH + 2} height={3} className="gd-nut" />
        ) : (
          <text x={X0 + WIDTH + 4} y={fretY(baseFret) + 3} className="gd-label">
            {baseFret}ª
          </text>
        )}

        {Array.from({ length: FRETS_SHOWN + 1 }, (_, i) => (
          <line key={`f${i}`} x1={X0} x2={X0 + WIDTH} y1={Y0 + i * FRET_GAP} y2={Y0 + i * FRET_GAP} className="gd-line" />
        ))}
        {Array.from({ length: STRINGS }, (_, s) => (
          <line key={`s${s}`} x1={stringX(s)} x2={stringX(s)} y1={Y0} y2={Y0 + FRETS_SHOWN * FRET_GAP} className="gd-line" />
        ))}

        {barreStrings.length > 1 && (
          <rect
            x={stringX(barreStrings[0]) - 5}
            y={fretY(barre) - 5}
            width={stringX(barreStrings.at(-1)) - stringX(barreStrings[0]) + 10}
            height={10}
            rx={5}
            className="gd-dot"
          />
        )}

        {frets.map((f, s) => {
          if (f < 0) {
            return (
              <text key={s} x={stringX(s)} y={Y0 - 7} className="gd-mark">
                ×
              </text>
            );
          }
          if (f === 0) {
            return <circle key={s} cx={stringX(s)} cy={Y0 - 10} r={3} className="gd-open" />;
          }
          if (f === barre && barreStrings.length > 1) return null;
          return <circle key={s} cx={stringX(s)} cy={fretY(f)} r={5} className="gd-dot" />;
        })}
      </svg>
    </figure>
  );
}
