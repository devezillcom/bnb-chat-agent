import { ResourceListPage } from "@/components/dashboard/resource-list-page";
import { mapConnectionsToListItems } from "@/lib/dashboard/map-resource-list-items";
import { PLACEHOLDER_CONNECTIONS } from "@/lib/dashboard/placeholder-data";

export default function ConnectionsPage() {
  return (
    <ResourceListPage
      title="Connections"
      description="Channels linked to your agents, such as Facebook Messenger, website widgets, and messaging apps."
      items={mapConnectionsToListItems(PLACEHOLDER_CONNECTIONS)}
      emptyTitle="No connections yet"
      emptyDescription="Connect Facebook pages, website embeds, or other channels to route conversations to agents."
    />
  );
}
