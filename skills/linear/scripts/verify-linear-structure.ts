/**
 * Verify and fix Linear project structure for Skillsmith initiative
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

async function main() {
  console.log('=== Checking Linear Structure ===\n')

  // Get team
  const teams = await client.teams()
  const team = teams.nodes[0]
  console.log(`Team: ${team.name} (${team.id})\n`)

  // Get initiatives
  console.log('--- Initiatives ---')
  const initiatives = await client.initiatives()
  for (const init of initiatives.nodes) {
    console.log(`  ${init.name} (${init.id})`)
  }

  // Get projects
  console.log('\n--- Projects ---')
  const projects = await client.projects()
  for (const proj of projects.nodes) {
    const initiative = await proj.initiative
    console.log(`  ${proj.name}`)
    console.log(`    ID: ${proj.id}`)
    console.log(`    State: ${proj.state}`)
    console.log(`    Initiative: ${initiative?.name || 'None'}`)
    console.log(`    Description: ${proj.description?.substring(0, 50) || 'None'}...`)
  }

  // Get Phase 5, 6, 7 issues
  console.log('\n--- Phase 5 Issues (SMI-1048 to SMI-1071) ---')
  const phase5Issues = await client.issues({
    filter: {
      number: { gte: 1048, lte: 1071 }
    }
  })
  for (const issue of phase5Issues.nodes) {
    const project = await issue.project
    const labels = await issue.labels()
    const labelNames = labels.nodes.map(l => l.name).join(', ')
    console.log(`  ${issue.identifier}: ${issue.title.substring(0, 40)}...`)
    console.log(`    Project: ${project?.name || 'None'}`)
    console.log(`    Labels: ${labelNames || 'None'}`)
  }

  // Get Phase 6 issues (newly created)
  console.log('\n--- Phase 6 Issues (SMI-1072+) ---')
  const phase6Issues = await client.issues({
    filter: {
      number: { gte: 1072 }
    },
    first: 25
  })
  for (const issue of phase6Issues.nodes) {
    const project = await issue.project
    const labels = await issue.labels()
    const labelNames = labels.nodes.map(l => l.name).join(', ')
    console.log(`  ${issue.identifier}: ${issue.title.substring(0, 40)}...`)
    console.log(`    Project: ${project?.name || 'None'}`)
    console.log(`    Labels: ${labelNames || 'None'}`)
  }

  // Get Phase 7 issues
  console.log('\n--- Phase 7 Issues (SMI-1042 to SMI-1047) ---')
  const phase7Issues = await client.issues({
    filter: {
      number: { gte: 1042, lte: 1047 }
    }
  })
  for (const issue of phase7Issues.nodes) {
    const project = await issue.project
    const labels = await issue.labels()
    const labelNames = labels.nodes.map(l => l.name).join(', ')
    console.log(`  ${issue.identifier}: ${issue.title.substring(0, 40)}...`)
    console.log(`    Project: ${project?.name || 'None'}`)
    console.log(`    Labels: ${labelNames || 'None'}`)
  }
}

main().catch(console.error)
