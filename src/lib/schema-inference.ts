/**
 * Schema Inference Utilities
 *
 * Utilities for inferring JSON Schema and TypeScript types from sample data.
 * Used by the workflow discovery tool.
 */

// ============================================================================
// Types
// ============================================================================

export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  format?: string;
  description?: string;
  additionalProperties?: boolean | JsonSchema;
}

// ============================================================================
// Pattern Detection
// ============================================================================

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

function detectStringFormat(value: string): string | undefined {
  if (UUID_REGEX.test(value)) return 'uuid';
  if (EMAIL_REGEX.test(value)) return 'email';
  if (URL_REGEX.test(value)) return 'uri';
  if (ISO_DATE_REGEX.test(value)) return 'date-time';
  return undefined;
}

// ============================================================================
// JSON Schema Inference
// ============================================================================

/**
 * Infers a JSON Schema from sample data.
 * Handles: objects, arrays, strings, numbers, booleans, null
 * Detects patterns: UUIDs, emails, URLs, ISO dates
 */
export function inferJsonSchema(data: unknown): JsonSchema {
  if (data === null) {
    return { type: 'null' };
  }

  if (data === undefined) {
    return { type: 'null' };
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { type: 'array', items: {} };
    }

    // Infer item type from first element
    // For more accuracy, could merge schemas from all elements
    const itemSchema = inferJsonSchema(data[0]);
    return { type: 'array', items: itemSchema };
  }

  if (typeof data === 'object') {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      properties[key] = inferJsonSchema(value);
      // Mark all fields as required (can't tell optionality from single sample)
      if (value !== null && value !== undefined) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  if (typeof data === 'string') {
    const format = detectStringFormat(data);
    return format ? { type: 'string', format } : { type: 'string' };
  }

  if (typeof data === 'number') {
    return { type: 'number' };
  }

  if (typeof data === 'boolean') {
    return { type: 'boolean' };
  }

  return {};
}

// ============================================================================
// TypeScript Generation
// ============================================================================

/**
 * Converts a JSON Schema to a TypeScript interface string.
 */
export function jsonSchemaToTypescript(
  schema: JsonSchema,
  interfaceName: string,
  indent: number = 0
): string {
  const indentStr = '  '.repeat(indent);
  const lines: string[] = [];

  if (indent === 0) {
    lines.push(`export interface ${interfaceName} {`);
  }

  if (schema.type === 'object' && schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(key) ?? false;
      const optionalMark = isRequired ? '' : '?';
      const typeStr = schemaToTypeString(propSchema, indent + 1);
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
        ? key
        : `'${key}'`;
      lines.push(`${indentStr}  ${safeKey}${optionalMark}: ${typeStr};`);
    }
  }

  if (indent === 0) {
    lines.push('}');
  }

  return lines.join('\n');
}

function schemaToTypeString(schema: JsonSchema, indent: number): string {
  const indentStr = '  '.repeat(indent);

  if (schema.type === 'null') {
    return 'null';
  }

  if (schema.type === 'string') {
    return 'string';
  }

  if (schema.type === 'number') {
    return 'number';
  }

  if (schema.type === 'boolean') {
    return 'boolean';
  }

  if (schema.type === 'array') {
    if (schema.items) {
      const itemType = schemaToTypeString(schema.items, indent);
      // Check if item type is complex (object)
      if (schema.items.type === 'object' && schema.items.properties) {
        return `Array<${itemType}>`;
      }
      return `${itemType}[]`;
    }
    return 'unknown[]';
  }

  if (schema.type === 'object') {
    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      return 'Record<string, unknown>';
    }

    const props: string[] = [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(key) ?? false;
      const optionalMark = isRequired ? '' : '?';
      const typeStr = schemaToTypeString(propSchema, indent + 1);
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
        ? key
        : `'${key}'`;
      props.push(`${indentStr}  ${safeKey}${optionalMark}: ${typeStr}`);
    }

    return `{\n${props.join(';\n')};\n${indentStr}}`;
  }

  return 'unknown';
}

/**
 * Generates a complete TypeScript interface definition
 */
export function generateTypescriptInterface(
  schema: JsonSchema,
  interfaceName: string
): string {
  const lines: string[] = [];

  lines.push(`export interface ${interfaceName} ${schemaToTypeString(schema, 0)}`);

  return lines.join('\n');
}

// ============================================================================
// Zod Schema Generation
// ============================================================================

/**
 * Generates Zod schema code from JSON Schema for runtime validation.
 */
export function jsonSchemaToZod(
  schema: JsonSchema,
  schemaName: string,
  indent: number = 0
): string {
  const indentStr = '  '.repeat(indent);

  if (indent === 0) {
    const zodCode = schemaToZodString(schema, 0);
    return `export const ${schemaName} = ${zodCode};`;
  }

  return schemaToZodString(schema, indent);
}

function schemaToZodString(schema: JsonSchema, indent: number): string {
  const indentStr = '  '.repeat(indent);
  const nextIndent = '  '.repeat(indent + 1);

  if (schema.type === 'null') {
    return 'z.null()';
  }

  if (schema.type === 'string') {
    let zodStr = 'z.string()';
    if (schema.format === 'email') {
      zodStr += '.email()';
    } else if (schema.format === 'uri') {
      zodStr += '.url()';
    } else if (schema.format === 'uuid') {
      zodStr += '.uuid()';
    }
    return zodStr;
  }

  if (schema.type === 'number') {
    return 'z.number()';
  }

  if (schema.type === 'boolean') {
    return 'z.boolean()';
  }

  if (schema.type === 'array') {
    if (schema.items) {
      const itemZod = schemaToZodString(schema.items, indent);
      return `z.array(${itemZod})`;
    }
    return 'z.array(z.unknown())';
  }

  if (schema.type === 'object') {
    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      return 'z.record(z.unknown())';
    }

    const props: string[] = [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const zodStr = schemaToZodString(propSchema, indent + 1);
      const isRequired = schema.required?.includes(key) ?? false;
      const finalZod = isRequired ? zodStr : `${zodStr}.optional()`;
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
        ? key
        : `'${key}'`;
      props.push(`${nextIndent}${safeKey}: ${finalZod}`);
    }

    return `z.object({\n${props.join(',\n')},\n${indentStr}})`;
  }

  return 'z.unknown()';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert snake_case or kebab-case to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert snake_case or kebab-case to camelCase
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Generate interface name from workflow name
 * e.g., "get_user_profile" -> "GetUserProfileResponse"
 */
export function workflowToInterfaceName(workflowName: string): string {
  return `${toPascalCase(workflowName)}Response`;
}

/**
 * Generate Zod schema name from workflow name
 * e.g., "get_user_profile" -> "GetUserProfileResponseSchema"
 */
export function workflowToSchemaName(workflowName: string): string {
  return `${toPascalCase(workflowName)}ResponseSchema`;
}
