export const parseChords = (input) => {
  return input
    .replace(/\n/g, " ")
    .split(" ")
    .map((chord) => chord.trim())
    .filter((chord) => chord.length > 0);
};
