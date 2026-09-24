import { z } from "zod";

import type { ToolDefinition } from "../registry-types";
import {
  bienhinhCreateImageInputJsonSchema,
  bienhinhCreateImageInputSchema,
} from "./schemas/input-schema";

export const bienhinhCreateImageTool: ToolDefinition = {
  id: "bienhinh_create_image",
  name: "Bienhinh/createImage",
  description:
    "Generate an image via Bienhinh using user provided reference images from attachments.",
  configSchema: z.object({
    projectId: z
      .string()
      .trim()
      .min(1, { error: "Project ID is required." }),
    templateGroupId: z
      .string()
      .trim()
      .default("default-template-group"),
    templateId: z
      .string()
      .trim()
      .min(1, { error: "Template ID is required." }),
    styleId: z.string().trim().min(1, { error: "Style ID is required." }),
    imageWorkflow: z.string().trim().default("standard-image"),
    outputAspectRatio: z.string().trim().default("4:5"),
    "fields.projectName": z.string().trim().optional(),
    "fields.phone": z.string().trim().optional(),
    "fields.headline": z.string().trim().optional(),
    "fields.extraPrompt": z.string().trim().optional(),
  }),
  configFields: [
    {
      key: "projectId",
      label: "Project ID",
      required: true,
    },
    {
      key: "templateGroupId",
      label: "Template group ID",
      defaultValue: "default-template-group",
    },
    {
      key: "templateId",
      label: "Template ID",
      required: true,
    },
    {
      key: "styleId",
      label: "Style ID",
      required: true,
    },
    {
      key: "imageWorkflow",
      label: "Image workflow",
      defaultValue: "standard-image",
    },
    {
      key: "outputAspectRatio",
      label: "Output aspect ratio",
      defaultValue: "4:5",
    },
    {
      key: "fields.projectName",
      label: "Project name",
      description: "Optional value sent in the fields.projectName payload.",
    },
    {
      key: "fields.phone",
      label: "Phone",
      description: "Optional value sent in the fields.phone payload.",
    },
    {
      key: "fields.headline",
      label: "Headline",
      description: "Optional value sent in the fields.headline payload.",
    },
    {
      key: "fields.extraPrompt",
      label: "Extra prompt",
      description: "Optional value sent in the fields.extraPrompt payload.",
    },
  ],
  inputShape: { fields: [] },
  inputZodSchema: bienhinhCreateImageInputSchema,
  inputJsonSchema: bienhinhCreateImageInputJsonSchema,
  outputShape: {
    fields: [
      {
        name: "status",
        type: "integer",
        description: "HTTP status code.",
        required: true,
      },
      {
        name: "body",
        type: "string",
        description: "Response body from Bienhinh.",
        required: true,
      },
    ],
  },
};
