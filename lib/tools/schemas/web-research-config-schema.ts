import { z } from "zod";

export const webResearchConfigSchema = z.object({
  exclude_domains: z.string().trim().optional().default(""),
});

export type WebResearchConfig = z.infer<typeof webResearchConfigSchema>;
