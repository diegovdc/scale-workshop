import Scale from "@/scale";
import { LINE_TYPE, getLineType, parseLine } from "@/parser";
import { NEWLINE_TEST, UNIX_NEWLINE } from "@/constants";
import type { Interval } from "@/interval";

// decodes HTML entities
function decodeHTML(input: string): string {
  const doc = new DOMParser().parseFromString(input, "text/html");
  if (doc.documentElement.textContent === null) {
    throw new Error("Failed to decode HTML");
  }
  return doc.documentElement.textContent;
}

// parses Scala entries from the Xenharmonic Wiki
function parseWiki(str: string) {
  let s = decodeHTML(str);
  s = s.replace(/[_ ]+/g, ""); // remove underscores and spaces
  let a = s.split(NEWLINE_TEST); // split by line into an array
  a = a.filter(
    (line) => !line.startsWith("<") && !line.startsWith("{") && line.length
  ); // remove <nowiki> tag, wiki templates and blank lines
  a = a.map((line) => line.split("!")[0]); // remove .scl comments
  a = a.slice(2); // remove .scl metadata
  return a.join(UNIX_NEWLINE);
}

class SearchParams {
  url: URL;

  constructor(url: URL) {
    this.url = url;
  }

  get(key: string): string | undefined;
  get(key: string, valueIfMissing: string): string;
  get(key: string, valueIfMissing?: string) {
    if (!this.url.searchParams.has(key)) {
      return valueIfMissing;
    }
    return this.url.searchParams.get(key)!;
  }

  getNumber(key: string): number | undefined;
  getNumber(key: string, valueIfMissingOrNaN: number): number;
  getNumber(key: string, valueIfMissingOrNaN?: number) {
    if (!this.url.searchParams.has(key)) {
      return valueIfMissingOrNaN;
    }
    const value = parseFloat(this.url.searchParams.get(key) as string);
    if (isNaN(value)) {
      return valueIfMissingOrNaN;
    }
    return value;
  }
}

/**
 * Re-implementation of the original parse_url() from Scale Workshop 1
 */
export class ScaleWorkshopOneData {
  name: string;
  data: string | undefined;
  freq: number;
  midi: number;
  source: string;
  vertical: number;
  horizontal: number;
  colors: string | undefined;
  waveform: string | undefined;
  ampenv: string | undefined;

  constructor(url?: URL) {
    if (url === undefined) {
      url = new URL(window.location.href);
    }
    const searchParams = new SearchParams(url);

    // get data from url params, and use sane defaults for tuning name, base frequency and base midi note number if data missing
    this.name = searchParams.get("name", "");
    this.data = searchParams.get("data");
    this.freq = searchParams.getNumber("freq", 440);
    this.midi = searchParams.getNumber("midi", 69);
    this.source = searchParams.get("source", "");

    // get isomorphic keyboard mapping
    this.vertical = searchParams.getNumber("vert", 5);
    this.horizontal = searchParams.getNumber("horiz", 1);

    // get key colours
    this.colors = searchParams.get("colors");

    // get synth options
    this.waveform = searchParams.get("waveform");
    this.ampenv = searchParams.get("ampenv");

    // bail if there is no data
    if (this.data === undefined) {
      return;
    }

    // specially parse inputs from the Xenharmonic Wiki
    if (this.source === "wiki") {
      this.data = parseWiki(this.data);
    }
  }

  parseTuningData() {
    if (this.data === undefined) {
      throw new Error("No data to parse");
    }
    const lines = this.data.split(NEWLINE_TEST);
    const intervals: Interval[] = [];
    lines.forEach((line) => {
      if (!line.length) {
        return;
      }
      const lineType = getLineType(line);
      if (lineType === LINE_TYPE.INVALID) {
        throw new Error(`Failed to parse line ${line}`);
      }
      intervals.push(parseLine(line));
    });
    const scale = Scale.fromIntervalArray(intervals, this.freq);
    return scale;
  }
}
