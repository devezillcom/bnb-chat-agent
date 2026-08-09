import "server-only";

import type {
  MarkdownConverterInput,
  MarkdownConverterProvider,
  MarkdownConverterResult,
} from "./markdown-converter";
import { convertBytesToMarkdownWithAnydoc } from "../utils/load-anydoc";

function isPlainTextOrMarkdown(contentType: string, filename: string): boolean {
  const lowerType = contentType.toLowerCase();
  const lowerName = filename.toLowerCase();
  return (
    lowerType === "text/plain" ||
    lowerType === "text/markdown" ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".txt")
  );
}

function isPdf(contentType: string, filename: string): boolean {
  return (
    contentType.toLowerCase() === "application/pdf" ||
    filename.toLowerCase().endsWith(".pdf")
  );
}

export class PlainTextMarkdownConverter implements MarkdownConverterProvider {
  readonly id = "plain-text";

  supports(input: MarkdownConverterInput): boolean {
    return isPlainTextOrMarkdown(input.contentType, input.filename);
  }

  async convert(input: MarkdownConverterInput): Promise<MarkdownConverterResult> {
    return {
      markdown: input.bytes.toString("utf8"),
      providerId: this.id,
    };
  }
}

export class AnydocMarkdownConverter implements MarkdownConverterProvider {
  readonly id = "anydoc";

  supports(input: MarkdownConverterInput): boolean {
    if (isPlainTextOrMarkdown(input.contentType, input.filename)) {
      return false;
    }

    return !isPdf(input.contentType, input.filename);
  }

  async convert(input: MarkdownConverterInput): Promise<MarkdownConverterResult> {
    const markdown = await convertBytesToMarkdownWithAnydoc(input.bytes);
    return {
      markdown,
      providerId: this.id,
    };
  }
}

export class FirecrawlParseMarkdownConverter implements MarkdownConverterProvider {
  readonly id = "firecrawl-parse";
  readonly kind = "ocr" as const;

  supports(input: MarkdownConverterInput): boolean {
    return isPdf(input.contentType, input.filename);
  }

  async convert(input: MarkdownConverterInput): Promise<MarkdownConverterResult> {
    const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY is not configured.");
    }

    const { Firecrawl } = await import("firecrawl");
    const client = new Firecrawl({ apiKey });

    const parsed = await client.parse(
      {
        data: input.bytes,
        filename: input.filename,
        contentType: input.contentType,
      },
      {
        formats: ["markdown"],
        parsers: [{ type: "pdf", mode: "auto" }],
      },
    );

    const markdown = parsed.markdown?.trim();
    if (!markdown) {
      throw new Error("Firecrawl Parse returned empty markdown.");
    }

    return {
      markdown,
      providerId: this.id,
      details: {
        mode: "auto",
      },
    };
  }
}

function getFallbackOcrProvider(): FirecrawlParseMarkdownConverter {
  return new FirecrawlParseMarkdownConverter();
}

export async function convertDocumentToMarkdown(
  input: MarkdownConverterInput,
): Promise<MarkdownConverterResult> {
  const providers: MarkdownConverterProvider[] = [
    new PlainTextMarkdownConverter(),
    new AnydocMarkdownConverter(),
    new FirecrawlParseMarkdownConverter(),
  ];

  const primary = providers.find((provider) => provider.supports(input));
  if (!primary) {
    throw new Error(`No markdown converter supports ${input.contentType}.`);
  }

  try {
    return await primary.convert(input);
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : null;

    const shouldFallbackToOcr =
      primary.id === "anydoc" &&
      (code === "unsupported" ||
        code === "encrypted" ||
        code === "malformed" ||
        code === "missingPart");

    if (!shouldFallbackToOcr) {
      throw error;
    }

    return getFallbackOcrProvider().convert(input);
  }
}
