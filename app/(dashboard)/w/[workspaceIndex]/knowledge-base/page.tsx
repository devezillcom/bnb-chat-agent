import { ResourceListPage } from "@/components/dashboard/resource-list-page";
import { mapKnowledgeBasesToListItems } from "@/lib/dashboard/map-resource-list-items";
import { PLACEHOLDER_KNOWLEDGE_BASES } from "@/lib/dashboard/placeholder-data";

export default function KnowledgeBasePage() {
  return (
    <ResourceListPage
      title="Knowledge base"
      description="Document collections agents can reference when answering questions."
      items={mapKnowledgeBasesToListItems(PLACEHOLDER_KNOWLEDGE_BASES)}
      emptyTitle="No knowledge bases yet"
      emptyDescription="Upload guides, FAQs, and playbooks so agents can answer with accurate context."
    />
  );
}
