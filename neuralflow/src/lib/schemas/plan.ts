// JSON Schema for planned tasks and plan array.
// Using JSON Schema instead of Zod to avoid extra deps.

export type PlannedTask = {
  title: string;
  description?: string;
  estimateMinutes: number; // 20–90 typical
  kind: "deep" | "shallow";
  priority: "low" | "medium" | "high";
};

// Single task JSON schema
export const plannedTaskJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    estimateMinutes: { type: "number" },
    kind: { type: "string", enum: ["deep", "shallow"] },
    priority: { type: "string", enum: ["low", "medium", "high"] },
  },
  required: ["title", "estimateMinutes", "kind", "priority"],
  additionalProperties: false,
} as const;

// Array of tasks JSON schema (for array output mode)
export const plannedTaskArrayJsonSchema = {
  type: "array",
  items: plannedTaskJsonSchema,
  minItems: 1,
  maxItems: 20,
} as const;

