export function getAgentAvatarUrl(name: string) {
  const trimmed = name.trim() || "agent";

  return `https://robohash.org/${encodeURIComponent(trimmed)}.png?set=set1`;
}
