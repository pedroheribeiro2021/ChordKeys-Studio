import { isChord } from "./chordUtils";

// Lista simples de acordes: "C G Am F", "C - G - Am", "| C | G |"
export const parseChords = (input) => {
  if (!input) return [];

  return input.split(/[\s,|-]+/).filter((token) => token && isChord(token));
};
