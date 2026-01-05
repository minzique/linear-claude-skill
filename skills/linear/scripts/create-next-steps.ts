/**
 * Create Linear issues for Phase 2i/2j next steps
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

interface NextStep {
  title: string
  description: string
  priority: number // 1=Urgent, 2=High, 3=Medium, 4=Low
  labels: string[]
  parentIssue?: string
}

const nextSteps: NextStep[] = [
  {
    title: 'Implement ImmutableStore with SHA-256 hash chains',
    description: `## Context
Implement the immutable audit log storage system as designed in ADR-015.

## Requirements
- SHA-256 hash chain with genesis block
- Database triggers preventing updates/deletes
- Single entry and full chain verification methods
- Merkle root computation for export integrity
- Integration with RetentionPolicy for legal holds

## Acceptance Criteria
- [ ] ImmutableStore class with append(), verify(), verifyChain() methods
- [ ] Database schema with immutability triggers
- [ ] computeEntryHash() using canonical JSON + SHA-256
- [ ] computeMerkleRoot() for export reports
- [ ] 90%+ test coverage
- [ ] Performance: <5ms append, <1ms verify single

## References
- [ADR-015: Immutable Audit Log Storage](docs/adr/015-immutable-audit-log-storage.md)
- [Phase 2j Retrospective](docs/retros/phase-2j-enterprise-audit.md)`,
    priority: 2,
    labels: ['enterprise', 'security', 'soc2']
  },
  {
    title: 'Add GitHub import CLI command',
    description: `## Context
Expose the import-github-skills.ts script via the CLI for easy GitHub skills importing.

## Requirements
- New CLI command: \`skillsmith import-github\`
- Support --checkpoint for resume capability
- Support --dry-run for preview mode
- Progress bar with ETA
- Summary report on completion

## Acceptance Criteria
- [ ] \`skillsmith import-github --help\` shows usage
- [ ] \`skillsmith import-github --org anthropics\` imports org skills
- [ ] \`skillsmith import-github --topic claude-code-skill\` imports by topic
- [ ] \`skillsmith import-github --checkpoint ./checkpoint.json\` resumes
- [ ] Integration tests for CLI command

## References
- [import-github-skills.ts](packages/core/src/scripts/import-github-skills.ts)
- [Phase 2i Retrospective](docs/retros/phase-2i-large-scale-testing.md)`,
    priority: 2,
    labels: ['cli', 'feature']
  },
  {
    title: 'Complete Splunk and Datadog SIEM exporters',
    description: `## Context
The CloudWatch exporter is complete, but Splunk HEC and Datadog exporters need full implementation.

## Requirements
- Splunk HEC exporter with batch submission
- Datadog Logs API exporter with tag-based categorization
- Retry logic with exponential backoff
- Health check endpoints

## Acceptance Criteria
- [ ] SplunkExporter.export() sends to HEC endpoint
- [ ] DatadogExporter.export() sends to Logs API
- [ ] Both handle rate limiting gracefully
- [ ] Both have health check methods
- [ ] 90%+ test coverage for each

## References
- [CloudWatchExporter](packages/enterprise/src/audit/exporters/CloudWatchExporter.ts) - reference implementation
- [Phase 2j Retrospective](docs/retros/phase-2j-enterprise-audit.md)`,
    priority: 3,
    labels: ['enterprise', 'integration']
  },
  {
    title: 'Add performance benchmarks to CI pipeline',
    description: `## Context
Performance benchmarks exist but aren't run in CI. Add regression detection.

## Requirements
- Run performance benchmarks in CI
- Compare against baseline thresholds
- Fail build if regression detected
- Store results for trend analysis

## Acceptance Criteria
- [ ] CI job runs LargeScalePerformance.test.ts
- [ ] Thresholds defined in config file
- [ ] Build fails if p95 exceeds threshold by >20%
- [ ] Results uploaded as artifact
- [ ] Weekly trend report

## References
- [LargeScalePerformance.test.ts](packages/core/tests/performance/LargeScalePerformance.test.ts)
- [Phase 2i Retrospective](docs/retros/phase-2i-large-scale-testing.md)`,
    priority: 3,
    labels: ['ci', 'performance']
  },
  {
    title: 'Generate SOC 2 compliance report',
    description: `## Context
SOC2Formatter maps events to Trust criteria but doesn't generate a final report.

## Requirements
- Generate PDF and JSON compliance reports
- Include event counts per Trust criteria
- Include Merkle root for integrity verification
- Date range filtering

## Acceptance Criteria
- [ ] \`generateReport(startDate, endDate)\` method
- [ ] PDF output with charts and tables
- [ ] JSON output for programmatic access
- [ ] Merkle root included in report footer
- [ ] Unit tests for report generation

## References
- [SOC2Formatter](packages/enterprise/src/audit/formatters/SOC2Formatter.ts)
- [Phase 2j Retrospective](docs/retros/phase-2j-enterprise-audit.md)`,
    priority: 3,
    labels: ['enterprise', 'soc2', 'reporting']
  },
  {
    title: 'Document SIEM credentials in .env.example',
    description: `## Context
SIEM exporters require API keys but they're not documented in .env.example.

## Requirements
- Add SPLUNK_HEC_TOKEN placeholder
- Add DATADOG_API_KEY placeholder
- Add AWS credential placeholders
- Document sensitivity level

## Acceptance Criteria
- [ ] .env.example includes all SIEM credentials
- [ ] .env.schema marks them as @sensitive
- [ ] README references .env.example
- [ ] Varlock validation works

## References
- [Phase 2j Retrospective](docs/retros/phase-2j-enterprise-audit.md)`,
    priority: 4,
    labels: ['documentation', 'security']
  }
]

async function main() {
  // Get Phase 7: Enterprise Implementation project
  const projects = await client.projects({ filter: { name: { contains: 'Phase 7' } } })
  const project = projects.nodes[0]
  if (!project) {
    console.error('Phase 7 project not found')
    process.exit(1)
  }
  console.log(`Found project: ${project.name} (${project.id})`)

  // Get team
  const teams = await client.teams()
  const team = teams.nodes[0]
  if (!team) {
    console.error('No team found')
    process.exit(1)
  }
  console.log(`Using team: ${team.name} (${team.id})`)

  // Get labels
  const labelsResult = await client.issueLabels()
  const labelMap = new Map(labelsResult.nodes.map(l => [l.name.toLowerCase(), l.id]))

  // Create issues
  for (const step of nextSteps) {
    const labelIds = step.labels
      .map(name => labelMap.get(name.toLowerCase()))
      .filter((id): id is string => id !== undefined)

    const issue = await client.createIssue({
      teamId: team.id,
      projectId: project.id,
      title: step.title,
      description: step.description,
      priority: step.priority,
      labelIds
    })

    const created = await issue.issue
    console.log(`Created: ${created?.identifier} - ${step.title}`)
  }

  console.log('\nAll next steps created!')
}

main().catch(console.error)
