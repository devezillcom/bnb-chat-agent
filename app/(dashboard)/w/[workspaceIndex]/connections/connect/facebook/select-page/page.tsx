import { SelectFacebookPageForm } from "@/components/connections/select-facebook-page-form";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type SelectFacebookPageRouteProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function SelectFacebookPageRoute({
  params,
}: SelectFacebookPageRouteProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspaceIndex } = await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Select Facebook pages
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose which pages to connect to this workspace.
        </p>
      </div>
      <SelectFacebookPageForm workspaceIndex={workspaceIndex} />
    </div>
  );
}
