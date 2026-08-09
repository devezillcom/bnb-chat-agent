import "server-only";

type AnydocModule = typeof import("@firecrawl/anydoc");

let anydocModulePromise: Promise<AnydocModule> | null = null;

async function loadAnydocModule(): Promise<AnydocModule> {
  if (!anydocModulePromise) {
    anydocModulePromise = import("@firecrawl/anydoc");
  }

  return anydocModulePromise;
}

export async function convertBytesToMarkdownWithAnydoc(
  bytes: Buffer,
): Promise<string> {
  const { toMarkdownBytes } = await loadAnydocModule();
  return toMarkdownBytes(bytes);
}
