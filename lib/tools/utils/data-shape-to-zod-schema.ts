import { z } from "zod";

import type { DataShape, DataShapeField } from "./data-shape";

function fieldToZod(field: DataShapeField): z.ZodType {
  let schema: z.ZodType;

  switch (field.type) {
    case "string":
      schema = z.string();
      break;
    case "number":
      schema = z.number();
      break;
    case "integer":
      schema = z.int();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    default:
      schema = z.string();
      break;
  }

  if (field.description?.trim()) {
    schema = schema.describe(field.description.trim());
  }

  if (!field.required) {
    schema = schema.optional();
  }

  return schema;
}

export function dataShapeToZodSchema(shape: DataShape): z.ZodObject<Record<string, z.ZodType>> {
  const shapeFields: Record<string, z.ZodType> = {};

  for (const field of shape.fields) {
    shapeFields[field.name] = fieldToZod(field);
  }

  return z.object(shapeFields);
}
