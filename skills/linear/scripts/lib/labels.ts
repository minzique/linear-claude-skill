/**
 * Label Management Utilities
 *
 * Ensures labels exist and are properly applied to issues.
 * Handles case-sensitivity issues and provides verification.
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

// Common label colors by category
const LABEL_COLORS: Record<string, string> = {
  // Publishing
  npm: '#CB3837',
  ci: '#2088FF',
  build: '#0E8A16',
  automation: '#5319E7',

  // Security & Compliance
  security: '#D73A4A',
  soc2: '#0052CC',
  legal: '#FEF2C0',

  // Tiers
  enterprise: '#7057FF',

  // Development
  backend: '#1D76DB',
  frontend: '#10B981',
  mcp: '#006B75',
  cli: '#E99695',
  vscode: '#007ACC',
  ux: '#D4C5F9',

  // Billing
  billing: '#F9D0C4',
  stripe: '#635BFF',
  marketplace: '#BFD4F2',

  // Website
  website: '#3B82F6',
  auth: '#EF4444',
  dashboard: '#06B6D4',

  // General
  feature: '#A2EEEF',
  integration: '#7057FF',
  performance: '#FBCA04',
  reporting: '#D93F0B',
  documentation: '#0075CA'
}

/**
 * Get all existing labels for a team (case-insensitive map)
 */
export async function getLabelMap(teamId?: string): Promise<Map<string, string>> {
  const labelsResult = await client.issueLabels(
    teamId ? { filter: { team: { id: { eq: teamId } } } } : undefined
  )

  const labelMap = new Map<string, string>()
  for (const label of labelsResult.nodes) {
    // Store both original case and lowercase for lookup
    labelMap.set(label.name.toLowerCase(), label.id)
  }

  return labelMap
}

/**
 * Ensure all required labels exist, creating missing ones
 */
export async function ensureLabelsExist(
  teamId: string,
  labelNames: string[]
): Promise<{ created: string[]; existing: string[]; failed: string[]; labelMap: Map<string, string> }> {
  const labelMap = await getLabelMap(teamId)
  const created: string[] = []
  const existing: string[] = []
  const failed: string[] = []

  for (const name of labelNames) {
    const key = name.toLowerCase()

    if (labelMap.has(key)) {
      existing.push(name)
      continue
    }

    try {
      const result = await client.createIssueLabel({
        teamId,
        name,
        color: LABEL_COLORS[key] || '#6B7280'
      })
      const label = await result.issueLabel
      if (label) {
        labelMap.set(key, label.id)
        created.push(name)
      } else {
        failed.push(name)
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Duplicate')) {
        // Race condition - label was created elsewhere
        existing.push(name)
        // Refresh label map to get the ID
        const refreshed = await getLabelMap(teamId)
        const id = refreshed.get(key)
        if (id) labelMap.set(key, id)
      } else {
        failed.push(`${name}: ${error}`)
      }
    }
  }

  return { created, existing, failed, labelMap }
}

/**
 * Apply labels to an issue (merges with existing)
 */
export async function applyLabelsToIssue(
  issueId: string,
  labelNames: string[],
  labelMap: Map<string, string>
): Promise<{ applied: string[]; skipped: string[]; error?: string }> {
  const applied: string[] = []
  const skipped: string[] = []

  try {
    // Get existing labels
    const issue = await client.issue(issueId)
    const existingLabels = await issue.labels()
    const existingIds = new Set(existingLabels.nodes.map(l => l.id))

    // Find new label IDs to add
    const newLabelIds: string[] = []
    for (const name of labelNames) {
      const id = labelMap.get(name.toLowerCase())
      if (!id) {
        skipped.push(`${name} (not found)`)
        continue
      }
      if (existingIds.has(id)) {
        skipped.push(`${name} (already applied)`)
        continue
      }
      newLabelIds.push(id)
      applied.push(name)
    }

    if (newLabelIds.length === 0) {
      return { applied, skipped }
    }

    // Merge and update
    const allLabelIds = [...existingIds, ...newLabelIds]
    await client.updateIssue(issueId, { labelIds: allLabelIds })

    return { applied, skipped }
  } catch (error) {
    return { applied, skipped, error: String(error) }
  }
}

/**
 * Verify labels are applied to an issue
 */
export async function verifyLabelsApplied(
  issueId: string,
  expectedLabels: string[]
): Promise<{ applied: string[]; missing: string[] }> {
  try {
    const issue = await client.issue(issueId)
    const labels = await issue.labels()
    const appliedLower = new Set(labels.nodes.map(l => l.name.toLowerCase()))

    const applied: string[] = []
    const missing: string[] = []

    for (const expected of expectedLabels) {
      if (appliedLower.has(expected.toLowerCase())) {
        applied.push(expected)
      } else {
        missing.push(expected)
      }
    }

    return { applied, missing }
  } catch {
    return { applied: [], missing: expectedLabels }
  }
}

/**
 * Get all unique labels from a set of issues
 */
export function extractUniqueLabels(
  issueLabels: Record<string, string[]>
): string[] {
  const unique = new Set<string>()
  for (const labels of Object.values(issueLabels)) {
    for (const label of labels) {
      unique.add(label.toLowerCase())
    }
  }
  return Array.from(unique)
}

// CLI entry point
if (require.main === module) {
  async function main() {
    const command = process.argv[2]
    const teamId = process.argv[3]

    if (command === 'list') {
      const labelMap = await getLabelMap(teamId)
      console.log('=== Labels ===')
      for (const [name, id] of labelMap) {
        console.log(`  ${name}: ${id}`)
      }
      console.log(`\nTotal: ${labelMap.size} labels`)
    } else if (command === 'ensure') {
      const labels = process.argv.slice(4)
      if (!teamId || labels.length === 0) {
        console.log('Usage: labels.ts ensure <teamId> <label1> <label2> ...')
        process.exit(1)
      }
      const result = await ensureLabelsExist(teamId, labels)
      console.log('=== Label Sync ===')
      console.log(`Created: ${result.created.join(', ') || 'none'}`)
      console.log(`Existing: ${result.existing.join(', ') || 'none'}`)
      console.log(`Failed: ${result.failed.join(', ') || 'none'}`)
    } else {
      console.log('Usage:')
      console.log('  labels.ts list [teamId]')
      console.log('  labels.ts ensure <teamId> <label1> <label2> ...')
    }
  }

  main().catch(console.error)
}
