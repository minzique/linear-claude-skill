#!/usr/bin/env npx tsx

/**
 * Create a Linear issue with project assignment
 *
 * Looks up project by name and creates issue with projectId.
 *
 * Usage:
 *   LINEAR_API_KEY=xxx npx tsx scripts/create-issue-with-project.ts \
 *     --team "ENG" \
 *     --project "Phase 6A" \
 *     --title "Implement feature X" \
 *     --description "Details here"
 *
 * Arguments:
 *   --team        Team key (e.g., "ENG", "PRODUCT")
 *   --project     Project name (exact or partial match)
 *   --title       Issue title (required)
 *   --description Issue description (optional)
 *   --state       Issue state name (optional, defaults to "Backlog")
 *   --assignee    "me" to assign to self (optional)
 *   --priority    1-4 (optional, 1=urgent, 4=low)
 *   --labels      Comma-separated label names (optional)
 */

import { LinearClient } from '@linear/sdk';

interface Args {
  team: string;
  project: string;
  title: string;
  description?: string;
  state?: string;
  assignee?: string;
  priority?: number;
  labels?: string[];
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Partial<Args> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];

    if (!key || value === undefined) continue;

    switch (key) {
      case 'team':
        result.team = value;
        break;
      case 'project':
        result.project = value;
        break;
      case 'title':
        result.title = value;
        break;
      case 'description':
        result.description = value;
        break;
      case 'state':
        result.state = value;
        break;
      case 'assignee':
        result.assignee = value;
        break;
      case 'priority':
        result.priority = parseInt(value, 10);
        break;
      case 'labels':
        result.labels = value.split(',').map(l => l.trim());
        break;
    }
  }

  if (!result.team || !result.project || !result.title) {
    console.error('Error: --team, --project, and --title are required');
    console.error('');
    console.error('Usage:');
    console.error('  LINEAR_API_KEY=xxx npx tsx scripts/create-issue-with-project.ts \\');
    console.error('    --team "ENG" \\');
    console.error('    --project "Phase 6A" \\');
    console.error('    --title "Implement feature X"');
    process.exit(1);
  }

  return result as Args;
}

async function lookupProjectByName(
  client: LinearClient,
  projectName: string
): Promise<{ id: string; name: string } | null> {
  // Query projects with name filter (case-insensitive contains)
  const query = `
    query ProjectsByName($filter: ProjectFilter!) {
      projects(filter: $filter, first: 10) {
        nodes {
          id
          name
          state
        }
      }
    }
  `;

  const variables = {
    filter: {
      name: { containsIgnoreCase: projectName }
    }
  };

  try {
    const result = await client.client.rawRequest(query, variables);
    const data = result.data as {
      projects: {
        nodes: Array<{ id: string; name: string; state: string }>;
      };
    };

    const projects = data.projects.nodes;

    if (projects.length === 0) {
      return null;
    }

    // Prefer exact match, fall back to first result
    const exactMatch = projects.find(
      p => p.name.toLowerCase() === projectName.toLowerCase()
    );

    if (exactMatch) {
      return { id: exactMatch.id, name: exactMatch.name };
    }

    // If multiple partial matches, warn user
    if (projects.length > 1) {
      console.warn(`Warning: Multiple projects match "${projectName}":`);
      projects.forEach(p => console.warn(`  - ${p.name} (${p.id})`));
      console.warn(`Using first match: ${projects[0].name}`);
    }

    return { id: projects[0].id, name: projects[0].name };
  } catch (error) {
    console.error('Error looking up project:', error);
    return null;
  }
}

async function lookupTeamByKey(
  client: LinearClient,
  teamKey: string
): Promise<{ id: string; key: string; name: string } | null> {
  const query = `
    query TeamByKey($filter: TeamFilter!) {
      teams(filter: $filter, first: 1) {
        nodes {
          id
          key
          name
        }
      }
    }
  `;

  const variables = {
    filter: {
      key: { eq: teamKey.toUpperCase() }
    }
  };

  try {
    const result = await client.client.rawRequest(query, variables);
    const data = result.data as {
      teams: {
        nodes: Array<{ id: string; key: string; name: string }>;
      };
    };

    return data.teams.nodes[0] || null;
  } catch (error) {
    console.error('Error looking up team:', error);
    return null;
  }
}

async function lookupStateByName(
  client: LinearClient,
  teamId: string,
  stateName: string
): Promise<string | null> {
  const query = `
    query WorkflowStates($filter: WorkflowStateFilter!) {
      workflowStates(filter: $filter, first: 1) {
        nodes {
          id
          name
        }
      }
    }
  `;

  const variables = {
    filter: {
      team: { id: { eq: teamId } },
      name: { eq: stateName }
    }
  };

  try {
    const result = await client.client.rawRequest(query, variables);
    const data = result.data as {
      workflowStates: {
        nodes: Array<{ id: string; name: string }>;
      };
    };

    return data.workflowStates.nodes[0]?.id || null;
  } catch (error) {
    console.error('Error looking up state:', error);
    return null;
  }
}

async function lookupLabelIds(
  client: LinearClient,
  teamId: string,
  labelNames: string[]
): Promise<string[]> {
  const query = `
    query Labels($filter: IssueLabelFilter!) {
      issueLabels(filter: $filter, first: 50) {
        nodes {
          id
          name
        }
      }
    }
  `;

  const variables = {
    filter: {
      team: { id: { eq: teamId } },
      name: { in: labelNames }
    }
  };

  try {
    const result = await client.client.rawRequest(query, variables);
    const data = result.data as {
      issueLabels: {
        nodes: Array<{ id: string; name: string }>;
      };
    };

    const foundLabels = data.issueLabels.nodes;
    const foundNames = foundLabels.map(l => l.name.toLowerCase());
    const missingLabels = labelNames.filter(
      name => !foundNames.includes(name.toLowerCase())
    );

    if (missingLabels.length > 0) {
      console.warn(`Warning: Labels not found: ${missingLabels.join(', ')}`);
    }

    return foundLabels.map(l => l.id);
  } catch (error) {
    console.error('Error looking up labels:', error);
    return [];
  }
}

async function main() {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    console.error('Error: LINEAR_API_KEY environment variable is required');
    process.exit(1);
  }

  const args = parseArgs();
  const client = new LinearClient({ apiKey });

  // Step 1: Look up team
  console.log(`Looking up team "${args.team}"...`);
  const team = await lookupTeamByKey(client, args.team);
  if (!team) {
    console.error(`Error: Team "${args.team}" not found`);
    process.exit(1);
  }
  console.log(`  Found: ${team.name} (${team.key})`);

  // Step 2: Look up project
  console.log(`Looking up project "${args.project}"...`);
  const project = await lookupProjectByName(client, args.project);
  if (!project) {
    console.error(`Error: Project "${args.project}" not found`);
    console.error('');
    console.error('Available projects can be listed with:');
    console.error('  LINEAR_API_KEY=xxx npx tsx scripts/query.ts "query { projects { nodes { id name } } }"');
    process.exit(1);
  }
  console.log(`  Found: ${project.name}`);

  // Step 3: Look up state (if specified)
  let stateId: string | undefined;
  if (args.state) {
    console.log(`Looking up state "${args.state}"...`);
    stateId = (await lookupStateByName(client, team.id, args.state)) || undefined;
    if (!stateId) {
      console.error(`Error: State "${args.state}" not found for team ${team.key}`);
      process.exit(1);
    }
    console.log(`  Found state: ${args.state}`);
  }

  // Step 4: Look up labels (if specified)
  let labelIds: string[] | undefined;
  if (args.labels && args.labels.length > 0) {
    console.log(`Looking up labels: ${args.labels.join(', ')}...`);
    labelIds = await lookupLabelIds(client, team.id, args.labels);
    if (labelIds.length > 0) {
      console.log(`  Found ${labelIds.length} label(s)`);
    }
  }

  // Step 5: Get viewer ID if assigning to self
  let assigneeId: string | undefined;
  if (args.assignee === 'me') {
    const viewer = await client.viewer;
    assigneeId = viewer.id;
    console.log(`Assigning to: ${viewer.name}`);
  }

  // Step 6: Create the issue with projectId
  console.log('Creating issue...');

  const mutation = `
    mutation CreateIssueWithProject($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
          project {
            name
          }
        }
      }
    }
  `;

  const input: Record<string, unknown> = {
    teamId: team.id,
    title: args.title,
    projectId: project.id
  };

  if (args.description) input.description = args.description;
  if (stateId) input.stateId = stateId;
  if (assigneeId) input.assigneeId = assigneeId;
  if (args.priority) input.priority = args.priority;
  if (labelIds && labelIds.length > 0) input.labelIds = labelIds;

  try {
    const result = await client.client.rawRequest(mutation, { input });
    const data = result.data as {
      issueCreate: {
        success: boolean;
        issue: {
          id: string;
          identifier: string;
          title: string;
          url: string;
          project: { name: string } | null;
        };
      };
    };

    if (data.issueCreate.success) {
      const issue = data.issueCreate.issue;
      console.log('');
      console.log('Issue created successfully!');
      console.log(`  Identifier: ${issue.identifier}`);
      console.log(`  Title: ${issue.title}`);
      console.log(`  Project: ${issue.project?.name || 'None'}`);
      console.log(`  URL: ${issue.url}`);
      console.log('');
      console.log(JSON.stringify(issue, null, 2));
    } else {
      console.error('Error: Issue creation failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error creating issue:', error);
    process.exit(1);
  }
}

main();
