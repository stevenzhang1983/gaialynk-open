/**
 * E-14: JSON Schema subset validation for optional step output_schema (no external deps).
 * Supports: type object/string/number/boolean/array, properties, required, items (single schema).
 */

export function validateJsonSchemaSubset(data: unknown, schema: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (schema === null || schema === undefined) {
    return { ok: true, errors: [] };
  }
  if (typeof schema !== "object") {
    return { ok: true, errors: [] };
  }
  const s = schema as Record<string, unknown>;
  const t = s.type;

  if (t === "object") {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors.push("expected object");
      return { ok: false, errors };
    }
    const obj = data as Record<string, unknown>;
    const req = Array.isArray(s.required) ? s.required.filter((x): x is string => typeof x === "string") : [];
    for (const key of req) {
      if (!(key in obj)) {
        errors.push(`missing required property: ${key}`);
      }
    }
    const props = s.properties;
    if (props && typeof props === "object" && !Array.isArray(props)) {
      for (const [key, subSchema] of Object.entries(props as Record<string, unknown>)) {
        if (key in obj) {
          const sub = validateJsonSchemaSubset(obj[key], subSchema);
          for (const e of sub.errors) {
            errors.push(`${key}: ${e}`);
          }
        }
      }
    }
    return { ok: errors.length === 0, errors };
  }

  if (t === "string") {
    if (typeof data !== "string") {
      errors.push("expected string");
      return { ok: false, errors };
    }
    if (typeof s.minLength === "number" && data.length < s.minLength) {
      errors.push(`string shorter than minLength ${s.minLength}`);
    }
    return { ok: errors.length === 0, errors };
  }

  if (t === "number") {
    if (typeof data !== "number" || Number.isNaN(data)) {
      errors.push("expected number");
      return { ok: false, errors };
    }
    return { ok: true, errors: [] };
  }

  if (t === "boolean") {
    if (typeof data !== "boolean") {
      errors.push("expected boolean");
      return { ok: false, errors };
    }
    return { ok: true, errors: [] };
  }

  if (t === "array") {
    if (!Array.isArray(data)) {
      errors.push("expected array");
      return { ok: false, errors };
    }
    if (s.items && typeof s.items === "object") {
      data.forEach((item, i) => {
        const sub = validateJsonSchemaSubset(item, s.items);
        for (const e of sub.errors) {
          errors.push(`[${i}]: ${e}`);
        }
      });
    }
    return { ok: errors.length === 0, errors };
  }

  return { ok: true, errors: [] };
}
