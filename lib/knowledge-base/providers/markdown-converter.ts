export type MarkdownConverterInput = {
  filename: string;
  contentType: string;
  bytes: Buffer;
};

export type MarkdownConverterResult = {
  markdown: string;
  providerId: string;
  details?: Record<string, unknown>;
};

export interface MarkdownConverterProvider {
  readonly id: string;
  supports(input: MarkdownConverterInput): boolean;
  convert(input: MarkdownConverterInput): Promise<MarkdownConverterResult>;
}

export interface OcrMarkdownProvider extends MarkdownConverterProvider {
  readonly kind: "ocr";
}
