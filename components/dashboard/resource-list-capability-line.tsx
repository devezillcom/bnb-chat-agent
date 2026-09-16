import type { LucideIcon } from "lucide-react";

import { formatTruncatedNames } from "@/lib/dashboard/format-truncated-names";
import { cn } from "@/lib/utils";

type ResourceListCapabilityLineProps = {
  icon: LucideIcon;
  names: string[];
  className?: string;
};

export function ResourceListCapabilityLine({
  icon: Icon,
  names,
  className,
}: ResourceListCapabilityLineProps) {
  const label = formatTruncatedNames(names);

  if (!label) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <Icon
        className="size-3.5 shrink-0 text-muted-foreground/80"
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
