export function getAgentAvatarUrl(name: string) {
  const trimmed = name.trim() || "agent";

  return `https://robohash.org/${encodeURIComponent(trimmed)}.png?set=set1`;
}

export function resolveAgentAvatarUrl(params: {
  name: string;
  avatarUrl?: string | null;
}) {
  const custom = params.avatarUrl?.trim();

  if (custom) {
    return custom;
  }

  return getAgentAvatarUrl(params.name);
}
