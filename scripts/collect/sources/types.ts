export const USER_AGENT =
  'HauntedHollowAssetCollector/0.1 (https://github.com/zrf492174/Hackathon_kiro)';

export interface Candidate {
  provider: string;
  pageUrl: string;
  downloadUrl: string;
  title: string;
  author: string;
  authorUrl?: string;
  license: string;
  licenseUrl: string;
  attributionRequired: boolean;
  width?: number;
  height?: number;
  tags: string[];
}

export interface SearchOptions {
  query: string;
  limit: number;
  minWidth?: number;
  fetchImpl?: typeof fetch;
}

export class RateLimitError extends Error {
  constructor(public provider: string) {
    super(`${provider}: rate limited (HTTP 429)`);
  }
}
