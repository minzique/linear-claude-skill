/**
 * Post-Execution Verification Utilities
 *
 * Verifies that project creation completed successfully:
 * - Project linked to initiative
 * - Project has content/description
 * - All expected issues created
 * - All labels applied
 */
import { LinearClient } from '@linear/sdk'
import { isProjectLinkedToInitiative, INITIATIVES } from './initiative'
import { verifyLabelsApplied } from './labels'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

export interface ProjectVerification {
  project: {
    id: string
    name: string
    exists: boolean
    linkedToInitiative: boolean
    hasDescription: boolean
    descriptionLength: number
    state: string
  }
  issues: {
    expected: number
    found: number
    missing: string[]
    withLabels: number
    withoutLabels: string[]
  }
  overall: {
    passed: boolean
    issues: string[]
  }
}

/**
 * Verify a project was created correctly
 */
export async function verifyProjectCreation(
  projectName: string,
  expectedIssueCount: number,
  expectedLabels?: Record<string, string[]>,
  initiativeId: string = INITIATIVES.SKILLSMITH
): Promise<ProjectVerification> {
  const verification: ProjectVerification = {
    project: {
      id: '',
      name: projectName,
      exists: false,
      linkedToInitiative: false,
      hasDescription: false,
      descriptionLength: 0,
      state: ''
    },
    issues: {
      expected: expectedIssueCount,
      found: 0,
      missing: [],
      withLabels: 0,
      withoutLabels: []
    },
    overall: {
      passed: true,
      issues: []
    }
  }

  // Find project
  const projects = await client.projects({
    filter: { name: { contains: projectName } }
  })

  const project = projects.nodes.find(p =>
    p.name.toLowerCase().includes(projectName.toLowerCase())
  )

  if (!project) {
    verification.overall.passed = false
    verification.overall.issues.push(`Project not found: ${projectName}`)
    return verification
  }

  verification.project.id = project.id
  verification.project.name = project.name
  verification.project.exists = true
  verification.project.state = project.state
  verification.project.descriptionLength = project.description?.length || 0
  verification.project.hasDescription = (project.description?.length || 0) > 10

  // Check initiative link
  verification.project.linkedToInitiative = await isProjectLinkedToInitiative(
    project.id,
    initiativeId
  )

  if (!verification.project.linkedToInitiative) {
    verification.overall.passed = false
    verification.overall.issues.push('Project not linked to initiative')
  }

  if (!verification.project.hasDescription) {
    verification.overall.passed = false
    verification.overall.issues.push('Project has no description')
  }

  // Get project issues
  const issues = await client.issues({
    filter: { project: { id: { eq: project.id } } },
    first: 100
  })

  verification.issues.found = issues.nodes.length

  if (verification.issues.found < expectedIssueCount) {
    verification.overall.passed = false
    verification.overall.issues.push(
      `Expected ${expectedIssueCount} issues, found ${verification.issues.found}`
    )
  }

  // Check labels if provided
  if (expectedLabels) {
    for (const issue of issues.nodes) {
      const expectedForIssue = expectedLabels[issue.identifier]
      if (expectedForIssue) {
        const labelCheck = await verifyLabelsApplied(issue.id, expectedForIssue)
        if (labelCheck.missing.length === 0) {
          verification.issues.withLabels++
        } else {
          verification.issues.withoutLabels.push(
            `${issue.identifier}: missing ${labelCheck.missing.join(', ')}`
          )
        }
      }
    }

    if (verification.issues.withoutLabels.length > 0) {
      verification.overall.passed = false
      verification.overall.issues.push(
        `${verification.issues.withoutLabels.length} issues missing labels`
      )
    }
  }

  return verification
}

/**
 * Verify all Skillsmith projects
 */
export async function verifyAllSkillsmithProjects(): Promise<{
  projects: ProjectVerification[]
  summary: {
    total: number
    passed: number
    failed: number
    issues: string[]
  }
}> {
  const projects = await client.projects({
    filter: { name: { contains: 'Skillsmith' } }
  })

  const verifications: ProjectVerification[] = []
  const summary = {
    total: projects.nodes.length,
    passed: 0,
    failed: 0,
    issues: [] as string[]
  }

  for (const proj of projects.nodes) {
    // Get issue count for project
    const issues = await client.issues({
      filter: { project: { id: { eq: proj.id } } }
    })

    const verification = await verifyProjectCreation(
      proj.name,
      issues.nodes.length,
      undefined,
      INITIATIVES.SKILLSMITH
    )

    verifications.push(verification)

    if (verification.overall.passed) {
      summary.passed++
    } else {
      summary.failed++
      summary.issues.push(
        `${proj.name}: ${verification.overall.issues.join('; ')}`
      )
    }
  }

  return { projects: verifications, summary }
}

/**
 * Print verification report
 */
export function printVerificationReport(verification: ProjectVerification): void {
  console.log(`\n=== Project Verification: ${verification.project.name} ===`)
  console.log(`\nProject:`)
  console.log(`  ID: ${verification.project.id || 'N/A'}`)
  console.log(`  Exists: ${verification.project.exists ? '✓' : '✗'}`)
  console.log(`  State: ${verification.project.state || 'N/A'}`)
  console.log(`  Linked to Initiative: ${verification.project.linkedToInitiative ? '✓' : '✗'}`)
  console.log(`  Has Description: ${verification.project.hasDescription ? '✓' : '✗'} (${verification.project.descriptionLength} chars)`)

  console.log(`\nIssues:`)
  console.log(`  Expected: ${verification.issues.expected}`)
  console.log(`  Found: ${verification.issues.found}`)
  console.log(`  With Labels: ${verification.issues.withLabels}`)

  if (verification.issues.withoutLabels.length > 0) {
    console.log(`  Missing Labels:`)
    verification.issues.withoutLabels.forEach(i => console.log(`    - ${i}`))
  }

  console.log(`\nOverall: ${verification.overall.passed ? '✅ PASSED' : '❌ FAILED'}`)
  if (verification.overall.issues.length > 0) {
    console.log(`Issues:`)
    verification.overall.issues.forEach(i => console.log(`  - ${i}`))
  }
}

// CLI entry point
if (require.main === module) {
  async function main() {
    const command = process.argv[2]

    if (command === 'all') {
      console.log('=== Verifying All Skillsmith Projects ===\n')
      const result = await verifyAllSkillsmithProjects()

      for (const verification of result.projects) {
        printVerificationReport(verification)
      }

      console.log('\n=== Summary ===')
      console.log(`Total: ${result.summary.total}`)
      console.log(`Passed: ${result.summary.passed}`)
      console.log(`Failed: ${result.summary.failed}`)

      if (result.summary.issues.length > 0) {
        console.log('\nIssues:')
        result.summary.issues.forEach(i => console.log(`  - ${i}`))
      }
    } else if (command === 'project') {
      const projectName = process.argv[3]
      const expectedCount = parseInt(process.argv[4] || '0', 10)

      if (!projectName) {
        console.log('Usage: verify.ts project <projectName> [expectedIssueCount]')
        process.exit(1)
      }

      const verification = await verifyProjectCreation(projectName, expectedCount)
      printVerificationReport(verification)
    } else {
      console.log('Usage:')
      console.log('  verify.ts all                          - Verify all Skillsmith projects')
      console.log('  verify.ts project <name> [issueCount]  - Verify specific project')
    }
  }

  main().catch(console.error)
}
