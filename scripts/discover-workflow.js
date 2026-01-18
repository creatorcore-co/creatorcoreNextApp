#!/usr/bin/env node
/**
 * CLI tool for discovering Bubble workflow response schemas.
 *
 * Usage:
 *   npm run discover-workflow <workflow_name> [options]
 *
 * Arguments:
 *   workflow_name          Name of the Bubble workflow to call
 *
 * Options:
 *   --method=GET|POST      HTTP method (default: POST)
 *   --body='{"key":"val"}' Request body as JSON string (for POST)
 *   --params='{"k":"v"}'   Query params as JSON string (for GET)
 *   --output=<file>        Write TypeScript types to file
 *   --save-registry        Add/update workflow in registry file
 *   --quiet                Only output the TypeScript types
 *   --direct               Call Bubble directly (skip local API)
 *
 * Examples:
 *   npm run discover-workflow get_user_profile
 *   npm run discover-workflow get_user_profile --body='{"user_id":"123"}'
 *   npm run discover-workflow list_items --method=GET --params='{"limit":"10"}'
 *   npm run discover-workflow get_user_profile --output=src/types/user.ts
 *   npm run discover-workflow get_user_profile --save-registry
 *
 * Environment:
 *   Requires BUBBLE_API_KEY in .env.local
 *   Requires BUBBLE_BASE_URL in .env.local (e.g., https://app.creatorcore.co/version-test)
 *
 * Note: This script calls the local Next.js API, so the dev server must be running.
 *       Alternatively, it can call Bubble directly if --direct flag is used.
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Simple argument parser
function parseArgs(args) {
  const result = {
    workflow: null,
    method: 'POST',
    body: null,
    params: null,
    output: null,
    saveRegistry: false,
    quiet: false,
    direct: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg.startsWith('--method=')) {
      result.method = arg.split('=')[1].toUpperCase();
    } else if (arg.startsWith('--body=')) {
      try {
        result.body = JSON.parse(arg.slice(7));
      } catch (e) {
        console.error('Error: Invalid JSON in --body');
        process.exit(1);
      }
    } else if (arg.startsWith('--params=')) {
      try {
        result.params = JSON.parse(arg.slice(9));
      } catch (e) {
        console.error('Error: Invalid JSON in --params');
        process.exit(1);
      }
    } else if (arg.startsWith('--output=')) {
      result.output = arg.slice(9);
    } else if (arg === '--save-registry') {
      result.saveRegistry = true;
    } else if (arg === '--quiet' || arg === '-q') {
      result.quiet = true;
    } else if (arg === '--direct') {
      result.direct = true;
    } else if (!arg.startsWith('-') && !result.workflow) {
      result.workflow = arg;
    }
  }

  return result;
}

function printHelp() {
  console.log(`
Bubble Workflow Discovery Tool

Usage:
  npm run discover-workflow <workflow_name> [options]

Arguments:
  workflow_name          Name of the Bubble workflow to call

Options:
  --method=GET|POST      HTTP method (default: POST)
  --body='{"key":"val"}' Request body as JSON string (for POST)
  --params='{"k":"v"}'   Query params as JSON string (for GET)
  --output=<file>        Write TypeScript types to file
  --save-registry        Add/update workflow in registry file
  --quiet, -q            Only output the TypeScript types
  --direct               Call Bubble directly (skip local API)
  --help, -h             Show this help message

Examples:
  npm run discover-workflow get_user_profile
  npm run discover-workflow get_user_profile --body='{"user_id":"123"}'
  npm run discover-workflow list_items --method=GET --params='{"limit":"10"}'
  npm run discover-workflow get_user_profile --output=src/types/user.ts

Environment:
  Requires BUBBLE_API_KEY in .env.local
  Requires BUBBLE_BASE_URL in .env.local (e.g., https://app.creatorcore.co/version-test)
`);
}

// Schema inference functions (for direct mode)
function inferJsonSchema(data) {
  if (data === null || data === undefined) {
    return { type: 'null' };
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { type: 'array', items: {} };
    }
    return { type: 'array', items: inferJsonSchema(data[0]) };
  }

  if (typeof data === 'object') {
    const properties = {};
    const required = [];

    for (const [key, value] of Object.entries(data)) {
      properties[key] = inferJsonSchema(value);
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
    // Detect common formats
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data)) {
      return { type: 'string', format: 'uuid' };
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
      return { type: 'string', format: 'email' };
    }
    if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(data)) {
      return { type: 'string', format: 'uri' };
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(data)) {
      return { type: 'string', format: 'date-time' };
    }
    return { type: 'string' };
  }

  if (typeof data === 'number') {
    return { type: 'number' };
  }

  if (typeof data === 'boolean') {
    return { type: 'boolean' };
  }

  return {};
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function schemaToTypeString(schema, indent = 0) {
  const indentStr = '  '.repeat(indent);

  if (schema.type === 'null') return 'null';
  if (schema.type === 'string') return 'string';
  if (schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';

  if (schema.type === 'array') {
    if (schema.items) {
      const itemType = schemaToTypeString(schema.items, indent);
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

    const props = [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(key) ?? false;
      const optionalMark = isRequired ? '' : '?';
      const typeStr = schemaToTypeString(propSchema, indent + 1);
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
      props.push(`${indentStr}  ${safeKey}${optionalMark}: ${typeStr}`);
    }

    return `{\n${props.join(';\n')};\n${indentStr}}`;
  }

  return 'unknown';
}

function generateTypescript(schema, interfaceName) {
  return `export interface ${interfaceName} ${schemaToTypeString(schema, 0)}`;
}

function schemaToZodString(schema, indent = 0) {
  const indentStr = '  '.repeat(indent);
  const nextIndent = '  '.repeat(indent + 1);

  if (schema.type === 'null') return 'z.null()';

  if (schema.type === 'string') {
    let zodStr = 'z.string()';
    if (schema.format === 'email') zodStr += '.email()';
    else if (schema.format === 'uri') zodStr += '.url()';
    else if (schema.format === 'uuid') zodStr += '.uuid()';
    return zodStr;
  }

  if (schema.type === 'number') return 'z.number()';
  if (schema.type === 'boolean') return 'z.boolean()';

  if (schema.type === 'array') {
    if (schema.items) {
      return `z.array(${schemaToZodString(schema.items, indent)})`;
    }
    return 'z.array(z.unknown())';
  }

  if (schema.type === 'object') {
    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      return 'z.record(z.unknown())';
    }

    const props = [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const zodStr = schemaToZodString(propSchema, indent + 1);
      const isRequired = schema.required?.includes(key) ?? false;
      const finalZod = isRequired ? zodStr : `${zodStr}.optional()`;
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
      props.push(`${nextIndent}${safeKey}: ${finalZod}`);
    }

    return `z.object({\n${props.join(',\n')},\n${indentStr}})`;
  }

  return 'z.unknown()';
}

function generateZod(schema, schemaName) {
  return `export const ${schemaName} = ${schemaToZodString(schema, 0)};`;
}

async function discoverViaApi(args) {
  const response = await fetch('http://localhost:3000/api/bubble/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow: args.workflow,
      method: args.method,
      body: args.body,
      params: args.params,
    }),
  });

  return response.json();
}

async function discoverDirect(args) {
  const apiKey = process.env.BUBBLE_API_KEY;
  const baseUrl = process.env.BUBBLE_BASE_URL;

  if (!apiKey) {
    return {
      success: false,
      error: 'BUBBLE_API_KEY not configured',
      details: { hint: 'Add BUBBLE_API_KEY to your .env.local file' },
    };
  }

  if (!baseUrl) {
    return {
      success: false,
      error: 'BUBBLE_BASE_URL not configured',
      details: { hint: 'Add BUBBLE_BASE_URL to your .env.local file (e.g., https://app.creatorcore.co/version-test)' },
    };
  }

  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  let url = `${cleanBaseUrl}/api/1.1/wf/${args.workflow}`;

  if (args.method === 'GET' && args.params) {
    const searchParams = new URLSearchParams(args.params);
    url = `${url}?${searchParams.toString()}`;
  }

  const fetchOptions = {
    method: args.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  };

  if (args.method === 'POST' && args.body) {
    fetchOptions.body = JSON.stringify(args.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `Bubble API error: ${response.status}`,
        details: { response: data },
      };
    }

    const schema = inferJsonSchema(data);
    const interfaceName = `${toPascalCase(args.workflow)}Response`;
    const schemaName = `${toPascalCase(args.workflow)}ResponseSchema`;

    return {
      success: true,
      workflow: args.workflow,
      method: args.method,
      bubbleUrl: url,
      requestBody: args.method === 'POST' ? args.body : undefined,
      requestParams: args.method === 'GET' ? args.params : undefined,
      response: data,
      inferredSchema: schema,
      typescript: generateTypescript(schema, interfaceName),
      zodSchema: generateZod(schema, schemaName),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: {},
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.workflow) {
    console.error('Error: Missing workflow name');
    console.error('Usage: npm run discover-workflow <workflow_name> [options]');
    console.error('Run with --help for more information');
    process.exit(1);
  }

  if (!args.quiet) {
    console.log(`\nDiscovering workflow: ${args.workflow}`);
    console.log(`Method: ${args.method}`);
    if (args.body) console.log(`Body: ${JSON.stringify(args.body)}`);
    if (args.params) console.log(`Params: ${JSON.stringify(args.params)}`);
    console.log('');
  }

  // Call discovery
  let result;
  if (args.direct) {
    if (!args.quiet) console.log('Calling Bubble directly...\n');
    result = await discoverDirect(args);
  } else {
    if (!args.quiet) console.log('Calling via local API (ensure dev server is running)...\n');
    try {
      result = await discoverViaApi(args);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('Error: Cannot connect to localhost:3000');
        console.error('Make sure the dev server is running (npm run dev)');
        console.error('Or use --direct flag to call Bubble directly');
        process.exit(1);
      }
      throw error;
    }
  }

  if (!result.success) {
    console.error('Error:', result.error);
    if (result.details) {
      console.error('Details:', JSON.stringify(result.details, null, 2));
    }
    process.exit(1);
  }

  // Output results
  if (args.quiet) {
    console.log(result.typescript);
  } else {
    console.log('URL:', result.bubbleUrl);
    console.log('\n=== Response ===');
    console.log(JSON.stringify(result.response, null, 2));
    console.log('\n=== Inferred Schema ===');
    console.log(JSON.stringify(result.inferredSchema, null, 2));
    console.log('\n=== TypeScript Interface ===');
    console.log(result.typescript);
    console.log('\n=== Zod Schema ===');
    console.log(result.zodSchema);
  }

  // Save to file if requested
  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const content = `/**
 * Auto-generated types for Bubble workflow: ${args.workflow}
 * Generated at: ${new Date().toISOString()}
 *
 * Regenerate with:
 *   npm run discover-workflow ${args.workflow}${args.body ? ` --body='${JSON.stringify(args.body)}'` : ''}${args.params ? ` --params='${JSON.stringify(args.params)}'` : ''} --output=${args.output}
 */

import { z } from 'zod';

${result.typescript}

${result.zodSchema}
`;

    fs.writeFileSync(outputPath, content);
    console.log(`\nTypes written to: ${outputPath}`);
  }

  // Add to registry if requested
  if (args.saveRegistry) {
    console.log('\n--save-registry: Registry update not yet implemented');
    console.log('Manually add the workflow to src/config/bubble-workflows.ts');
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
