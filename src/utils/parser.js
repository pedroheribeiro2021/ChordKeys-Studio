const CHORD_REGEX =
  /[A-G](#|b)?(m|maj7|7|º|dim|aug|sus2|sus4)?(\/[A-G](#|b)?)?/g;

export const parseChords = (input) => {
  if (!input) return [];

  const matches = input.match(CHORD_REGEX);

  return matches ? matches : [];
};
