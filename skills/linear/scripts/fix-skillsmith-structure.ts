/**
 * Fix Skillsmith Linear Structure
 *
 * 1. Link all Skillsmith projects to Skillsmith initiative
 * 2. Update project descriptions with resources, definition of done
 * 3. Add labels to issues
 * 4. Create missing Phase 6 issues
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

const SKILLSMITH_INITIATIVE_ID = '5e1cebfe-f4bb-42c1-988d-af792fc4253b'

// Project descriptions with resources and definition of done
const projectUpdates = {
  'Skillsmith Phase 5: Release & Publishing': {
    description: `## Overview
Phase 5: npm Publishing, License Infrastructure, and Billing Backend

## Commercialization Strategy
**Feature Bifurcation** (not usage limits):
- Community: $0/forever - All core features, unlimited usage
- Team: $25/user/month - Collaboration features
- Enterprise: $55/user/month - Security, compliance, SSO

## Epics
### 5A: npm Publishing (SMI-1048 to SMI-1052)
Publish free tier packages to public npm immediately.

### 5B: License Infrastructure (SMI-1053 to SMI-1061)
JWT-based license validation with feature flags (NO usage limits).

### 5C: Billing Backend (SMI-1062 to SMI-1071)
Stripe integration, subscription API, webhook handlers.

## Resources
- [Go-to-Market Analysis](docs/strategy/go-to-market-analysis.md)
- [ADR-013: Open Core Licensing](docs/adr/013-open-core-licensing.md)
- [ADR-014: License Validation](docs/adr/014-license-validation.md)
- [Hive Mind Waves](docs/execution/hive-mind-waves-phase5-6-7.md)

## Definition of Done
- [ ] Free tier packages published to public npm (@skillsmith/core, mcp-server, cli)
- [ ] LicenseValidator class implemented per ADR-014
- [ ] Feature flags in JWT payload (NO usage quotas)
- [ ] Stripe webhooks handling all subscription events
- [ ] License keys auto-generated on payment
- [ ] Enterprise package configured for private registry`,
    state: 'started'
  },
  'Phase 6: Commercialization': {
    name: 'Skillsmith Phase 6: Website & Portal',
    description: `## Overview
Phase 6: Marketing website explaining tiers + Stripe-powered subscription portal

## Commercialization Strategy
**Feature Bifurcation** (not usage limits):
- Community: $0/forever - All core features, unlimited usage
- Team: $25/user/month - Collaboration features
- Enterprise: $55/user/month - Security, compliance, SSO

## Epics
### Marketing Website (6 issues)
Landing page, pricing, documentation, feature comparison, FAQ

### Subscription Portal (7 issues)
Stripe Checkout, account dashboard, license delivery, seat management

### Authentication (4 issues)
User registration, email verification, password reset, org management

## Tech Stack
- Next.js 14 + App Router
- Tailwind CSS
- Stripe Checkout + Billing Portal
- Supabase Auth
- Vercel deployment

## Resources
- [Go-to-Market Analysis](docs/strategy/go-to-market-analysis.md)
- [TERMS.md](docs/legal/TERMS.md) - Pricing details
- [Hive Mind Waves](docs/execution/hive-mind-waves-phase5-6-7.md)

## Definition of Done
- [ ] Landing page live at skillsmith.io
- [ ] Pricing page shows $0 / $25 / $55 tiers with "No usage limits" messaging
- [ ] Documentation site searchable with Getting Started guide
- [ ] Stripe Checkout working for Team and Enterprise tiers
- [ ] License key delivered after payment
- [ ] User registration, login, password reset working
- [ ] Organization/team management functional`,
    state: 'planned'
  },
  'Phase 7: Enterprise Implementation': {
    name: 'Skillsmith Phase 7: Enterprise Features',
    description: `## Overview
Phase 7: Gated enterprise features requiring license validation

## Prerequisites
- Phase 5B: License infrastructure complete
- Phase 5C: Billing backend complete
- All enterprise features gated by license validation

## Features
### ImmutableStore (SMI-1042)
SHA-256 hash chains for tamper-evident audit logs per ADR-015.

### SIEM Exporters (SMI-1044)
Splunk HEC and Datadog Logs API integration.

### SOC 2 Compliance (SMI-1046)
SOC 2 Trust Service Criteria mapping and report generation.

## Dependencies
| Issue | Depends On |
|-------|------------|
| SMI-1042 | SMI-1053, SMI-1055, SMI-1059 |
| SMI-1044 | SMI-1053, SMI-1058, SMI-1059 |
| SMI-1046 | SMI-1053, SMI-1058, SMI-1059 |

## Resources
- [ADR-015: Immutable Audit Log Storage](docs/adr/015-immutable-audit-log-storage.md)
- [ENTERPRISE_PACKAGE.md](docs/enterprise/ENTERPRISE_PACKAGE.md)
- [Hive Mind Waves](docs/execution/hive-mind-waves-phase5-6-7.md)

## Definition of Done
- [ ] ImmutableStore with hash chain verification
- [ ] Splunk and Datadog SIEM exporters working
- [ ] SOC 2 report generation functional
- [ ] All enterprise features gated by valid license
- [ ] @skillsmith/enterprise published to private npm`,
    state: 'planned'
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

// Missing Phase 6 issues (auth issues were created, but need to verify)
const missingPhase6Issues = [
  {
    title: 'Implement user registration and login',
    exists: true // SMI-1085
  },
  {
    title: 'Add email verification flow',
    exists: true // SMI-1086
  }
]

async function main() {
  console.log('=== Fixing Skillsmith Linear Structure ===\n')

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
    }
  }

  // 2. Update projects and link to initiative
  console.log('\n--- Updating Projects ---')
  const projects = await client.projects()

  for (const proj of projects.nodes) {
    const update = projectUpdates[proj.name as keyof typeof projectUpdates]
    if (update) {
      console.log(`\nUpdating: ${proj.name}`)

      const updateData: Record<string, unknown> = {
        description: update.description,
        state: update.state
      }

      // Add initiative link
      // Note: Linear SDK may not support initiativeId directly, check API

      if ('name' in update && update.name) {
        updateData.name = update.name
      }

      await client.updateProject(proj.id, updateData)
      console.log(`  ✓ Description updated`)
      console.log(`  ✓ State: ${update.state}`)

      // Link to initiative using GraphQL
      try {
        await client.client.rawRequest(`
          mutation {
            projectUpdate(id: "${proj.id}", input: { initiativeIds: ["${SKILLSMITH_INITIATIVE_ID}"] }) {
              success
            }
          }
        `)
        console.log(`  ✓ Linked to Skillsmith initiative`)
      } catch (e) {
        console.log(`  ⚠ Could not link to initiative (may need manual linking)`)
      }
    }
  }

  // 3. Add labels to Phase 5 and 7 issues
  console.log('\n--- Adding Labels to Issues ---')

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
        console.log(`  ${identifier}: Added ${labels.join(', ')}`)
      }
    }
  }

  // 4. Check Phase 6 issue count
  console.log('\n--- Verifying Phase 6 Issues ---')
  const phase6Issues = await client.issues({
    filter: { number: { gte: 1072 } },
    first: 25
  })
  console.log(`  Found ${phase6Issues.nodes.length} Phase 6 issues`)

  if (phase6Issues.nodes.length < 17) {
    console.log(`  ⚠ Expected 17+ issues, only found ${phase6Issues.nodes.length}`)
  } else {
    console.log(`  ✓ All Phase 6 issues present`)
  }

  console.log('\n✅ Skillsmith structure fixed!')
  console.log('\nManual steps needed:')
  console.log('  1. Verify initiative links in Linear UI')
  console.log('  2. Check all issues have correct labels')
}

function getColorForLabel(label: string): string {
  const colors: Record<string, string> = {
    'npm': '#CB3837',         // npm red
    'ci': '#2088FF',          // GitHub Actions blue
    'security': '#D73A4A',    // Red
    'build': '#0E8A16',       // Green
    'automation': '#5319E7',  // Purple
    'legal': '#FEF2C0',       // Yellow
    'enterprise': '#7057FF',  // Purple
    'backend': '#1D76DB',     // Blue
    'mcp': '#006B75',         // Teal
    'cli': '#E99695',         // Pink
    'vscode': '#007ACC',      // VS Code blue
    'ux': '#D4C5F9',          // Light purple
    'billing': '#F9D0C4',     // Peach
    'marketplace': '#BFD4F2', // Light blue
    'soc2': '#0052CC',        // Dark blue
    'feature': '#A2EEEF',     // Cyan
    'integration': '#7057FF', // Purple
    'performance': '#FBCA04', // Yellow
    'reporting': '#D93F0B',   // Orange
    'documentation': '#0075CA', // Blue
    'website': '#3B82F6',     // Blue
    'frontend': '#10B981',    // Green
    'stripe': '#635BFF',      // Stripe purple
    'auth': '#EF4444',        // Red
    'dashboard': '#06B6D4',   // Cyan
    'phase-6': '#EC4899'      // Pink
  }
  return colors[label.toLowerCase()] || '#6B7280'
}

main().catch(console.error)
