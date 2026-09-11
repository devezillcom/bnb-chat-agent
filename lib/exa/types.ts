export type ExaResultExtras = {
  links?: string[];
  imageLinks?: string[];
};

export type ExaSearchResultItem = {
  id?: string;
  url?: string;
  title?: string;
  author?: string | null;
  publishedDate?: string | null;
  text?: string;
  image?: string;
  favicon?: string;
  extras?: ExaResultExtras;
};

export type ExaSearchParams = {
  query: string;
  numResults?: number;
  excludeDomains?: string[];
};

export type ExaSearchResult = {
  results: ExaSearchResultItem[];
};

export type ExaGetContentsParams = {
  url: string;
  maxCharacters?: number;
};

export type ExaGetContentsResultItem = {
  url: string;
  title?: string;
  text: string;
  author?: string | null;
  publishedDate?: string | null;
  image?: string;
  favicon?: string;
  imageLinks?: string[];
};

export type ExaGetContentsResult = {
  item: ExaGetContentsResultItem | null;
  error?: string;
};

export type ExaImageExtras = {
  image?: string;
  favicon?: string;
  imageLinks?: string[];
};

export const exaDefaultImageLinks = 5;
