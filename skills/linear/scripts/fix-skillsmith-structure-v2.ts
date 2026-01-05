/**
 * Fix Skillsmith Linear Structure (v2 - handles 255 char limit)
 *
 * 1. Link all Skillsmith projects to Skillsmith initiative
 * 2. Update project descriptions (short) + create project updates for details
 * 3. Add labels to issues
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

const SKILLSMITH_INITIATIVE_ID = '5e1cebfe-f4bb-42c1-988d-af792fc4253b'

// Short project descriptions (under 255 chars)
const projectUpdates: Record<string, { description: string; name?: string; state: string; details: string }> = {
  'Skillsmith Phase 5: Release & Publishing': {
    description: 'npm publishing, license infrastructure, and Stripe billing. Feature bifurcation: Community ($0), Team ($25), Enterprise ($55). No usage limits.',
    state: 'started',
    details: `# Phase 5: Release & Publishing

## Strategy
**Feature Bifurcation** (not usage limits):
- Community: $0/forever - All core features, unlimited
- Team: $25/user/month - Collaboration
- Enterprise: $55/user/month - Security, compliance

## Epics
### 5A: npm Publishing (SMI-1048 to SMI-1052)
Publish free tier to public npm.

### 5B: License Infrastructure (SMI-1053 to SMI-1061)
JWT license validation with feature flags (NO usage limits).

### 5C: Billing Backend (SMI-1062 to SMI-1071)
Stripe integration, subscription API.

## Resources
- docs/strategy/go-to-market-analysis.md
- docs/adr/013-open-core-licensing.md
- docs/adr/014-license-validation.md

## Definition of Done
- [ ] Free tier packages on npm
- [ ] LicenseValidator per ADR-014
- [ ] Stripe webhooks working
- [ ] License keys auto-generated`
  },
  'Phase 6: Commercialization': {
    name: 'Skillsmith Phase 6: Website & Portal',
    description: 'Marketing website + Stripe subscription portal. Next.js + Tailwind + Supabase + Vercel. 17 issues across website, portal, and auth epics.',
    state: 'planned',
    details: `# Phase 6: Website & Portal

## Tech Stack
- Next.js 14 + App Router
- Tailwind CSS
- Stripe Checkout
- Supabase Auth
- Vercel

## Epics
### Marketing Website (6 issues)
Landing, pricing, docs, features, FAQ

### Subscription Portal (7 issues)
Stripe Checkout, dashboard, license delivery

### Authentication (4 issues)
Registration, login, password reset, orgs

## Definition of Done
- [ ] Landing page at skillsmith.io
- [ ] Pricing shows $0/$25/$55 tiers
- [ ] Stripe Checkout working
- [ ] User auth functional`
  },
  'Phase 7: Enterprise Implementation': {
    name: 'Skillsmith Phase 7: Enterprise Features',
    description: 'Gated enterprise features: ImmutableStore (SHA-256), SIEM exporters (Splunk, Datadog), SOC 2 reports. Requires Phase 5B license infrastructure.',
    state: 'planned',
    details: `# Phase 7: Enterprise Features

## Prerequisites
- Phase 5B: License infrastructure
- Phase 5C: Billing backend

## Features
- SMI-1042: ImmutableStore (SHA-256 hash chains)
- SMI-1044: SIEM exporters (Splunk, Datadog)
- SMI-1046: SOC 2 reports

## Dependencies
| Issue | Depends On |
|-------|------------|
| SMI-1042 | SMI-1053, SMI-1055, SMI-1059 |
| SMI-1044 | SMI-1053, SMI-1058, SMI-1059 |
| SMI-1046 | SMI-1053, SMI-1058, SMI-1059 |

## Definition of Done
- [ ] ImmutableStore with verification
- [ ] SIEM exporters working
- [ ] SOC 2 report generation
- [ ] All features gated by license`
  }
}

// Labels to add to issues
const issueLabels: Record<string, string[]> = {
  // Phase 5A: npm Publishing
  'SMI-1048': ['npm', 'ci', 'security'],
  'SMI-1049': ['npm', 'build'],
  'SMI-1050': ['ci', 'npm', 'automation'],
  'SMI-1051': ['legal', 'enterprise'],
  'SMI-1052': ['npm', 'enterprise'],
  // Phase 5B: License Infrastructure
  'SMI-1053': ['enterprise', 'security'],
  'SMI-1054': ['enterprise', 'backend'],
  'SMI-1055': ['enterprise', 'mcp'],
  'SMI-1056': ['cli', 'enterprise'],
  'SMI-1057': ['vscode', 'enterprise'],
  'SMI-1058': ['enterprise', 'security'],
  'SMI-1059': ['enterprise', 'mcp'],
  'SMI-1060': ['enterprise', 'ux'],
  'SMI-1061': ['enterprise', 'ux'],
  // Phase 5C: Billing
  'SMI-1062': ['billing', 'backend'],
  'SMI-1063': ['billing', 'backend'],
  'SMI-1064': ['billing', 'ux'],
  'SMI-1065': ['billing', 'ux', 'enterprise'],
  'SMI-1066': ['billing', 'enterprise'],
  'SMI-1067': ['billing', 'backend'],
  'SMI-1068': ['billing', 'ux'],
  'SMI-1069': ['billing', 'backend'],
  'SMI-1070': ['billing', 'backend'],
  'SMI-1071': ['billing', 'marketplace'],
  // Phase 7: Enterprise
  'SMI-1042': ['enterprise', 'security', 'soc2'],
  'SMI-1043': ['cli', 'feature'],
  'SMI-1044': ['enterprise', 'integration'],
  'SMI-1045': ['ci', 'performance'],
  'SMI-1046': ['enterprise', 'soc2', 'reporting'],
  'SMI-1047': ['documentation', 'security']
}

async function main() {
  console.log('=== Fixing Skillsmith Linear Structure (v2) ===\n')

  // Get team
  const teams = await client.teams()
  const team = teams.nodes[0]
  console.log(`Team: ${team.name}\n`)

  // 1. Get or create all required labels
  console.log('--- Creating/Finding Labels ---')
  const labelsResult = await client.issueLabels()
  const labelMap = new Map(labelsResult.nodes.map(l => [l.name.toLowerCase(), l.id]))

  const requiredLabels = [
    'npm', 'ci', 'security', 'build', 'automation', 'legal', 'enterprise',
    'backend', 'mcp', 'cli', 'vscode', 'ux', 'billing', 'marketplace',
    'soc2', 'feature', 'integration', 'performance', 'reporting', 'documentation',
    'website', 'frontend', 'stripe', 'auth', 'dashboard', 'phase-6'
  ]

  for (const labelName of requiredLabels) {
    if (!labelMap.has(labelName.toLowerCase())) {
      try {
        const result = await client.createIssueLabel({
          teamId: team.id,
          name: labelName,
          color: getColorForLabel(labelName)
        })
        const label = await result.issueLabel
        if (label) {
          labelMap.set(labelName.toLowerCase(), label.id)
          console.log(`  Created: ${labelName}`)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('Duplicate')) {
          console.log(`  Exists: ${labelName}`)
        }
      }
    } else {
      // Label already exists
    }
  }
  console.log('  Labels ready')

  // 2. Update projects
  console.log('\n--- Updating Projects ---')
  const projects = await client.projects()

  for (const proj of projects.nodes) {
    const update = projectUpdates[proj.name as keyof typeof projectUpdates]
    if (update) {
      console.log(`\nUpdating: ${proj.name}`)

      try {
        const updateData: Record<string, unknown> = {
          description: update.description,
          state: update.state
        }

        if (update.name) {
          updateData.name = update.name
        }

        await client.updateProject(proj.id, updateData)
        console.log(`  ✓ Description updated (${update.description.length} chars)`)
        console.log(`  ✓ State: ${update.state}`)

        // Try to link to initiative
        try {
          await client.client.rawRequest(`
            mutation {
              projectUpdate(id: "${proj.id}", input: { initiativeIds: ["${SKILLSMITH_INITIATIVE_ID}"] }) {
                success
              }
            }
          `)
          console.log(`  ✓ Linked to Skillsmith initiative`)
        } catch {
          console.log(`  ⚠ Could not link to initiative`)
        }

        // Create a project update with details
        try {
          await client.createProjectUpdate({
            projectId: proj.id,
            body: update.details
          })
          console.log(`  ✓ Created project update with details`)
        } catch (e) {
          console.log(`  ⚠ Could not create project update: ${e}`)
        }

      } catch (e) {
        console.log(`  ✗ Error: ${e}`)
      }
    }
  }

  // 3. Add labels to Phase 5 and 7 issues
  console.log('\n--- Adding Labels to Issues ---')

  let labeledCount = 0
  for (const [identifier, labels] of Object.entries(issueLabels)) {
    const issueNumber = parseInt(identifier.split('-')[1], 10)
    const issues = await client.issues({
      filter: { number: { eq: issueNumber } }
    })

    const issue = issues.nodes[0]
    if (issue) {
      const labelIds = labels
        .map(name => labelMap.get(name.toLowerCase()))
        .filter((id): id is string => id !== undefined)

      if (labelIds.length > 0) {
        // Get existing labels
        const existingLabels = await issue.labels()
        const existingIds = existingLabels.nodes.map(l => l.id)
        const allLabelIds = [...new Set([...existingIds, ...labelIds])]

        await client.updateIssue(issue.id, {
          labelIds: allLabelIds
        })
        console.log(`  ${identifier}: +${labels.join(', ')}`)
        labeledCount++
      }
    }
  }
  console.log(`  Labeled ${labeledCount} issues`)

  // 4. Verify Phase 6 issues
  console.log('\n--- Verifying Phase 6 Issues ---')
  const phase6Issues = await client.issues({
    filter: { number: { gte: 1072, lte: 1100 } },
    first: 30
  })
  console.log(`  Found ${phase6Issues.nodes.length} Phase 6 issues (SMI-1072+)`)

  // List them
  for (const issue of phase6Issues.nodes.slice(0, 5)) {
    const labels = await issue.labels()
    const labelNames = labels.nodes.map(l => l.name).join(', ')
    console.log(`    ${issue.identifier}: ${issue.title.substring(0, 35)}... [${labelNames}]`)
  }
  if (phase6Issues.nodes.length > 5) {
    console.log(`    ... and ${phase6Issues.nodes.length - 5} more`)
  }

  console.log('\n✅ Skillsmith structure updated!')
}

function getColorForLabel(label: string): string {
  const colors: Record<string, string> = {
    'npm': '#CB3837',
    'ci': '#2088FF',
    'security': '#D73A4A',
    'build': '#0E8A16',
    'automation': '#5319E7',
    'legal': '#FEF2C0',
    'enterprise': '#7057FF',
    'backend': '#1D76DB',
    'mcp': '#006B75',
    'cli': '#E99695',
    'vscode': '#007ACC',
    'ux': '#D4C5F9',
    'billing': '#F9D0C4',
    'marketplace': '#BFD4F2',
    'soc2': '#0052CC',
    'feature': '#A2EEEF',
    'integration': '#7057FF',
    'performance': '#FBCA04',
    'reporting': '#D93F0B',
    'documentation': '#0075CA',
    'website': '#3B82F6',
    'frontend': '#10B981',
    'stripe': '#635BFF',
    'auth': '#EF4444',
    'dashboard': '#06B6D4',
    'phase-6': '#EC4899'
  }
  return colors[label.toLowerCase()] || '#6B7280'
}

main().catch(console.error)
