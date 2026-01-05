/**
 * Initiative Linking Utilities
 *
 * MANDATORY: Every project MUST be linked to an initiative.
 * This module ensures projects are properly connected.
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

// Known initiative IDs
export const INITIATIVES = {
  SKILLSMITH: '5e1cebfe-f4bb-42c1-988d-af792fc4253b'
} as const

/**
 * Link a project to an initiative using initiativeToProjectCreate mutation.
 *
 * This is the ONLY correct way to link projects. Do NOT use:
 * - projectUpdate with initiativeIds (doesn't exist)
 * - projectCreate with initiativeId (deprecated)
 */
export async function linkProjectToInitiative(
  projectId: string,
  initiativeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const mutation = `
      mutation LinkProjectToInitiative($initiativeId: String!, $projectId: String!) {
        initiativeToProjectCreate(input: {
          initiativeId: $initiativeId,
          projectId: $projectId
        }) {
          success
          initiativeToProject {
            id
          }
        }
      }
    `

    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.LINEAR_API_KEY || ''
      },
      body: JSON.stringify({
        query: mutation,
        variables: { initiativeId, projectId }
      })
    })

    const result = await response.json()

    if (result.errors) {
      // Check if already linked
      if (result.errors[0]?.message?.includes('already exists')) {
        return { success: true } // Already linked is fine
      }
      return { success: false, error: result.errors[0]?.message }
    }

    return { success: result.data?.initiativeToProjectCreate?.success === true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Check if a project is linked to an initiative
 *
 * Note: Linear uses initiativeToProject edges, not a direct initiative field.
 * We query from the initiative side to find linked projects.
 */
export async function isProjectLinkedToInitiative(
  projectId: string,
  initiativeId: string
): Promise<boolean> {
  try {
    // Query initiative's projects to check if this project is linked
    const query = `
      query CheckInitiativeProjects($initiativeId: String!) {
        initiative(id: $initiativeId) {
          id
          projects {
            nodes {
              id
            }
          }
        }
      }
    `

    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.LINEAR_API_KEY || ''
      },
      body: JSON.stringify({
        query,
        variables: { initiativeId }
      })
    })

    const result = await response.json()
    const projectIds = result.data?.initiative?.projects?.nodes?.map(
      (p: { id: string }) => p.id
    ) || []

    return projectIds.includes(projectId)
  } catch {
    return false
  }
}

/**
 * Get all projects and their initiative links
 */
export async function getProjectInitiativeStatus(): Promise<
  Array<{ id: string; name: string; initiative: string | null }>
> {
  const projects = await client.projects()
  const results = []

  for (const proj of projects.nodes) {
    const initiative = await proj.initiative
    results.push({
      id: proj.id,
      name: proj.name,
      initiative: initiative?.name || null
    })
  }

  return results
}

/**
 * Link all Skillsmith projects to Skillsmith initiative
 */
export async function linkAllSkillsmithProjects(): Promise<{
  linked: string[]
  failed: string[]
  alreadyLinked: string[]
}> {
  const projects = await client.projects({
    filter: { name: { contains: 'Skillsmith' } }
  })

  const linked: string[] = []
  const failed: string[] = []
  const alreadyLinked: string[] = []

  for (const proj of projects.nodes) {
    // Check if already linked
    const isLinked = await isProjectLinkedToInitiative(proj.id, INITIATIVES.SKILLSMITH)
    if (isLinked) {
      alreadyLinked.push(proj.name)
      continue
    }

    // Link to initiative
    const result = await linkProjectToInitiative(proj.id, INITIATIVES.SKILLSMITH)
    if (result.success) {
      linked.push(proj.name)
    } else {
      failed.push(`${proj.name}: ${result.error}`)
    }
  }

  return { linked, failed, alreadyLinked }
}

// CLI entry point
if (require.main === module) {
  async function main() {
    console.log('=== Linking Skillsmith Projects to Initiative ===\n')

    const result = await linkAllSkillsmithProjects()

    if (result.alreadyLinked.length > 0) {
      console.log('Already linked:')
      result.alreadyLinked.forEach(p => console.log(`  ✓ ${p}`))
    }

    if (result.linked.length > 0) {
      console.log('\nNewly linked:')
      result.linked.forEach(p => console.log(`  ✅ ${p}`))
    }

    if (result.failed.length > 0) {
      console.log('\nFailed:')
      result.failed.forEach(p => console.log(`  ❌ ${p}`))
    }

    console.log(`\nSummary: ${result.linked.length} linked, ${result.alreadyLinked.length} already linked, ${result.failed.length} failed`)
  }

  main().catch(console.error)
}
