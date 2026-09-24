import { z } from "zod";

const userImageUrlSchema = z.url({
  error: "Each user image must be a public URL (https://...).",
});

export const bienhinhCreateImageInputSchema = z.object({
  userImages: z
    .array(
      z.object({
        url: userImageUrlSchema,
      }),
    )
    .min(1, { error: "At least 1 user image is required." })
    .max(2, { error: "At most 2 user images are allowed." }),
});

export type BienhinhCreateImageInput = z.infer<
  typeof bienhinhCreateImageInputSchema
>;

export const bienhinhCreateImageInputJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    userImages: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      description: "1 to 2 reference images as public URLs.",
      items: {
        type: "object",
        properties: {
          url: {
            description: "Public image URL (https://...).",
            type: "string",
            format: "uri",
          },
        },
        required: ["url"],
      },
    },
  },
  required: ["userImages"],
};
