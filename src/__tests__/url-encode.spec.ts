import { arraysEqual } from "../utils";
import { describe, it, expect } from "vitest";

import {
  decodeKeyColors,
  decodeLines,
  encodeKeyColors,
  encodeLines,
} from "../url-encode";

describe("URL encoder", () => {
  it("can encode all line types", () => {
    const lines = [
      "81/80",
      "-42.00",
      "2\\5",
      "700.01",
      "1,0723",
      "2/1",
      "2\\3<5>",
      "[3/2 -2,1>",
      "3/2+1.23",
    ];
    expect(encodeLines(lines)).toBe(
      "29F28_-16._2B5_jg.01_1C0k3_2F1_2B3L5R_Q3F2S-2C1R_3F2P1.n"
    );
  });

  it("can decode all line types", () => {
    const lines = decodeLines(
      "29F28_-16._2B5_jg.01_1C0k3_2F1_2B3L5R_Q3F2S-2C1R_3F2P1.n"
    );
    const expected = [
      "81/80",
      "-42.",
      "2\\5",
      "700.01",
      "1,0723",
      "2/1",
      "2\\3<5>",
      "[3/2 -2,1>",
      "3/2+1.23",
    ];
    expect(arraysEqual(lines, expected)).toBeTruthy();
  });

  it("can encode key colors", () => {
    const keyColors = ["blue", "black", "white", "black", "red", "red"];
    expect(encodeKeyColors(keyColors)).toBe("blue-~-red_red");
  });

  it("can decode key colors", () => {
    const keyColors = decodeKeyColors("blue-~-red_red");
    const expected = ["blue", "black", "white", "black", "red", "red"];
    expect(arraysEqual(keyColors, expected)).toBeTruthy();
  });
});
