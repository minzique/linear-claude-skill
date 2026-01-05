/**
 * Update Phase 7 issues with Phase 5 dependencies
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

interface IssueUpdate {
  identifier: string
  addToDescription: string
}

const updates: IssueUpdate[] = [
  {
    identifier: 'SMI-1042',
    addToDescription: `

---

## Dependencies (Phase 5)

This issue depends on the following Phase 5 issues being completed first:

- **SMI-1053**: Implement LicenseValidator class per ADR-014
- **SMI-1055**: Add license middleware to MCP server
- **SMI-1059**: Implement feature flag checking in enterprise tools

The ImmutableStore must be gated behind enterprise license validation.`
  },
  {
    identifier: 'SMI-1044',
    addToDescription: `

---

## Dependencies (Phase 5)

This issue depends on the following Phase 5 issues being completed first:

- **SMI-1053**: Implement LicenseValidator class per ADR-014
- **SMI-1058**: Define feature flag schema for JWT payload
- **SMI-1059**: Implement feature flag checking in enterprise tools

SIEM exporters require \`audit-export-splunk\` and \`audit-export-datadog\` feature flags.`
  },
  {
    identifier: 'SMI-1046',
    addToDescription: `

---

## Dependencies (Phase 5)

This issue depends on the following Phase 5 issues being completed first:

- **SMI-1053**: Implement LicenseValidator class per ADR-014
- **SMI-1058**: Define feature flag schema for JWT payload
- **SMI-1059**: Implement feature flag checking in enterprise tools

SOC 2 reports require \`soc2-reports\` feature flag and audit trail of license validation.`
  }
]

async function main() {
  console.log('Updating Phase 7 issues with Phase 5 dependencies...\n')

  for (const update of updates) {
    // Extract issue number from identifier (e.g., SMI-1042 -> 1042)
    const issueNumber = parseInt(update.identifier.split('-')[1], 10)

    // Find the issue by number
    const issues = await client.issues({
      filter: { number: { eq: issueNumber } }
    })

    const issue = issues.nodes[0]
    if (!issue) {
      console.log(`Issue ${update.identifier} not found`)
      continue
    }

    // Append to description
    const currentDescription = issue.description || ''
    const newDescription = currentDescription + update.addToDescription

    await client.updateIssue(issue.id, {
      description: newDescription
    })

    console.log(`Updated: ${update.identifier} - ${issue.title}`)
  }

  console.log('\n✅ Phase 7 issues updated with Phase 5 dependencies')
}

main().catch(console.error)
