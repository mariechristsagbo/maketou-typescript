import { MaketouConfigurationError } from "./errors.js";

export interface MaketouOptions {
  apiKey: string;
}

export class Maketou {
  constructor(options: MaketouOptions) {
    if (options.apiKey.trim().length === 0) {
      throw new MaketouConfigurationError("Maketou API key must not be empty.");
    }
  }
}
