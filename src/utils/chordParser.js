import { parseChord as parseSymbol, getIntervals } from "./chordUtils";

const canonicalize = (suffix) =>
  suffix
    .replace(/maj7|M7|Δ/g, "7M")
    .replace(/[º°]/g, "dim")
    .replace(/ø/g, "m7(b5)")
    .replace(/^\+$/, "aug")
    .replace(/min/g, "m");

export function parseChord(chord) {
  const symbol = parseSymbol(chord);
  if (!symbol) return null;

  const suffix = canonicalize(symbol.suffix);
  let quality = "major";
  if (/m7\(b5\)|m7b5/.test(suffix)) quality = "half-diminished";
  else if (/dim/.test(suffix)) quality = "diminished";
  else if (/aug/.test(suffix)) quality = "augmented";
  else if (/sus2/.test(suffix)) quality = "sus2";
  else if (/sus/.test(suffix)) quality = "sus4";
  else if (/^m(?!aj)/.test(suffix)) quality = "minor";
  else if (/^5(?:\(|$)/.test(suffix)) quality = "power";

  const seventh = quality === "half-diminished"
    ? "minor"
    : /7M/.test(suffix)
      ? "major"
      : /dim7/.test(suffix)
        ? "diminished"
        : (/7|9|11|13/.test(suffix) && !suffix.includes("6/9"))
          ? "minor"
          : null;
  const numericTokens = [...suffix.matchAll(/([b#]?)(\d+)([+-]?)/g)];
  const extensions = numericTokens
    .filter(([, accidental, value, sign]) =>
      !accidental && !sign && [6, 9, 11, 13].includes(Number(value)),
    )
    .map(([, , value]) => value);
  const alterations = numericTokens
    .filter(([, accidental, value, sign]) =>
      value !== "7" && (accidental || sign || ![6, 9, 11, 13].includes(Number(value))),
    )
    .map(([, accidental, value, sign]) => `${accidental}${value}${sign}`);

  return {
    root: symbol.root,
    quality,
    seventh,
    extensions: [...new Set(extensions)],
    alterations: [...new Set(alterations)],
    bass: symbol.bass,
    raw: chord,
    suffix,
    intervals: getIntervals(symbol.suffix),
  };
}

export function formatChord(parsed) {
  if (!parsed?.root) return "";
  const qualitySuffix = {
    major: "",
    minor: "m",
    diminished: "dim",
    "half-diminished": "m7(b5)",
    augmented: "aug",
    sus2: "sus2",
    sus4: "sus4",
    power: "5",
  }[parsed.quality] ?? "";

  let suffix = qualitySuffix;
  if (parsed.quality !== "half-diminished") {
    if (parsed.seventh === "major") suffix += "7M";
    else if (parsed.seventh === "minor") suffix += "7";
    else if (parsed.seventh === "diminished") suffix += "7";
  }
  const extensions = [...(parsed.extensions ?? [])];
  const alterations = [...(parsed.alterations ?? [])];
  let wroteSixNine = false;
  if (extensions.includes("6") && extensions.includes("9")) {
    suffix += "6/9";
    extensions.splice(extensions.indexOf("9"), 1);
    extensions.splice(extensions.indexOf("6"), 1);
    wroteSixNine = true;
  }
  const rawSuffix = parsed.raw ? parseSymbol(parsed.raw)?.suffix : "";
  const rawTensions = [...(rawSuffix ?? "").matchAll(/([b#]?)(\d+)([+-]?)/g)]
    .filter(([, , degree]) => degree !== "7")
    .map(([, accidental, degree, sign]) => `${accidental}${degree}${sign}`);
  const structuredTensions = [...(parsed.extensions ?? []), ...alterations];
  const hasSameTensions =
    rawTensions.length === structuredTensions.length &&
    rawTensions.every((tension) => structuredTensions.includes(tension));
  const tensions = hasSameTensions
    ? rawTensions.filter((tension) => !wroteSixNine || !["6", "9"].includes(tension))
    : [...extensions, ...alterations];
  if (tensions.length) suffix += `(${tensions.join("/")})`;
  return `${parsed.root}${suffix}${parsed.bass ? `/${parsed.bass}` : ""}`;
}

export function chordIntervals(chord) {
  return parseChord(chord)?.intervals ?? [];
}
