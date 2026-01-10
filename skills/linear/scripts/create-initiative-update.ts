#!/usr/bin/env npx tsx

/**
 * Create an initiative update (status report) in Linear
 *
 * Looks up initiative by name, posts markdown content, and returns the update URL.
 *
 * Usage:
 *   LINEAR_API_KEY=lin_api_xxx npx tsx create-initiative-update.ts "Initiative Name" "## Update\n\nBody content" [health]
 *
 * Arguments:
 *   initiativeName - Name of the initiative (case-insensitive partial match)
 *   body           - Markdown content for the update
 *   health         - Optional: onTrack (default), atRisk, offTrack
 *
 * Examples:
 *   npx tsx create-initiative-update.ts "Q1 Goals" "## Progress\n\n- 3/5 projects complete"
 *   npx tsx create-initiative-update.ts "Product Launch" "## At Risk\n\nBlocked on dependency" atRisk
 */

import { LinearClient } from '@linear/sdk';

type InitiativeHealth = 'onTrack' | 'atRisk' | 'offTrack';

const VALID_HEALTH_VALUES: InitiativeHealth[] = ['onTrack', 'atRisk', 'offTrack'];

function isValidHealth(value: string): value is InitiativeHealth {
  return VALID_HEALTH_VALUES.includes(value as InitiativeHealth);
}

function printUsage(): void {
  console.error('Usage:');
  console.error('  LINEAR_API_KEY=lin_api_xxx npx tsx create-initiative-update.ts "Initiative Name" "Body content" [health]');
  console.error('');
  console.error('Arguments:');
  console.error('  initiativeName - Name of the initiative (case-insensitive partial match)');
  console.error('  body           - Markdown content for the update');
  console.error('  health         - Optional: onTrack (default), atRisk, offTrack');
  console.error('');
  console.error('Examples:');
  console.error('  npx tsx create-initiative-update.ts "Q1 Goals" "## Progress\\n\\n- 3/5 projects done"');
  console.error('  npx tsx create-initiative-update.ts "Product Launch" "## Blocked\\n\\nDependency issue" atRisk');
}

interface InitiativeInfo {
  id: string;
  name: string;
  description?: string;
}

async function findInitiativeByName(client: LinearClient, initiativeName: string): Promise<InitiativeInfo | null> {
  // Search for initiatives with case-insensitive partial match
  const query = `
    query FindInitiative($filter: InitiativeFilter!) {
      initiatives(filter: $filter, first: 10) {
        nodes {
          id
          name
          description
        }
      }
    }
  `;

  const result = await client.client.rawRequest(query, {
    filter: {
      name: { containsIgnoreCase: initiativeName }
    }
  });

  const data = result.data as { initiatives: { nodes: InitiativeInfo[] } };
  const initiatives = data.initiatives.nodes;

  if (initiatives.length === 0) {
    return null;
  }

  // If multiple matches, prefer exact match (case-insensitive)
  const exactMatch = initiatives.find(
    i => i.name.toLowerCase() === initiativeName.toLowerCase()
  );

  return exactMatch || initiatives[0];
}

interface InitiativeUpdateResult {
  success: boolean;
  initiativeUpdate?: {
    id: string;
    url: string;
    createdAt: string;
  };
}

async function createInitiativeUpdate(
  client: LinearClient,
  initiativeId: string,
  body: string,
  health: InitiativeHealth
): Promise<InitiativeUpdateResult> {
  // Use rawRequest for initiativeUpdateCreate mutation
  const mutation = `
    mutation CreateInitiativeUpdate($initiativeId: String!, $body: String!, $health: InitiativeUpdateHealthType!) {
      initiativeUpdateCreate(input: {
        initiativeId: $initiativeId,
        body: $body,
        health: $health
      }) {
        success
        initiativeUpdate {
          id
          url
          createdAt
        }
      }
    }
  `;

  const result = await client.client.rawRequest(mutation, {
    initiativeId,
    body,
    health
  });

  return (result.data as { initiativeUpdateCreate: InitiativeUpdateResult }).initiativeUpdateCreate;
}

async function main(): Promise<void> {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    console.error('Error: LINEAR_API_KEY environment variable is required');
    console.error('');
    printUsage();
    process.exit(1);
  }

  const initiativeName = process.argv[2];
  const body = process.argv[3];
  const healthArg = process.argv[4] || 'onTrack';

  if (!initiativeName) {
    console.error('Error: Initiative name is required');
    console.error('');
    printUsage();
    process.exit(1);
  }

  if (!body) {
    console.error('Error: Update body content is required');
    console.error('');
    printUsage();
    process.exit(1);
  }

  if (!isValidHealth(healthArg)) {
    console.error(`Error: Invalid health value "${healthArg}"`);
    console.error(`Valid values: ${VALID_HEALTH_VALUES.join(', ')}`);
    process.exit(1);
  }

  const client = new LinearClient({ apiKey });

  // Step 1: Look up initiative by name
  console.log(`Looking up initiative: "${initiativeName}"...`);
  const initiative = await findInitiativeByName(client, initiativeName);

  if (!initiative) {
    console.error(`Error: Initiative not found matching "${initiativeName}"`);
    console.error('');
    console.error('Tip: List all initiatives with:');
    console.error('  LINEAR_API_KEY=xxx npx tsx scripts/query.ts "query { initiatives { nodes { id name } } }"');
    process.exit(1);
  }

  console.log(`Found initiative: ${initiative.name} (${initiative.id})`);

  // Step 2: Create the initiative update
  console.log(`Creating update with health: ${healthArg}...`);

  try {
    const result = await createInitiativeUpdate(client, initiative.id, body, healthArg);

    if (!result.success || !result.initiativeUpdate) {
      console.error('Error: Failed to create initiative update');
      console.error('The API returned success: false');
      process.exit(1);
    }

    // Step 3: Output success with URL
    console.log('');
    console.log('Initiative update created successfully!');
    console.log('');
    console.log(`URL: ${result.initiativeUpdate.url}`);
    console.log(`ID: ${result.initiativeUpdate.id}`);
    console.log(`Created: ${result.initiativeUpdate.createdAt}`);
    console.log(`Health: ${healthArg}`);

    // Also output as JSON for programmatic use
    console.log('');
    console.log('JSON Output:');
    console.log(JSON.stringify({
      success: true,
      initiative: {
        id: initiative.id,
        name: initiative.name
      },
      update: result.initiativeUpdate,
      health: healthArg
    }, null, 2));

  } catch (error) {
    console.error('Error creating initiative update:');
    if (error instanceof Error) {
      console.error(error.message);

      // Check for common GraphQL errors
      if ('errors' in error && Array.isArray((error as Record<string, unknown>).errors)) {
        console.error('\nGraphQL Errors:');
        console.error(JSON.stringify((error as Record<string, unknown>).errors, null, 2));
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
