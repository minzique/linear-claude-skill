/**
 * Create Phase 6: Website & Subscription Portal issues in Linear
 *
 * Phase 6 includes:
 * - Epic 1: Marketing Website (6 issues)
 * - Epic 2: Subscription Portal (7 issues)
 * - Epic 3: Authentication & User Management (4 issues)
 *
 * Total: 19 new issues
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

interface Phase6Issue {
  title: string
  description: string
  priority: number // 1=Urgent, 2=High, 3=Medium, 4=Low
  labels: string[]
  epic: string
}

const phase6Issues: Phase6Issue[] = [
  // Epic 1: Marketing Website (6 issues)
  {
    title: 'Create landing page with value proposition',
    description: `## Context
Build the main landing page for skillsmith.io that explains the product value proposition.

## Requirements
- Hero section with clear headline and CTA
- Feature highlights for each tier (Community, Team, Enterprise)
- Social proof section (testimonials, logos)
- Clear path to pricing page
- Mobile-responsive design

## Tech Stack
- Next.js 14 with App Router
- Tailwind CSS
- Vercel deployment

## Acceptance Criteria
- [ ] Hero section with "Skill Discovery for Claude Code"
- [ ] Three-column feature comparison
- [ ] CTA buttons: "Get Started Free" and "View Pricing"
- [ ] Mobile responsive (tested on iOS/Android)
- [ ] Lighthouse score > 90

## References
- [Go-to-Market Analysis](docs/strategy/go-to-market-analysis.md)`,
    priority: 2,
    labels: ['website', 'frontend', 'phase-6'],
    epic: 'Marketing Website'
  },
  {
    title: 'Build pricing page with tier comparison',
    description: `## Context
Create the pricing page showing Community ($0), Team ($25), and Enterprise ($55) tiers.

## Requirements
- Clear tier comparison table
- Feature bifurcation display (no usage limits messaging)
- "Free Forever" badge on Community tier
- CTA buttons for each tier
- FAQ section for common pricing questions

## Pricing Details
| Tier | Price | Billing |
|------|-------|---------|
| Community | $0/forever | N/A |
| Team | $25/user/month | Monthly or Annual ($250/year) |
| Enterprise | $55/user/month | Monthly or Annual ($550/year) |

## Acceptance Criteria
- [ ] Three-tier comparison table
- [ ] Toggle for monthly/annual pricing
- [ ] "No usage limits" messaging prominent
- [ ] CTAs: "Get Started", "Start Trial", "Contact Sales"
- [ ] FAQ accordion with 5+ questions

## References
- [TERMS.md](docs/legal/TERMS.md)
- [ADR-013](docs/adr/013-open-core-licensing.md)`,
    priority: 2,
    labels: ['website', 'frontend', 'phase-6'],
    epic: 'Marketing Website'
  },
  {
    title: 'Create documentation site structure',
    description: `## Context
Build the documentation site structure for getting started guides, API reference, and tutorials.

## Requirements
- Navigation sidebar with collapsible sections
- Search functionality
- Code syntax highlighting
- Copy-to-clipboard for code blocks
- Version selector (future)

## Documentation Sections
1. Getting Started
2. Installation
3. CLI Reference
4. MCP Server Tools
5. VS Code Extension
6. Team Features (Team tier)
7. Enterprise Features (Enterprise tier)

## Tech Stack Options
- Nextra (Next.js based)
- Docusaurus
- Mintlify

## Acceptance Criteria
- [ ] Sidebar navigation with sections
- [ ] Search functionality working
- [ ] Code blocks with syntax highlighting
- [ ] Mobile-responsive layout
- [ ] Dark mode support`,
    priority: 2,
    labels: ['website', 'documentation', 'phase-6'],
    epic: 'Marketing Website'
  },
  {
    title: 'Add feature comparison table',
    description: `## Context
Create a detailed feature comparison table showing exactly what's in each tier.

## Feature Matrix
| Feature | Community | Team | Enterprise |
|---------|-----------|------|------------|
| Skill search | Unlimited | Unlimited | Unlimited |
| Skill install | Unlimited | Unlimited | Unlimited |
| CLI tools | Full | Full | Full |
| MCP server | Full | Full | Full |
| VS Code extension | Core | Full | Full |
| Team workspaces | - | ✓ | ✓ |
| Private skills | - | ✓ | ✓ |
| Usage analytics | - | ✓ | ✓ |
| SSO/SAML | - | - | ✓ |
| RBAC | - | - | ✓ |
| Audit logging | - | - | ✓ |
| SIEM export | - | - | ✓ |

## Acceptance Criteria
- [ ] Interactive comparison table
- [ ] Filter by category (Core, Team, Enterprise)
- [ ] Hover tooltips explaining each feature
- [ ] Mobile-friendly accordion view
- [ ] "Unlimited" badges on Community features`,
    priority: 3,
    labels: ['website', 'frontend', 'phase-6'],
    epic: 'Marketing Website'
  },
  {
    title: 'Create "Getting Started" guide for free tier',
    description: `## Context
Write and build the Getting Started guide for free tier users.

## Content Outline
1. Prerequisites (Node.js, Claude Code)
2. Installation: \`npm install @skillsmith/mcp-server\`
3. Configuration in Claude Code settings
4. First skill search
5. Installing a skill
6. Using recommendations

## Code Examples
\`\`\`bash
# Install the MCP server
npm install -g @skillsmith/mcp-server

# Add to Claude Code settings
# ~/.claude/settings.json
{
  "mcpServers": {
    "skillsmith": {
      "command": "npx",
      "args": ["-y", "@skillsmith/mcp-server"]
    }
  }
}
\`\`\`

## Acceptance Criteria
- [ ] Step-by-step installation guide
- [ ] Code blocks with copy buttons
- [ ] Screenshots of Claude Code integration
- [ ] Troubleshooting section
- [ ] Link to full documentation`,
    priority: 2,
    labels: ['website', 'documentation', 'phase-6'],
    epic: 'Marketing Website'
  },
  {
    title: 'Build FAQ page addressing common questions',
    description: `## Context
Create FAQ page addressing common questions about pricing, features, and usage.

## FAQ Categories

### Pricing FAQs
- Do I need to pay to use Skillsmith?
- What's the difference between tiers?
- Can I upgrade/downgrade anytime?
- Do you offer discounts for startups?

### Feature FAQs
- Are there any usage limits?
- What's included in the free tier?
- Do I need Team tier for personal projects?
- What enterprise features require SSO?

### Technical FAQs
- How do I install Skillsmith?
- Does it work with VS Code?
- Can I use it offline?
- How are skills validated for security?

## Acceptance Criteria
- [ ] Accordion-style FAQ sections
- [ ] Search within FAQs
- [ ] Categories: Pricing, Features, Technical, Support
- [ ] "Still have questions?" CTA to contact
- [ ] SEO-optimized FAQ schema markup`,
    priority: 3,
    labels: ['website', 'documentation', 'phase-6'],
    epic: 'Marketing Website'
  },

  // Epic 2: Subscription Portal (7 issues)
  {
    title: 'Implement Stripe Checkout for Team tier',
    description: `## Context
Implement Stripe Checkout for Team tier subscriptions ($25/user/month).

## Requirements
- Stripe Checkout session creation
- Monthly and annual billing options
- Seat quantity selection
- Success/cancel redirect handling
- Webhook handling for checkout.session.completed

## Stripe Configuration
- Product: Skillsmith Team
- Price: $25/user/month (price_team_monthly)
- Price: $250/user/year (price_team_annual)
- Trial: 14 days (optional)

## API Endpoints
\`\`\`
POST /api/checkout/team
  body: { seats: number, interval: 'month' | 'year' }
  returns: { sessionUrl: string }
\`\`\`

## Acceptance Criteria
- [ ] Stripe Checkout session creation
- [ ] Seat quantity selection (1-100)
- [ ] Monthly/annual toggle
- [ ] Success page with next steps
- [ ] Error handling for failed payments`,
    priority: 2,
    labels: ['billing', 'stripe', 'backend', 'phase-6'],
    epic: 'Subscription Portal'
  },
  {
    title: 'Implement Stripe Checkout for Enterprise tier',
    description: `## Context
Implement Stripe Checkout for Enterprise tier subscriptions ($55/user/month).

## Requirements
- Stripe Checkout session creation
- Monthly and annual billing options
- Seat quantity selection
- Success/cancel redirect handling
- Contact sales option for 100+ seats

## Stripe Configuration
- Product: Skillsmith Enterprise
- Price: $55/user/month (price_enterprise_monthly)
- Price: $550/user/year (price_enterprise_annual)
- Custom pricing for 100+ seats

## API Endpoints
\`\`\`
POST /api/checkout/enterprise
  body: { seats: number, interval: 'month' | 'year' }
  returns: { sessionUrl: string }

POST /api/contact-sales
  body: { company, email, seats, message }
  returns: { success: boolean }
\`\`\`

## Acceptance Criteria
- [ ] Stripe Checkout for < 100 seats
- [ ] Contact Sales form for 100+ seats
- [ ] Monthly/annual toggle
- [ ] Custom quote request flow
- [ ] Enterprise agreement checkbox`,
    priority: 2,
    labels: ['billing', 'stripe', 'backend', 'phase-6'],
    epic: 'Subscription Portal'
  },
  {
    title: 'Create account dashboard with subscription status',
    description: `## Context
Build user dashboard showing subscription status, usage, and account settings.

## Dashboard Sections
1. **Subscription Status**
   - Current tier (Community/Team/Enterprise)
   - Billing cycle and next payment date
   - Seat count and usage

2. **License Key**
   - Display license key
   - Copy to clipboard
   - Regenerate option

3. **Team Management** (Team/Enterprise)
   - Invite team members
   - View seat usage
   - Remove members

4. **Billing History**
   - Past invoices
   - Download receipts

## Acceptance Criteria
- [ ] Subscription status display
- [ ] License key section
- [ ] Upgrade/downgrade buttons
- [ ] Billing history table
- [ ] Team member list (if applicable)`,
    priority: 2,
    labels: ['frontend', 'dashboard', 'phase-6'],
    epic: 'Subscription Portal'
  },
  {
    title: 'Build license key delivery after payment',
    description: `## Context
Automatically generate and deliver license keys after successful Stripe payment.

## Flow
1. Stripe webhook: checkout.session.completed
2. Create license key (JWT per ADR-014)
3. Store in database
4. Send email with license key
5. Display in dashboard

## License Key Format (JWT)
\`\`\`json
{
  "iss": "https://license.skillsmith.io",
  "sub": "org_abc123",
  "aud": "skillsmith-enterprise",
  "exp": 1735689599,
  "license": {
    "type": "team",
    "tier": "team",
    "seats": 10,
    "features": ["team_workspaces", "private_skills", "usage_analytics"]
  }
}
\`\`\`

## Acceptance Criteria
- [ ] Webhook handler for checkout.session.completed
- [ ] JWT license key generation
- [ ] Database storage of license
- [ ] Email delivery with key
- [ ] Dashboard display of key`,
    priority: 2,
    labels: ['billing', 'backend', 'phase-6'],
    epic: 'Subscription Portal'
  },
  {
    title: 'Implement subscription upgrade/downgrade flow',
    description: `## Context
Allow users to upgrade from Team to Enterprise or downgrade from Enterprise to Team.

## Upgrade Flow (Team → Enterprise)
1. User clicks "Upgrade to Enterprise"
2. Show prorated cost calculation
3. Stripe subscription update
4. New license key generation
5. Immediate feature access

## Downgrade Flow (Enterprise → Team)
1. User clicks "Downgrade to Team"
2. Warning about feature loss
3. Confirmation required
4. Change effective at end of billing period
5. New license key at downgrade

## API Endpoints
\`\`\`
POST /api/subscription/upgrade
  body: { targetTier: 'enterprise' }

POST /api/subscription/downgrade
  body: { targetTier: 'team' }
\`\`\`

## Acceptance Criteria
- [ ] Upgrade with proration
- [ ] Downgrade with confirmation
- [ ] Feature loss warning on downgrade
- [ ] New license key generation
- [ ] Email notification of change`,
    priority: 3,
    labels: ['billing', 'backend', 'phase-6'],
    epic: 'Subscription Portal'
  },
  {
    title: 'Create billing history and invoice download',
    description: `## Context
Show billing history and allow invoice downloads using Stripe Billing Portal.

## Requirements
- List past invoices with dates and amounts
- Download invoice PDF
- Link to Stripe Billing Portal for full history
- Show payment method on file

## Stripe Billing Portal
Use Stripe's hosted Billing Portal for:
- Invoice history
- Payment method updates
- Subscription cancellation

## API Endpoints
\`\`\`
GET /api/billing/invoices
  returns: { invoices: Invoice[] }

GET /api/billing/portal
  returns: { portalUrl: string }
\`\`\`

## Acceptance Criteria
- [ ] Invoice list with dates and amounts
- [ ] Download invoice PDF
- [ ] Link to Stripe Billing Portal
- [ ] Payment method display
- [ ] Update payment method flow`,
    priority: 3,
    labels: ['billing', 'frontend', 'phase-6'],
    epic: 'Subscription Portal'
  },
  {
    title: 'Add seat management for team admins',
    description: `## Context
Allow team admins to add/remove seats and manage team members.

## Features
1. **Add Seats**
   - Increase seat count
   - Prorated billing for new seats
   - Immediate access for new members

2. **Remove Seats**
   - Decrease seat count
   - Effective at next billing cycle
   - Cannot go below active member count

3. **Member Management**
   - Invite by email
   - Set role (Admin/Member)
   - Remove member

## API Endpoints
\`\`\`
POST /api/team/seats
  body: { action: 'add' | 'remove', count: number }

POST /api/team/invite
  body: { email: string, role: 'admin' | 'member' }

DELETE /api/team/members/:id
\`\`\`

## Acceptance Criteria
- [ ] Add seats with proration
- [ ] Remove seats (end of cycle)
- [ ] Invite member by email
- [ ] Role assignment (Admin/Member)
- [ ] Remove member with confirmation`,
    priority: 3,
    labels: ['billing', 'backend', 'phase-6'],
    epic: 'Subscription Portal'
  },

  // Epic 3: Authentication & User Management (4 issues)
  {
    title: 'Implement user registration and login',
    description: `## Context
Build user registration and login system for the website/portal.

## Requirements
- Email/password registration
- Email/password login
- OAuth options (GitHub, Google) - optional
- Session management with JWT
- Remember me functionality

## Tech Stack Options
- Supabase Auth
- Auth0
- NextAuth.js

## API Endpoints
\`\`\`
POST /api/auth/register
  body: { email, password, name }

POST /api/auth/login
  body: { email, password }

POST /api/auth/logout

GET /api/auth/me
\`\`\`

## Acceptance Criteria
- [ ] Registration with email verification
- [ ] Login with email/password
- [ ] Session persistence (7 days)
- [ ] Logout functionality
- [ ] Rate limiting on auth endpoints`,
    priority: 2,
    labels: ['auth', 'backend', 'phase-6'],
    epic: 'Authentication'
  },
  {
    title: 'Add email verification flow',
    description: `## Context
Implement email verification after registration.

## Flow
1. User registers with email
2. Verification email sent
3. User clicks verification link
4. Account marked as verified
5. Redirect to dashboard

## Email Template
Subject: Verify your Skillsmith account

Body:
- Welcome message
- Verification link (expires in 24h)
- What to do if you didn't request this

## Acceptance Criteria
- [ ] Verification email sent on registration
- [ ] Verification link with token
- [ ] 24-hour expiration
- [ ] Resend verification option
- [ ] Account status indicator`,
    priority: 2,
    labels: ['auth', 'backend', 'phase-6'],
    epic: 'Authentication'
  },
  {
    title: 'Create password reset functionality',
    description: `## Context
Implement forgot password and password reset flow.

## Flow
1. User clicks "Forgot Password"
2. Enter email address
3. Reset email sent (if account exists)
4. User clicks reset link
5. Enter new password
6. Redirect to login

## Security Requirements
- Rate limit reset requests (3 per hour)
- Token expires in 1 hour
- One-time use token
- Don't reveal if email exists

## Acceptance Criteria
- [ ] Forgot password form
- [ ] Reset email with secure token
- [ ] Password reset form
- [ ] Token expiration (1 hour)
- [ ] Success confirmation`,
    priority: 2,
    labels: ['auth', 'backend', 'phase-6'],
    epic: 'Authentication'
  },
  {
    title: 'Build organization/team management',
    description: `## Context
Allow users to create and manage organizations for Team/Enterprise tiers.

## Features
1. **Create Organization**
   - Organization name
   - Billing email
   - Primary admin

2. **Organization Settings**
   - Update name
   - Update billing email
   - Transfer ownership

3. **Member Roles**
   - Owner (1 per org)
   - Admin (manage members)
   - Member (use features)

## Database Schema
\`\`\`sql
organizations (
  id, name, billing_email, owner_id,
  stripe_customer_id, created_at
)

organization_members (
  id, org_id, user_id, role, joined_at
)
\`\`\`

## Acceptance Criteria
- [ ] Create organization flow
- [ ] Organization settings page
- [ ] Role-based permissions
- [ ] Ownership transfer
- [ ] Leave organization option`,
    priority: 3,
    labels: ['auth', 'backend', 'phase-6'],
    epic: 'Authentication'
  }
]

async function main() {
  console.log('Creating Phase 6: Website & Subscription Portal issues...\n')

  // Find Phase 6 project or create it
  const projects = await client.projects({ filter: { name: { contains: 'Phase 6' } } })
  let project = projects.nodes[0]

  if (!project) {
    // Create Phase 6 project
    const teams = await client.teams()
    const team = teams.nodes[0]
    if (!team) {
      console.error('No team found')
      process.exit(1)
    }

    const projectResult = await client.createProject({
      teamIds: [team.id],
      name: 'Phase 6: Website & Subscription Portal',
      description: 'Marketing website + Stripe-powered subscription portal for Team ($25/user) and Enterprise ($55/user) tiers.',
      state: 'planned'
    })
    const createdProject = await projectResult.project
    if (createdProject) {
      project = createdProject
      console.log(`Created project: ${project.name}`)
    }
  } else {
    console.log(`Found project: ${project.name}`)
  }

  // Get team
  const teams = await client.teams()
  const team = teams.nodes[0]
  if (!team) {
    console.error('No team found')
    process.exit(1)
  }
  console.log(`Using team: ${team.name}\n`)

  // Get or create labels
  const labelsResult = await client.issueLabels()
  const labelMap = new Map(labelsResult.nodes.map(l => [l.name.toLowerCase(), l.id]))

  // Create missing labels (handle existing labels gracefully)
  const requiredLabels = ['website', 'frontend', 'backend', 'billing', 'stripe', 'auth', 'documentation', 'dashboard', 'phase-6']
  for (const labelName of requiredLabels) {
    if (!labelMap.has(labelName)) {
      try {
        const result = await client.createIssueLabel({
          teamId: team.id,
          name: labelName,
          color: getColorForLabel(labelName)
        })
        const label = await result.issueLabel
        if (label) {
          labelMap.set(labelName, label.id)
          console.log(`Created label: ${labelName}`)
        }
      } catch (error: unknown) {
        // Label might already exist with different casing - try to find it
        if (error instanceof Error && error.message.includes('Duplicate label name')) {
          const existingLabels = await client.issueLabels({ filter: { team: { id: { eq: team.id } } } })
          const existing = existingLabels.nodes.find(l => l.name.toLowerCase() === labelName.toLowerCase())
          if (existing) {
            labelMap.set(labelName, existing.id)
            console.log(`Using existing label: ${existing.name}`)
          }
        } else {
          throw error
        }
      }
    }
  }

  // Group issues by epic
  const epics = new Map<string, Phase6Issue[]>()
  for (const issue of phase6Issues) {
    if (!epics.has(issue.epic)) {
      epics.set(issue.epic, [])
    }
    epics.get(issue.epic)!.push(issue)
  }

  // Create issues grouped by epic
  let issueCount = 0
  for (const [epicName, issues] of epics) {
    console.log(`\n--- Epic: ${epicName} (${issues.length} issues) ---`)

    for (const issue of issues) {
      const labelIds = issue.labels
        .map(name => labelMap.get(name.toLowerCase()))
        .filter((id): id is string => id !== undefined)

      const result = await client.createIssue({
        teamId: team.id,
        projectId: project?.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        labelIds
      })

      const created = await result.issue
      if (created) {
        console.log(`  Created: ${created.identifier} - ${issue.title}`)
        issueCount++
      }
    }
  }

  console.log(`\n✅ Created ${issueCount} Phase 6 issues`)
}

function getColorForLabel(label: string): string {
  const colors: Record<string, string> = {
    'website': '#3B82F6',      // Blue
    'frontend': '#10B981',     // Green
    'backend': '#8B5CF6',      // Purple
    'billing': '#F59E0B',      // Amber
    'stripe': '#635BFF',       // Stripe purple
    'auth': '#EF4444',         // Red
    'documentation': '#6B7280', // Gray
    'dashboard': '#06B6D4',    // Cyan
    'phase-6': '#EC4899'       // Pink
  }
  return colors[label] || '#6B7280'
}

main().catch(console.error)
