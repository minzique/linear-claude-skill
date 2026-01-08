#!/usr/bin/env npx tsx
/**
 * Linear High-Level Operations
 *
 * Simple commands for common Linear operations without needing to understand the API.
 *
 * Usage:
 *   npx tsx linear-ops.ts <command> [args]
 *
 * Commands:
 *   create-issue <project> <title> [desc]    Create an issue in a project
 *   create-initiative <name> [description]   Create a new initiative
 *   create-project <name> [initiative]       Create a project (optionally linked to initiative)
 *   create-project-update <project> <body>   Create a project update
 *   create-initiative-update <init> <body>   Create an initiative update
 *   add-link <project|initiative> <url> <label>  Add external link to project or initiative
 *   status <state> <issue-numbers...>        Update issue status (Done, In Progress, etc.)
 *   list-initiatives                         List all initiatives
 *   list-projects [initiative]               List projects (optionally filter by initiative)
 *   setup                                    Check setup and configuration
 *   whoami                                   Show current user and organization
 */

import { LinearClient, Initiative, Project } from '@linear/sdk';

// Validate API key early
const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) {
  console.error('\n[ERROR] LINEAR_API_KEY environment variable is required\n');
  console.error('To fix this:');
  console.error('  1. Go to Linear -> Settings -> Security & access -> Personal API keys');
  console.error('  2. Create a new API key');
  console.error('  3. Run: export LINEAR_API_KEY="lin_api_..."');
  console.error('\nOr run setup to check all requirements:');
  console.error('  npx tsx setup.ts\n');
  process.exit(1);
}

const client = new LinearClient({ apiKey: API_KEY });

// Command implementations
const commands: Record<string, (...args: string[]) => Promise<void>> = {

  async 'create-issue'(projectName: string, title: string, description?: string, ...flags: string[]) {
    if (!projectName || !title) {
      console.error('Usage: create-issue <project-name> <title> [description] [--priority 1-4] [--labels label1,label2]');
      console.error('Example: create-issue "My Project" "Fix login bug" "Users cannot log in"');
      console.error('\nPriority: 1=urgent, 2=high, 3=medium, 4=low (default: 3)');
      process.exit(1);
    }

    // Parse flags
    let priority = 3;
    let labelNames: string[] = [];

    for (let i = 0; i < flags.length; i++) {
      if (flags[i] === '--priority' && flags[i + 1]) {
        priority = parseInt(flags[i + 1], 10);
        i++;
      } else if (flags[i] === '--labels' && flags[i + 1]) {
        labelNames = flags[i + 1].split(',').map(l => l.trim());
        i++;
      }
    }

    console.log(`Creating issue in project: ${projectName}...`);

    // Find project by name
    const projects = await client.projects({
      filter: { name: { containsIgnoreCase: projectName } }
    });

    if (projects.nodes.length === 0) {
      console.error(`[ERROR] Project "${projectName}" not found`);
      process.exit(1);
    }

    const project = projects.nodes[0];
    console.log(`  Found project: ${project.name}`);

    // Get team from project
    const teams = await client.teams();
    if (teams.nodes.length === 0) {
      console.error('[ERROR] No teams found in your workspace');
      process.exit(1);
    }
    const team = teams.nodes[0];
    console.log(`  Using team: ${team.name}`);

    // Resolve label names to IDs if provided
    let labelIds: string[] = [];
    if (labelNames.length > 0) {
      const labels = await team.labels();
      for (const name of labelNames) {
        const label = labels.nodes.find(l =>
          l.name.toLowerCase() === name.toLowerCase()
        );
        if (label) {
          labelIds.push(label.id);
          console.log(`  Found label: ${label.name}`);
        } else {
          console.log(`  [WARNING] Label "${name}" not found, skipping`);
        }
      }
    }

    const result = await client.createIssue({
      teamId: team.id,
      projectId: project.id,
      title,
      description: description || '',
      priority,
      ...(labelIds.length > 0 && { labelIds })
    });

    const issue = await result.issue;
    if (issue) {
      console.log('\n[SUCCESS] Issue created!');
      console.log(`  ID:       ${issue.identifier}`);
      console.log(`  Title:    ${issue.title}`);
      console.log(`  Priority: ${priority}`);
      console.log(`  Project:  ${project.name}`);
      console.log(`  URL:      ${issue.url}`);
    } else {
      console.error('[ERROR] Failed to create issue');
      process.exit(1);
    }
  },

  async 'create-initiative'(name: string, description?: string) {
    if (!name) {
      console.error('Usage: create-initiative <name> [description]');
      console.error('Example: create-initiative "Q1 2025 Goals" "Key initiatives for Q1"');
      process.exit(1);
    }

    console.log(`Creating initiative: ${name}...`);

    const me = await client.viewer;
    const result = await client.createInitiative({
      name,
      description: description || `Initiative: ${name}`,
      ownerId: me.id
    });

    const initiative = await result.initiative;
    if (initiative) {
      // Get the URL by querying the initiative
      const initiatives = await client.initiatives({ filter: { id: { eq: initiative.id } } });
      const url = initiatives.nodes[0]?.url || `https://linear.app/initiative/${initiative.id}`;

      console.log('\n[SUCCESS] Initiative created!');
      console.log(`  Name: ${initiative.name}`);
      console.log(`  ID:   ${initiative.id}`);
      console.log(`  URL:  ${url}`);
    } else {
      console.error('[ERROR] Failed to create initiative');
      process.exit(1);
    }
  },

  async 'create-project'(name: string, initiativeName?: string) {
    if (!name) {
      console.error('Usage: create-project <name> [initiative-name]');
      console.error('Example: create-project "Phase 1: Foundation" "Q1 2025 Goals"');
      process.exit(1);
    }

    console.log(`Creating project: ${name}...`);

    // Get first team (required for project)
    const teams = await client.teams();
    if (teams.nodes.length === 0) {
      console.error('[ERROR] No teams found in your workspace');
      process.exit(1);
    }
    const team = teams.nodes[0];
    console.log(`  Using team: ${team.name}`);

    // Find initiative if specified
    let initiativeId: string | undefined;
    if (initiativeName) {
      const initiatives = await client.initiatives({
        filter: { name: { containsIgnoreCase: initiativeName } }
      });

      if (initiatives.nodes.length === 0) {
        console.error(`[WARNING] Initiative "${initiativeName}" not found, creating unlinked project`);
      } else {
        initiativeId = initiatives.nodes[0].id;
        console.log(`  Linking to initiative: ${initiatives.nodes[0].name}`);
      }
    }

    const result = await client.createProject({
      name,
      teamIds: [team.id],
      ...(initiativeId && { initiativeIds: [initiativeId] })
    });

    const project = await result.project;
    if (project) {
      console.log('\n[SUCCESS] Project created!');
      console.log(`  Name: ${project.name}`);
      console.log(`  ID:   ${project.id}`);
      console.log(`  URL:  ${project.url}`);
    } else {
      console.error('[ERROR] Failed to create project');
      process.exit(1);
    }
  },

  async 'create-project-update'(projectName: string, body: string, healthFlag?: string) {
    if (!projectName || !body) {
      console.error('Usage: create-project-update <project-name> <body> [--health onTrack|atRisk|offTrack]');
      console.error('Example: create-project-update "My Project" "## Summary\\n\\nWork completed..."');
      process.exit(1);
    }

    // Parse health flag
    let health: 'onTrack' | 'atRisk' | 'offTrack' = 'onTrack';
    if (healthFlag === '--health' || healthFlag?.startsWith('--health=')) {
      const value = healthFlag.includes('=') ? healthFlag.split('=')[1] : body;
      if (['onTrack', 'atRisk', 'offTrack'].includes(value)) {
        health = value as typeof health;
      }
    }

    console.log(`Creating project update for: ${projectName}...`);

    // Find project by name
    const projects = await client.projects({
      filter: { name: { containsIgnoreCase: projectName } }
    });

    if (projects.nodes.length === 0) {
      console.error(`[ERROR] Project "${projectName}" not found`);
      process.exit(1);
    }

    const project = projects.nodes[0];
    console.log(`  Found project: ${project.name}`);

    const result = await client.createProjectUpdate({
      projectId: project.id,
      body,
      health
    });

    const update = await result.projectUpdate;
    if (update) {
      console.log('\n[SUCCESS] Project update created!');
      console.log(`  Health: ${health}`);
      console.log(`  URL:    ${update.url}`);
    } else {
      console.error('[ERROR] Failed to create project update');
      process.exit(1);
    }
  },

  async 'create-initiative-update'(initiativeName: string, body: string, healthFlag?: string) {
    if (!initiativeName || !body) {
      console.error('Usage: create-initiative-update <initiative-name> <body> [--health onTrack|atRisk|offTrack]');
      console.error('Example: create-initiative-update "My Initiative" "## Phase Complete\\n\\n..."');
      process.exit(1);
    }

    // Parse health flag
    let health: 'onTrack' | 'atRisk' | 'offTrack' = 'onTrack';
    if (healthFlag === '--health' || healthFlag?.startsWith('--health=')) {
      const value = healthFlag.includes('=') ? healthFlag.split('=')[1] : body;
      if (['onTrack', 'atRisk', 'offTrack'].includes(value)) {
        health = value as typeof health;
      }
    }

    console.log(`Creating initiative update for: ${initiativeName}...`);

    // Find initiative by name
    const initiatives = await client.initiatives({
      filter: { name: { containsIgnoreCase: initiativeName } }
    });

    if (initiatives.nodes.length === 0) {
      console.error(`[ERROR] Initiative "${initiativeName}" not found`);
      process.exit(1);
    }

    const initiative = initiatives.nodes[0];
    console.log(`  Found initiative: ${initiative.name}`);

    const result = await client.createInitiativeUpdate({
      initiativeId: initiative.id,
      body,
      health
    });

    const update = await result.initiativeUpdate;
    if (update) {
      console.log('\n[SUCCESS] Initiative update created!');
      console.log(`  Health: ${health}`);
      console.log(`  URL:    ${update.url}`);
    } else {
      console.error('[ERROR] Failed to create initiative update');
      process.exit(1);
    }
  },

  async 'add-link'(targetName: string, url: string, label: string) {
    if (!targetName || !url || !label) {
      console.error('Usage: add-link <project-or-initiative-name> <url> <label>');
      console.error('Example: add-link "Phase 6A" "https://github.com/..." "Implementation Plan"');
      console.error('\nAdds an external resource link to a project or initiative.');
      process.exit(1);
    }

    console.log(`Adding link to: ${targetName}...`);

    // Try to find as project first
    const projects = await client.projects({
      filter: { name: { containsIgnoreCase: targetName } }
    });

    let entityType: 'project' | 'initiative' = 'project';
    let entityId: string;
    let entityName: string;

    if (projects.nodes.length > 0) {
      entityId = projects.nodes[0].id;
      entityName = projects.nodes[0].name;
      console.log(`  Found project: ${entityName}`);
    } else {
      // Try to find as initiative
      const initiatives = await client.initiatives({
        filter: { name: { containsIgnoreCase: targetName } }
      });

      if (initiatives.nodes.length === 0) {
        console.error(`[ERROR] No project or initiative found matching "${targetName}"`);
        process.exit(1);
      }

      entityType = 'initiative';
      entityId = initiatives.nodes[0].id;
      entityName = initiatives.nodes[0].name;
      console.log(`  Found initiative: ${entityName}`);
    }

    // Use GraphQL directly since SDK doesn't expose entityExternalLinkCreate
    const API_URL = 'https://api.linear.app/graphql';
    const mutation = `
      mutation CreateExternalLink($input: EntityExternalLinkCreateInput!) {
        entityExternalLinkCreate(input: $input) {
          success
          entityExternalLink {
            id
            label
            url
          }
        }
      }
    `;

    const input: Record<string, string> = { url, label };
    if (entityType === 'project') {
      input.projectId = entityId;
    } else {
      input.initiativeId = entityId;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY!
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input }
      })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('[ERROR] GraphQL errors:', JSON.stringify(data.errors, null, 2));
      process.exit(1);
    }

    if (data.data.entityExternalLinkCreate.success) {
      const link = data.data.entityExternalLinkCreate.entityExternalLink;
      console.log('\n[SUCCESS] External link added!');
      console.log(`  ID:    ${link.id}`);
      console.log(`  Label: ${link.label}`);
      console.log(`  URL:   ${link.url}`);
      console.log(`  Added to ${entityType}: ${entityName}`);
    } else {
      console.error('[ERROR] Failed to create external link');
      process.exit(1);
    }
  },

  async 'status'(state: string, ...issueNumbers: string[]) {
    if (!state || issueNumbers.length === 0) {
      console.error('Usage: status <state> <issue-numbers...>');
      console.error('Example: status Done 123 124 125');
      console.error('Example: status Done SMI-123 SMI-124  (prefix is stripped automatically)');
      console.error('\nAvailable states: Backlog, Todo, In Progress, In Review, Done, Canceled');
      process.exit(1);
    }

    // Normalize state name
    const stateMap: Record<string, string> = {
      'backlog': 'Backlog',
      'todo': 'Todo',
      'in progress': 'In Progress',
      'inprogress': 'In Progress',
      'in review': 'In Review',
      'inreview': 'In Review',
      'done': 'Done',
      'canceled': 'Canceled',
      'cancelled': 'Canceled'
    };

    const normalizedState = stateMap[state.toLowerCase()] || state;

    console.log(`Updating ${issueNumbers.length} issue(s) to "${normalizedState}"...\n`);

    // Get workflow states to find the state ID
    const states = await client.workflowStates({
      filter: { name: { eq: normalizedState } }
    });

    if (states.nodes.length === 0) {
      console.error(`[ERROR] State "${normalizedState}" not found`);
      console.error('Available states: Backlog, Todo, In Progress, In Review, Done, Canceled');
      process.exit(1);
    }

    const stateId = states.nodes[0].id;

    // Process each issue
    let success = 0;
    let failed = 0;

    for (const num of issueNumbers) {
      // Strip prefix if present (e.g., "SMI-123" -> "123", "ENG-456" -> "456")
      const cleanedNum = num.replace(/^[A-Z]+-/i, '');
      const issueNum = parseInt(cleanedNum, 10);
      if (isNaN(issueNum)) {
        console.log(`  [SKIP] "${num}" is not a valid issue number`);
        failed++;
        continue;
      }

      try {
        // Find issue by number
        const issues = await client.issues({
          filter: { number: { eq: issueNum } }
        });

        if (issues.nodes.length === 0) {
          console.log(`  [NOT FOUND] Issue #${issueNum}`);
          failed++;
          continue;
        }

        const issue = issues.nodes[0];
        await issue.update({ stateId });
        console.log(`  [OK] ${issue.identifier} -> ${normalizedState}`);
        success++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`  [ERROR] Issue #${issueNum}: ${msg}`);
        failed++;
      }
    }

    console.log(`\nResult: ${success} updated, ${failed} failed`);
    if (failed > 0) process.exit(1);
  },

  async 'list-initiatives'() {
    console.log('Fetching initiatives...\n');

    const initiatives = await client.initiatives({ first: 50 });

    if (initiatives.nodes.length === 0) {
      console.log('No initiatives found.');
      return;
    }

    console.log('Initiatives:');
    for (const init of initiatives.nodes) {
      const status = init.status || 'No status';
      console.log(`  - ${init.name}`);
      console.log(`    ID: ${init.id}`);
      console.log(`    Status: ${status}`);
      console.log(`    URL: ${init.url}`);
      console.log('');
    }
  },

  async 'list-projects'(initiativeName?: string) {
    console.log('Fetching projects...\n');

    let filter = {};
    if (initiativeName) {
      // Find initiative first
      const initiatives = await client.initiatives({
        filter: { name: { containsIgnoreCase: initiativeName } }
      });

      if (initiatives.nodes.length === 0) {
        console.error(`[ERROR] Initiative "${initiativeName}" not found`);
        process.exit(1);
      }

      console.log(`Filtering by initiative: ${initiatives.nodes[0].name}\n`);
      filter = { initiatives: { id: { eq: initiatives.nodes[0].id } } };
    }

    const projects = await client.projects({ first: 50, filter });

    if (projects.nodes.length === 0) {
      console.log('No projects found.');
      return;
    }

    console.log('Projects:');
    for (const proj of projects.nodes) {
      const status = await proj.status;
      console.log(`  - ${proj.name}`);
      console.log(`    ID: ${proj.id}`);
      console.log(`    Status: ${status?.name || 'No status'}`);
      console.log(`    URL: ${proj.url}`);
      console.log('');
    }
  },

  async 'setup'() {
    // Delegate to setup script
    const { execSync } = await import('child_process');
    const { dirname } = await import('path');
    const { fileURLToPath } = await import('url');

    const __dirname = dirname(fileURLToPath(import.meta.url));
    execSync(`npx tsx ${__dirname}/setup.ts`, { stdio: 'inherit' });
  },

  async 'whoami'() {
    console.log('Fetching user info...\n');

    const me = await client.viewer;
    const org = await me.organization;
    const teams = await me.teams();

    console.log('Current User:');
    console.log(`  Name:  ${me.name}`);
    console.log(`  Email: ${me.email}`);
    console.log(`  ID:    ${me.id}`);
    console.log('');
    console.log('Organization:');
    console.log(`  Name: ${org?.name || 'Unknown'}`);
    console.log(`  ID:   ${org?.id || 'Unknown'}`);
    console.log('');
    console.log('Teams:');
    for (const team of teams.nodes) {
      console.log(`  - ${team.name} (${team.key})`);
    }
  },

  // Alias: done <issue-numbers...> -> status Done <issue-numbers...>
  async 'done'(...issueNumbers: string[]) {
    if (issueNumbers.length === 0) {
      console.error('Usage: done <issue-numbers...>');
      console.error('Example: done 123 124 125');
      console.error('Example: done SMI-123 SMI-124  (prefix is stripped automatically)');
      console.error('\nThis is a shortcut for: status Done <issue-numbers...>');
      process.exit(1);
    }
    await commands['status']('Done', ...issueNumbers);
  },

  // Alias: wip <issue-numbers...> -> status "In Progress" <issue-numbers...>
  async 'wip'(...issueNumbers: string[]) {
    if (issueNumbers.length === 0) {
      console.error('Usage: wip <issue-numbers...>');
      console.error('Example: wip 123 124 125');
      console.error('Example: wip SMI-123 SMI-124  (prefix is stripped automatically)');
      console.error('\nThis is a shortcut for: status "In Progress" <issue-numbers...>');
      process.exit(1);
    }
    await commands['status']('In Progress', ...issueNumbers);
  },

  async 'help'() {
    console.log(`
Linear High-Level Operations

Usage:
  npx tsx linear-ops.ts <command> [arguments]

Commands:
  create-issue <project-name> <title> [description] [--priority 1-4] [--labels label1,label2]
    Create a new issue in a project
    Priority: 1=urgent, 2=high, 3=medium, 4=low (default: 3)

  create-initiative <name> [description]
    Create a new initiative

  create-project <name> [initiative-name]
    Create a project, optionally linked to an initiative

  create-project-update <project-name> <body> [--health onTrack|atRisk|offTrack]
    Create a project update with markdown body

  create-initiative-update <initiative-name> <body> [--health onTrack|atRisk|offTrack]
    Create an initiative update with markdown body

  add-link <project-or-initiative-name> <url> <label>
    Add an external resource link to a project or initiative
    Automatically detects whether the target is a project or initiative

  status <state> <issue-numbers...>
    Update issue status (e.g., status Done 123 124 125)
    Accepts both formats: 123 or SMI-123 (prefix stripped automatically)
    States: Backlog, Todo, In Progress, In Review, Done, Canceled

  done <issue-numbers...>
    Shortcut for: status Done <issue-numbers...>
    Example: done SMI-123 SMI-124

  wip <issue-numbers...>
    Shortcut for: status "In Progress" <issue-numbers...>
    Example: wip SMI-123

  list-initiatives
    List all initiatives in the workspace

  list-projects [initiative-name]
    List projects, optionally filtered by initiative

  whoami
    Show current user and organization

  setup
    Check Linear skill setup and configuration

  help
    Show this help message

Examples:
  npx tsx linear-ops.ts create-issue "My Project" "Fix login bug" "Users cannot log in" --priority 2
  npx tsx linear-ops.ts create-initiative "Q1 2025 Goals" "Key initiatives for Q1"
  npx tsx linear-ops.ts create-project "Phase 1: Foundation" "Q1 2025 Goals"
  npx tsx linear-ops.ts create-project-update "My Project" "## Summary\\n\\nWork completed"
  npx tsx linear-ops.ts create-initiative-update "My Initiative" "## Phase Complete"
  npx tsx linear-ops.ts add-link "Phase 6A" "https://github.com/org/repo/docs/plan.md" "Implementation Plan"
  npx tsx linear-ops.ts status Done 123 124 125
  npx tsx linear-ops.ts done SMI-123 SMI-124
  npx tsx linear-ops.ts wip SMI-125
  npx tsx linear-ops.ts list-initiatives
`);
  }
};

// Main
async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    await commands['help']();
    return;
  }

  if (!commands[cmd]) {
    console.error(`Unknown command: ${cmd}\n`);
    console.error('Run with --help to see available commands');
    process.exit(1);
  }

  await commands[cmd](...args);
}

main().catch(error => {
  console.error('\n[ERROR]', error.message);
  process.exit(1);
});
