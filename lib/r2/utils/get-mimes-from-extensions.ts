import { getMimeFromExtension } from "./get-mime-from-extension";

export function getMimesFromExtensions(
  extensions: readonly string[],
): string[] {
  return extensions.map(getMimeFromExtension);
}
