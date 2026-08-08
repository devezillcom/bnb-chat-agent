import { z } from "zod";

export const DATA_SHAPE_FIELD_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
] as const;

export type DataShapeFieldType = (typeof DATA_SHAPE_FIELD_TYPES)[number];

export type DataShapeField = {
  name: string;
  type: DataShapeFieldType;
  description?: string;
  required: boolean;
};

export type DataShape = {
  fields: DataShapeField[];
};

export const dataShapeFieldSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Field name is required." })
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, {
      error: "Use letters, numbers, and underscores. Start with a letter or underscore.",
    }),
  type: z.enum(DATA_SHAPE_FIELD_TYPES),
  description: z.string().trim().optional(),
  required: z.boolean(),
});

export const dataShapeSchema = z.object({
  fields: z.array(dataShapeFieldSchema),
});

export const requiredDataShapeSchema = dataShapeSchema.extend({
  fields: z
    .array(dataShapeFieldSchema)
    .min(1, { error: "Add at least one input field." }),
});

export function createEmptyDataShapeField(): DataShapeField {
  return {
    name: "",
    type: "string",
    description: "",
    required: true,
  };
}

export function dataShapeToJsonSchema(shape: DataShape): Record<string, unknown> {
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];

  for (const field of shape.fields) {
    properties[field.name] = {
      type: field.type,
      ...(field.description?.trim()
        ? { description: field.description.trim() }
        : {}),
    };

    if (field.required) {
      required.push(field.name);
    }
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

export function jsonSchemaToDataShape(
  schema: Record<string, unknown> | null | undefined,
): DataShape {
  if (!schema || typeof schema !== "object") {
    return { fields: [] };
  }

  const properties =
    schema.properties && typeof schema.properties === "object"
      ? (schema.properties as Record<string, Record<string, unknown>>)
      : {};
  const requiredSet = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((value): value is string => typeof value === "string")
      : [],
  );

  const fields = Object.entries(properties).map(([name, definition]) => {
    const type =
      typeof definition.type === "string" &&
      DATA_SHAPE_FIELD_TYPES.includes(definition.type as DataShapeFieldType)
        ? (definition.type as DataShapeFieldType)
        : "string";

    return {
      name,
      type,
      description:
        typeof definition.description === "string"
          ? definition.description
          : undefined,
      required: requiredSet.has(name),
    };
  });

  return { fields };
}

export function hasValidDataShapeFields(shape: DataShape): boolean {
  return requiredDataShapeSchema.safeParse(shape).success;
}
