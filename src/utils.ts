import { parseChord } from "scale-workshop-core";
import { computed, type ComputedRef } from "vue";
import { gcd, mmod } from "xen-dev-utils";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "./constants";

export function parseChordInput(input: string) {
  const separator = input.includes(":") ? ":" : /\s/;
  return parseChord(input, DEFAULT_NUMBER_OF_COMPONENTS, separator);
}

export function debounce(func: (...args: any[]) => void, timeout = 300) {
  let timer: number;
  return (...args: any[]) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

const MIDI_NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// Find MIDI note name from MIDI note number
export function midiNoteNumberToName(noteNumber: number) {
  const remainder = mmod(noteNumber, 12);
  const quotient = (noteNumber - remainder) / 12;
  return MIDI_NOTE_NAMES[remainder] + quotient.toString();
}

export function sanitizeFilename(input: string) {
  input = input.trim();
  if (!input.length) {
    return "untitled scale";
  }
  return input
    .replace(/[|&;$%@"<>()+,?]/g, "")
    .replace(/\//g, "_")
    .replace(/\\/g, "_");
}

export function formatExponential(x: number, fractionDigits = 3) {
  if (Math.abs(x) < 10000) {
    return x.toFixed(fractionDigits);
  }
  const e = Math.floor(Math.log10(Math.abs(x)));
  const f = 10 ** (fractionDigits - e);
  const d = 0.1 ** fractionDigits;
  return (d * Math.round(x * f)).toFixed(fractionDigits) + "e+" + e.toString();
}

export function formatHertz(frequency: number, fractionDigits = 3) {
  const magnitude = Math.abs(frequency);

  // Use regular formatting for magnitudes within human limits
  if (1 <= magnitude && magnitude < 100000) {
    return frequency.toFixed(fractionDigits) + "Hz";
  }

  // Submultiples
  if (magnitude < 1e-21) {
    return (frequency * 1e24).toFixed(fractionDigits) + "yHz";
  }
  if (magnitude < 1e-18) {
    return (frequency * 1e21).toFixed(fractionDigits) + "zHz";
  }
  if (magnitude < 1e-15) {
    return (frequency * 1e18).toFixed(fractionDigits) + "aHz";
  }
  if (magnitude < 1e-12) {
    return (frequency * 1e15).toFixed(fractionDigits) + "fHz";
  }
  if (magnitude < 1e-9) {
    return (frequency * 1e12).toFixed(fractionDigits) + "pHz";
  }
  if (magnitude < 1e-6) {
    return (frequency * 1e9).toFixed(fractionDigits) + "nHz";
  }
  if (magnitude < 1e-3) {
    return (frequency * 1e6).toFixed(fractionDigits) + "µHz";
  }
  if (magnitude < 1) {
    return (frequency * 1e3).toFixed(fractionDigits) + "mHz";
  }

  // Too large. Use scientific notation.
  if (magnitude > 1e28) {
    return formatExponential(frequency) + "Hz";
  }

  // Multiples
  if (magnitude > 1e24) {
    return (frequency * 1e-24).toFixed(fractionDigits) + "YHz";
  }
  if (magnitude > 1e21) {
    return (frequency * 1e-21).toFixed(fractionDigits) + "ZHz";
  }
  if (magnitude > 1e18) {
    return (frequency * 1e-18).toFixed(fractionDigits) + "EHz";
  }
  if (magnitude > 1e15) {
    return (frequency * 1e-15).toFixed(fractionDigits) + "PHz";
  }
  if (magnitude > 1e12) {
    return (frequency * 1e-12).toFixed(fractionDigits) + "THz";
  }
  if (magnitude > 1e9) {
    return (frequency * 1e-9).toFixed(fractionDigits) + "GHz";
  }
  if (magnitude > 1e6) {
    return (frequency * 1e-6).toFixed(fractionDigits) + "MHz";
  }
  return (frequency * 1e-3).toFixed(fractionDigits) + "kHz";
}

export function autoKeyColors(size: number) {
  if (size < 2) {
    return ["white"];
  }
  if (size === 3) {
    return ["white", "black", "white"];
  }
  if (size === 5) {
    return ["white", "black", "white", "black", "white"];
  }
  if (size === 6) {
    return ["white", "black", "white", "black", "white", "black"];
  }

  let generator = Math.round(Math.log2(4 / 3) * size);
  while (gcd(generator, size) > 1) {
    generator--;
  }

  const result: string[] = Array(size).fill("black");
  let index = mmod(-2 * generator, size);
  let hasBlackClusters = true;
  do {
    result[index] = "white";
    hasBlackClusters = false;
    for (let i = 0; i < size - 1; ++i) {
      if (result[i] === "black" && result[i + 1] === "black") {
        hasBlackClusters = true;
        break;
      }
    }
    index = mmod(index + generator, size);
  } while (hasBlackClusters);

  return result;
}

/**
 * Fill in the gaps of a parent scale (in white) with accidentals (in black).
 * @param generatorPerPeriod Generator sizre divided by period size (in pitch space).
 * @param size Size of the parent scale.
 * @param down Number of generators to go down from 1/1.
 * @returns Array of key colors.
 */
export function gapKeyColors(
  generatorPerPeriod: number,
  size: number,
  down: number,
  flats = true
) {
  const scale = [...Array(size).keys()].map((i) =>
    mmod(generatorPerPeriod * (i - down), 1)
  );
  scale.sort((a, b) => a - b);
  const colors = Array(size).fill("white");

  let i = size - down;
  let delta = 1;
  if (flats) {
    i = -down - 1;
    delta = -1;
  }
  // Limit for sanity
  while (Math.abs(i) < 1000) {
    const newNote = mmod(generatorPerPeriod * i, 1);
    let gapFound = false;
    for (let j = 1; j < scale.length; ++j) {
      const oldNote = scale[j];
      if (oldNote > newNote) {
        if (colors[j] === "black" || colors[j - 1] === "black") {
          return colors;
        } else {
          scale.splice(j, 0, newNote);
          colors.splice(j, 0, "black");
        }
        gapFound = true;
        break;
      }
    }
    if (!gapFound) {
      if (colors[colors.length - 1] === "black" || colors[0] === "black") {
        return colors;
      }
      scale.push(newNote);
      colors.push("black");
    }

    i += delta;
  }

  return colors;
}

// Wrapper for a computed property that can fail.
// The error string is non-empty when the property fails to compute.
export function computedAndError<T>(
  getter: () => T,
  defaultValue: T
): [ComputedRef<T>, ComputedRef<string>] {
  const valueAndError = computed<[T, string]>(() => {
    try {
      return [getter(), ""];
    } catch (error) {
      if (error instanceof Error) {
        return [defaultValue, error.message || " "];
      }
      return [defaultValue, "" + error || " "];
    }
  });
  const value = computed(() => valueAndError.value[0]);
  const error = computed(() => valueAndError.value[1]);
  return [value, error];
}
