import { randomInt } from "crypto";

// Characters chosen to avoid visual ambiguity (no 0/O, 1/I/L) when printed small on a card.
const SHORT_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Non-sequential, printable 6-character code for the physical card. Not a security secret by itself. */
export function generateShortCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SHORT_CODE_ALPHABET[randomInt(0, SHORT_CODE_ALPHABET.length)];
  }
  return code;
}
