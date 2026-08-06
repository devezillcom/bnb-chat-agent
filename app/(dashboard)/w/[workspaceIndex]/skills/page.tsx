import { ResourceListPage } from "@/components/dashboard/resource-list-page";
import { mapSkillsToListItems } from "@/lib/dashboard/map-resource-list-items";
import { PLACEHOLDER_SKILLS } from "@/lib/dashboard/placeholder-data";

export default function SkillsPage() {
  return (
    <ResourceListPage
      title="Skills"
      description="Reusable capabilities and behaviors you can attach to chat agents."
      items={mapSkillsToListItems(PLACEHOLDER_SKILLS)}
      emptyTitle="No skills yet"
      emptyDescription="Skills define how agents handle specialized tasks like copywriting or guest support."
    />
  );
}
