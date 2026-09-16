import { InfoIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AgentPageHelperProps = {
  title: string;
  description: string;
};

/**
 * Friendly info banner shown at the top of each agent configuration page to
 * explain, in plain language, what the page is for.
 */
export function AgentPageHelper({ title, description }: AgentPageHelperProps) {
  return (
    <Alert variant="info" className="mb-6">
      <InfoIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
