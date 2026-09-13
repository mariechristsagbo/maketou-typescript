import { describe, expect, it } from "vitest";
import { Maketou, MaketouConfigurationError } from "../src/index.js";

describe("Maketou", () => {
  it("rejects an empty API key", () => {
    expect(() => new Maketou({ apiKey: "   " })).toThrow(MaketouConfigurationError);
  });
});
