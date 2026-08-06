import { z } from "zod";

export const profileFormSchema = z.object({
  displayName: z.string(),
  avatarUrl: z.string(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
