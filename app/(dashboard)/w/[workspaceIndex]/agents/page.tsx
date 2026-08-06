import { ResourceListPage } from "@/components/dashboard/resource-list-page";
import { mapChatAgentsToListItems } from "@/lib/dashboard/map-resource-list-items";
import { PLACEHOLDER_CHAT_AGENTS } from "@/lib/dashboard/placeholder-data";

export default function ChatAgentsPage() {
  return (
    <ResourceListPage
      title="Chat agents"
      description="Agents configured for this workspace. Each agent can have its own skills, tools, and knowledge base."
      items={mapChatAgentsToListItems(PLACEHOLDER_CHAT_AGENTS)}
      emptyTitle="No chat agents yet"
      emptyDescription="Create an agent to start chatting, embedding on a site, or connecting to support channels."
    />
  );
}
