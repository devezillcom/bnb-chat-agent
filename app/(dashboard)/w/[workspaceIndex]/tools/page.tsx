import { ResourceListPage } from "@/components/dashboard/resource-list-page";
import { mapToolsToListItems } from "@/lib/dashboard/map-resource-list-items";
import { PLACEHOLDER_TOOLS } from "@/lib/dashboard/placeholder-data";

export default function ToolsPage() {
  return (
    <ResourceListPage
      title="Tools"
      description="Actions and integrations agents can call while responding to users."
      items={mapToolsToListItems(PLACEHOLDER_TOOLS)}
      emptyTitle="No tools yet"
      emptyDescription="Connect APIs, MCP servers, or built-in tools to extend what agents can do."
    />
  );
}
