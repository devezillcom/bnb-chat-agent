function isRelativeR2Path(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("://")) {
    return false;
  }

  return true;
}

export function isR2HostedUrl(url: string): boolean {
  const publicUrlBase = process.env.R2_PUBLIC_URL?.trim();
  if (!publicUrlBase) {
    return false;
  }

  const trimmed = url.trim();
  const normalizedBase = publicUrlBase.replace(/\/$/, "");

  if (trimmed === normalizedBase || trimmed.startsWith(`${normalizedBase}/`)) {
    return true;
  }

  return isRelativeR2Path(trimmed);
}
