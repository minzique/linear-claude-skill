/**
 * Create Phase 5 issues for Enterprise Feature Gating
 */
import { LinearClient } from '@linear/sdk'

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

interface Issue {
  title: string
  description: string
  priority: number // 1=Urgent, 2=High, 3=Medium, 4=Low
  labels: string[]
  epic?: string
}

// Epic: npm Publishing Pipeline (P0)
const npmPublishingIssues: Issue[] = [
  {
    title: 'Configure npm org and access tokens',
    description: `## Context
Set up the @skillsmith npm organization and configure secure access tokens for publishing.

## Requirements
- Create @skillsmith npm organization (if not exists)
- Configure npm access tokens for CI/CD
- Set up 2FA enforcement for publish operations
- Document token rotation procedure

## Acceptance Criteria
- [ ] @skillsmith org created and configured
- [ ] CI/CD has secure npm token with publish scope
- [ ] 2FA required for all publish operations
- [ ] Token rotation documented in runbook
- [ ] Access audit completed

## References
- [ADR-013: Open Core Licensing](docs/adr/013-open-core-licensing.md)
- Phase 5: Release & Publishing`,
    priority: 1,
    labels: ['npm', 'ci', 'security'],
    epic: 'npm-publishing'
  },
  {
    title: 'Add prepublishOnly scripts to all packages',
    description: `## Context
Add validation scripts that run before npm publish to prevent incomplete or broken releases.

## Requirements
- Add prepublishOnly to each package.json
- Validate build, tests, and lint pass
- Check for required files (README, LICENSE)
- Verify version consistency

## Acceptance Criteria
- [ ] packages/core/package.json has prepublishOnly
- [ ] packages/mcp-server/package.json has prepublishOnly
- [ ] packages/cli/package.json has prepublishOnly
- [ ] packages/vscode-extension/package.json has prepublishOnly
- [ ] packages/enterprise/package.json has prepublishOnly
- [ ] All scripts run: build, test, lint, version check

## Implementation
\`\`\`json
"scripts": {
  "prepublishOnly": "npm run build && npm run test && npm run lint && npm run version:check"
}
\`\`\`

## References
- [npm prepublishOnly docs](https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-scripts)`,
    priority: 1,
    labels: ['npm', 'build'],
    epic: 'npm-publishing'
  },
  {
    title: 'Create GitHub Actions publish workflow',
    description: `## Context
Automate npm publishing via GitHub Actions with proper security controls.

## Requirements
- Workflow triggered on GitHub Release
- Semantic versioning from release tag
- Publish all public packages in order
- Slack/Discord notification on success/failure

## Acceptance Criteria
- [ ] .github/workflows/publish.yml created
- [ ] Triggered on release creation
- [ ] Publishes core → mcp-server → cli in order
- [ ] Uses OIDC for npm auth (no long-lived tokens)
- [ ] Notifications configured
- [ ] Rollback procedure documented

## Security
- Use npm provenance for supply chain security
- Require approval for production releases
- Audit log all publish events

## References
- [GitHub Actions npm publish](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements)`,
    priority: 1,
    labels: ['ci', 'npm', 'automation'],
    epic: 'npm-publishing'
  },
  {
    title: 'Fix enterprise package license (Apache-2.0 → Proprietary)',
    description: `## Context
The enterprise package currently shows Apache-2.0 license but should be proprietary per ADR-013.

## Requirements
- Change license field in package.json
- Add proprietary license file
- Add license headers to all enterprise source files
- Update README with license terms

## Acceptance Criteria
- [ ] packages/enterprise/package.json license changed
- [ ] LICENSE file added with proprietary terms
- [ ] All .ts files have license header
- [ ] README.md updated with licensing info
- [ ] TERMS.md referenced for full terms

## Implementation
\`\`\`json
// packages/enterprise/package.json
{
  "license": "SEE LICENSE IN LICENSE",
  "private": true  // Prevent accidental public publish
}
\`\`\`

## References
- [ADR-013: Open Core Licensing](docs/adr/013-open-core-licensing.md)
- [docs/legal/TERMS.md](docs/legal/TERMS.md)`,
    priority: 1,
    labels: ['legal', 'enterprise'],
    epic: 'npm-publishing'
  },
  {
    title: 'Configure private registry for enterprise package',
    description: `## Context
Enterprise package should NOT be published to public npm. Configure private registry or distribution method.

## Requirements
- Evaluate options: private npm, GitHub Packages, direct download
- Configure publishConfig in package.json
- Set up customer portal for enterprise downloads
- Implement version sync between public and enterprise

## Options
1. **GitHub Packages** - Integrated with GitHub, easy auth
2. **Verdaccio** - Self-hosted, full control
3. **npm Enterprise** - Official npm solution
4. **Direct download** - Customer portal with license validation

## Acceptance Criteria
- [ ] Distribution method selected and documented
- [ ] publishConfig configured in package.json
- [ ] Access control implemented
- [ ] Customer download flow documented
- [ ] Version sync with public packages tested

## References
- [ADR-014: Enterprise Package Architecture](docs/adr/014-enterprise-package-architecture.md)`,
    priority: 2,
    labels: ['npm', 'enterprise'],
    epic: 'npm-publishing'
  }
]

// Epic: License Key Infrastructure (P1)
const licenseInfrastructureIssues: Issue[] = [
  {
    title: 'Implement LicenseValidator class per ADR-014',
    description: `## Context
Implement JWT-based license validation as specified in ADR-014.

## Requirements
- Parse JWT license keys
- Validate signature with public key
- Check expiration and feature flags
- Support offline validation with cached keys
- Handle key rotation gracefully

## Interface (from ADR-014)
\`\`\`typescript
interface LicenseValidator {
  validate(key: string): Promise<LicenseValidationResult>;
  hasFeature(feature: FeatureFlag): boolean;
  getLicense(): License | null;
  isValid(): boolean;
}

interface LicenseValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
  expiresAt?: Date;
}

interface License {
  id: string;
  tier: 'team' | 'enterprise';
  seats: number;
  features: FeatureFlag[];
  expiresAt: Date;
  issuedAt: Date;
  customerId: string;
}
\`\`\`

## Acceptance Criteria
- [ ] LicenseValidator class implemented
- [ ] JWT parsing and signature verification
- [ ] Offline validation with cached public key
- [ ] Feature flag extraction
- [ ] Expiration checking
- [ ] 95%+ test coverage
- [ ] Performance: <5ms validation

## References
- [ADR-014: Enterprise Package Architecture](docs/adr/014-enterprise-package-architecture.md)`,
    priority: 2,
    labels: ['enterprise', 'security'],
    epic: 'license-infrastructure'
  },
  {
    title: 'Create license key generation service',
    description: `## Context
Backend service to generate and manage license keys for customers.

## Requirements
- Generate JWT license keys with proper claims
- Sign with private key (RS256)
- Store license records in database
- Support key revocation
- Integrate with subscription system

## API Endpoints
\`\`\`
POST /api/licenses - Generate new license
GET /api/licenses/:id - Get license details
DELETE /api/licenses/:id - Revoke license
POST /api/licenses/:id/refresh - Refresh expiring license
\`\`\`

## Acceptance Criteria
- [ ] License generation endpoint implemented
- [ ] RS256 signing with secure key storage
- [ ] License records persisted
- [ ] Revocation support
- [ ] Audit logging for all operations
- [ ] Rate limiting on generation

## Security
- Private key in HSM or secure vault
- Audit all license operations
- Rate limit generation to prevent abuse

## References
- Depends on: LicenseValidator implementation`,
    priority: 2,
    labels: ['enterprise', 'backend'],
    epic: 'license-infrastructure'
  },
  {
    title: 'Add license middleware to MCP server',
    description: `## Context
Gate enterprise MCP tools behind license validation.

## Requirements
- Middleware checks license before enterprise tools
- Cache validation result (configurable TTL)
- Return clear error for invalid/missing license
- Log license checks for audit

## Implementation
\`\`\`typescript
const enterpriseMiddleware = async (req, res, next) => {
  if (isEnterpriseFeature(req.tool)) {
    const license = await licenseValidator.validate(
      process.env.SKILLSMITH_LICENSE_KEY
    );
    if (!license.valid) {
      return res.error({
        code: 'LICENSE_REQUIRED',
        message: 'Enterprise license required for this feature'
      });
    }
    if (!license.hasFeature(req.tool)) {
      return res.error({
        code: 'FEATURE_NOT_LICENSED',
        message: \`Feature \${req.tool} not included in your license\`
      });
    }
  }
  next();
};
\`\`\`

## Acceptance Criteria
- [ ] Middleware added to MCP server
- [ ] Enterprise tools identified and gated
- [ ] Validation result cached (5 min TTL)
- [ ] Clear error messages for license issues
- [ ] Audit logging for access attempts
- [ ] Graceful degradation to community features

## References
- [ADR-014: Enterprise Package Architecture](docs/adr/014-enterprise-package-architecture.md)
- Depends on: LicenseValidator implementation`,
    priority: 2,
    labels: ['enterprise', 'mcp'],
    epic: 'license-infrastructure'
  },
  {
    title: 'Add license check to CLI startup',
    description: `## Context
CLI should validate license on startup and display appropriate messaging.

## Requirements
- Check for SKILLSMITH_LICENSE_KEY env var
- Validate license on CLI init
- Show license status in --version output
- Warn when license expires soon (30 days)

## Acceptance Criteria
- [ ] License validated on CLI startup
- [ ] License status shown in \`skillsmith --version\`
- [ ] Warning for expiring licenses
- [ ] Clear message for invalid licenses
- [ ] Enterprise commands hidden without license
- [ ] \`skillsmith license status\` command added

## User Experience
\`\`\`bash
$ skillsmith --version
skillsmith v1.0.0
License: Enterprise (expires 2026-12-31)
Features: audit-logging, sso, rbac, private-registry

$ skillsmith license status
License ID: lic_abc123
Tier: Enterprise
Seats: 50/100 used
Expires: 2026-12-31 (358 days remaining)
Features: audit-logging, sso, rbac, private-registry
\`\`\`

## References
- Depends on: LicenseValidator implementation`,
    priority: 2,
    labels: ['cli', 'enterprise'],
    epic: 'license-infrastructure'
  },
  {
    title: 'Add license detection to VS Code extension',
    description: `## Context
VS Code extension should detect and respect license status.

## Requirements
- Detect enterprise package installation
- Validate license via MCP server
- Show license status in status bar
- Enable/disable features based on license

## Acceptance Criteria
- [ ] Extension detects @skillsmith/enterprise
- [ ] License validated via MCP connection
- [ ] Status bar shows license tier
- [ ] Enterprise features hidden without license
- [ ] Settings page shows license details
- [ ] "Upgrade" prompt for community users

## References
- [ADR-014: Enterprise Package Architecture](docs/adr/014-enterprise-package-architecture.md)
- Depends on: MCP middleware implementation`,
    priority: 3,
    labels: ['vscode', 'enterprise'],
    epic: 'license-infrastructure'
  }
]

// Epic: Feature Gating (P1)
const featureGatingIssues: Issue[] = [
  {
    title: 'Define feature flag schema for JWT payload',
    description: `## Context
Define the feature flags embedded in license JWT for fine-grained access control.

## Requirements
- Define all enterprise features as flags
- Group features by tier (Team vs Enterprise)
- Support add-on features
- Version the schema for future changes

## Schema
\`\`\`typescript
type FeatureFlag =
  // Team Tier
  | 'team-workspaces'
  | 'usage-analytics'
  | 'priority-support'

  // Enterprise Tier
  | 'sso-saml'
  | 'sso-oidc'
  | 'rbac'
  | 'audit-logging'
  | 'audit-export-splunk'
  | 'audit-export-cloudwatch'
  | 'audit-export-datadog'
  | 'private-registry'
  | 'soc2-reports'

  // Add-ons
  | 'custom-integrations'
  | 'dedicated-support';

interface FeatureFlagSchema {
  version: '1.0';
  tier: 'team' | 'enterprise';
  features: FeatureFlag[];
  addons?: FeatureFlag[];
}
\`\`\`

## Acceptance Criteria
- [ ] FeatureFlag type defined
- [ ] Tier-to-features mapping documented
- [ ] Schema versioning implemented
- [ ] Zod validation schema created
- [ ] Migration path for schema changes documented

## References
- [ADR-013: Open Core Licensing](docs/adr/013-open-core-licensing.md)
- [docs/legal/TERMS.md](docs/legal/TERMS.md)`,
    priority: 2,
    labels: ['enterprise', 'security'],
    epic: 'feature-gating'
  },
  {
    title: 'Implement feature flag checking in enterprise tools',
    description: `## Context
Each enterprise tool/feature must check for the required feature flag before executing.

## Requirements
- Decorator/wrapper for feature-gated functions
- Map tools to required features
- Return consistent errors for missing features
- Log feature access for analytics

## Implementation
\`\`\`typescript
function requireFeature(feature: FeatureFlag) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      if (!licenseValidator.hasFeature(feature)) {
        throw new FeatureNotLicensedError(feature);
      }
      return original.apply(this, args);
    };
    return descriptor;
  };
}

// Usage
class AuditExporter {
  @requireFeature('audit-export-splunk')
  async exportToSplunk(events: AuditEvent[]) { ... }
}
\`\`\`

## Acceptance Criteria
- [ ] requireFeature decorator implemented
- [ ] All enterprise tools annotated
- [ ] Feature-to-tool mapping documented
- [ ] Consistent FeatureNotLicensedError
- [ ] Access logging for analytics
- [ ] 100% test coverage for gating logic

## References
- Depends on: Feature flag schema`,
    priority: 2,
    labels: ['enterprise', 'mcp'],
    epic: 'feature-gating'
  },
  {
    title: 'Add graceful degradation for missing license',
    description: `## Context
When enterprise features are accessed without a license, provide helpful messaging and alternatives.

## Requirements
- Don't crash - return helpful error
- Suggest upgrade path
- Show what features would be available
- Link to pricing/sales

## Acceptance Criteria
- [ ] All enterprise features fail gracefully
- [ ] Error messages include upgrade CTA
- [ ] CLI shows available alternatives
- [ ] VS Code shows upgrade prompt
- [ ] MCP returns structured error with upgrade info
- [ ] Analytics track upgrade prompts shown

## User Experience
\`\`\`
Error: Audit logging requires an Enterprise license.

Your current tier: Community (Free)

To enable audit logging:
  1. Upgrade to Enterprise: https://skillsmith.io/pricing
  2. Contact sales: sales@skillsmith.io

Available in Community tier:
  - Skill search and install
  - Basic recommendations
  - CLI tools
\`\`\`

## References
- [docs/legal/TERMS.md](docs/legal/TERMS.md) for tier features`,
    priority: 3,
    labels: ['enterprise', 'ux'],
    epic: 'feature-gating'
  },
  {
    title: 'Create license expired/invalid error handling',
    description: `## Context
Handle edge cases: expired licenses, revoked licenses, invalid keys.

## Requirements
- Detect expired licenses
- Handle revoked licenses
- Validate license format
- Grace period for renewals (7 days)
- Clear remediation steps

## Error Types
\`\`\`typescript
type LicenseError =
  | { code: 'LICENSE_EXPIRED'; expiresAt: Date; gracePeriodEnds: Date }
  | { code: 'LICENSE_REVOKED'; revokedAt: Date; reason: string }
  | { code: 'LICENSE_INVALID'; details: string }
  | { code: 'LICENSE_MISSING' }
  | { code: 'LICENSE_SEATS_EXCEEDED'; used: number; allowed: number };
\`\`\`

## Acceptance Criteria
- [ ] All error types implemented
- [ ] 7-day grace period for expired licenses
- [ ] Clear error messages with next steps
- [ ] Automatic retry for transient errors
- [ ] Webhook for license status changes
- [ ] Admin notification for expiring licenses

## References
- Depends on: LicenseValidator implementation`,
    priority: 3,
    labels: ['enterprise', 'ux'],
    epic: 'feature-gating'
  }
]

// Epic: Billing & Subscriptions (P1)
const billingIssues: Issue[] = [
  {
    title: 'Integrate Stripe for payment processing',
    description: `## Context
Implement Stripe as the primary payment processor for Team and Enterprise tiers.

## Requirements
- Stripe Customer creation
- Payment method collection (Stripe Elements)
- Subscription management
- Webhook handling for events
- PCI compliance via Stripe.js

## Acceptance Criteria
- [ ] Stripe SDK integrated
- [ ] Customer creation on signup
- [ ] Payment method collection UI
- [ ] Test mode for development
- [ ] Webhook endpoint secured
- [ ] PCI SAQ-A compliance maintained

## Security
- Use Stripe.js for card collection (PCI compliant)
- Webhook signature verification
- No card data touches our servers

## References
- [Stripe Subscriptions docs](https://stripe.com/docs/billing/subscriptions)`,
    priority: 2,
    labels: ['billing', 'backend'],
    epic: 'billing'
  },
  {
    title: 'Create subscription management API',
    description: `## Context
API for managing customer subscriptions, upgrades, and cancellations.

## Requirements
- Create subscription
- Upgrade/downgrade tier
- Add/remove seats
- Cancel subscription
- Pause subscription

## API Endpoints
\`\`\`
POST   /api/subscriptions              - Create subscription
GET    /api/subscriptions/:id          - Get subscription
PATCH  /api/subscriptions/:id          - Update (seats, tier)
DELETE /api/subscriptions/:id          - Cancel
POST   /api/subscriptions/:id/pause    - Pause billing
POST   /api/subscriptions/:id/resume   - Resume billing
\`\`\`

## Acceptance Criteria
- [ ] CRUD endpoints implemented
- [ ] Stripe sync on all operations
- [ ] Proration for upgrades/downgrades
- [ ] Cancellation with feedback collection
- [ ] Pause/resume for enterprise customers
- [ ] Audit logging for all changes

## References
- Depends on: Stripe integration`,
    priority: 2,
    labels: ['billing', 'backend'],
    epic: 'billing'
  },
  {
    title: 'Implement Team tier subscription flow',
    description: `## Context
End-to-end subscription flow for Team tier customers ($25/user/month).

## Requirements
- Self-service signup
- Seat selection (5-50 users)
- Payment collection
- Immediate license provisioning
- Welcome email with setup instructions

## Flow
1. Select Team tier on pricing page
2. Enter seat count
3. Create account (or login)
4. Enter payment details
5. Confirm subscription
6. Receive license key via email
7. Install and activate

## Acceptance Criteria
- [ ] Pricing page with Team tier
- [ ] Seat selection UI (min 5, max 50)
- [ ] Stripe Checkout integration
- [ ] Account creation during checkout
- [ ] License key auto-generation
- [ ] Welcome email with instructions
- [ ] Activation success confirmation

## References
- [docs/legal/TERMS.md](docs/legal/TERMS.md) - $25/user/month pricing`,
    priority: 2,
    labels: ['billing', 'ux'],
    epic: 'billing'
  },
  {
    title: 'Implement Enterprise tier subscription flow',
    description: `## Context
Enterprise tier requires sales contact and custom pricing ($69/user/month base).

## Requirements
- Sales inquiry form
- Custom quote generation
- Contract/NDA handling
- Manual license provisioning
- Dedicated onboarding

## Flow
1. "Contact Sales" on pricing page
2. Fill inquiry form (company, seats, requirements)
3. Sales team contacts within 24h
4. Custom quote based on needs
5. Contract negotiation
6. Invoice or Stripe subscription
7. License provisioning
8. Dedicated onboarding call

## Acceptance Criteria
- [ ] Contact Sales form implemented
- [ ] Lead captured in CRM (HubSpot/Salesforce)
- [ ] Quote generation tool for sales
- [ ] Contract templates ready
- [ ] Manual license provisioning workflow
- [ ] Onboarding checklist for CS team

## References
- [docs/legal/TERMS.md](docs/legal/TERMS.md) - $69/user/month pricing`,
    priority: 2,
    labels: ['billing', 'ux', 'enterprise'],
    epic: 'billing'
  },
  {
    title: 'Build license key generation from subscription',
    description: `## Context
Automatically generate and deliver license keys when subscriptions are created.

## Requirements
- Trigger on subscription.created webhook
- Generate JWT license with correct claims
- Deliver via email
- Store license record
- Support regeneration

## Flow
\`\`\`
Stripe subscription.created webhook
    → Extract customer/subscription data
    → Determine tier and features
    → Generate JWT license key
    → Store in database
    → Send email with key and instructions
    → Log for audit
\`\`\`

## Acceptance Criteria
- [ ] Webhook handler for subscription.created
- [ ] JWT generation with correct claims
- [ ] Email delivery with license key
- [ ] License stored in database
- [ ] Regeneration endpoint for lost keys
- [ ] License linked to subscription

## References
- Depends on: LicenseValidator, Stripe integration`,
    priority: 2,
    labels: ['billing', 'enterprise'],
    epic: 'billing'
  },
  {
    title: 'Add usage metering for seat-based billing',
    description: `## Context
Track seat usage for accurate billing and license enforcement.

## Requirements
- Track active users per license
- Enforce seat limits
- Usage dashboard for admins
- Alerts for approaching limits
- Stripe usage reporting

## Acceptance Criteria
- [ ] User count tracked per license
- [ ] Seat limit enforced
- [ ] Admin dashboard shows usage
- [ ] Alert at 80% and 100% capacity
- [ ] Usage synced to Stripe
- [ ] Historical usage reports

## References
- Depends on: Subscription management API`,
    priority: 3,
    labels: ['billing', 'backend'],
    epic: 'billing'
  },
  {
    title: 'Create customer billing portal',
    description: `## Context
Self-service portal for customers to manage billing.

## Requirements
- View current subscription
- Update payment method
- View invoices
- Download receipts
- Manage seats

## Acceptance Criteria
- [ ] Stripe Customer Portal integrated
- [ ] Or custom portal with:
  - [ ] Subscription details view
  - [ ] Payment method update
  - [ ] Invoice history
  - [ ] Receipt downloads
  - [ ] Seat management

## References
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)`,
    priority: 3,
    labels: ['billing', 'ux'],
    epic: 'billing'
  },
  {
    title: 'Implement invoice generation and history',
    description: `## Context
Generate and store invoices for all subscriptions.

## Requirements
- Auto-generate on payment
- PDF download
- Email delivery
- Historical archive
- Tax handling

## Acceptance Criteria
- [ ] Stripe invoices used (or custom generation)
- [ ] PDF download available
- [ ] Invoices emailed on payment
- [ ] Full history accessible
- [ ] Tax calculation (Stripe Tax or custom)
- [ ] Invoice numbering for accounting

## References
- [Stripe Invoicing](https://stripe.com/docs/invoicing)`,
    priority: 3,
    labels: ['billing', 'backend'],
    epic: 'billing'
  },
  {
    title: 'Add webhook handlers for subscription events',
    description: `## Context
Handle all Stripe subscription lifecycle events.

## Events to Handle
- \`customer.subscription.created\` - Provision license
- \`customer.subscription.updated\` - Update license claims
- \`customer.subscription.deleted\` - Revoke license
- \`invoice.payment_succeeded\` - Extend license
- \`invoice.payment_failed\` - Grace period / suspend
- \`customer.subscription.trial_will_end\` - Reminder email

## Acceptance Criteria
- [ ] All events handled
- [ ] Webhook signature verified
- [ ] License synced with subscription state
- [ ] Failed payments trigger grace period
- [ ] Trial ending triggers reminder
- [ ] All events logged for audit

## Security
- Verify Stripe webhook signatures
- Idempotency for retry handling
- Rate limiting on webhook endpoint

## References
- [Stripe Webhooks](https://stripe.com/docs/webhooks)`,
    priority: 2,
    labels: ['billing', 'backend'],
    epic: 'billing'
  },
  {
    title: 'Prepare AWS Marketplace listing (per SMI-816)',
    description: `## Context
List Skillsmith on AWS Marketplace for enterprise customers.

## Requirements
- Create AWS Marketplace seller account
- Configure SaaS listing
- Integrate AWS Marketplace API
- Handle entitlements via AWS
- Support PAYG and annual contracts

## Acceptance Criteria
- [ ] Seller account created
- [ ] Product listing configured
- [ ] Pricing tiers mapped
- [ ] Entitlement API integrated
- [ ] License provisioning from AWS
- [ ] Usage reporting to AWS
- [ ] Testing in sandbox

## References
- [AWS Marketplace SaaS](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-products.html)
- Related: SMI-816 (Q1 2026 target)`,
    priority: 3,
    labels: ['billing', 'marketplace'],
    epic: 'billing'
  }
]

async function main() {
  // Get Phase 5 project
  const projects = await client.projects({ filter: { name: { contains: 'Phase 5' } } })
  const project = projects.nodes[0]
  if (!project) {
    console.error('Phase 5 project not found')
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
  console.log(`Found ${labelMap.size} labels`)

  // Create project update first
  console.log('\n--- Creating Project Update ---')
  const updateBody = `## Phase 5: Release & Publishing - Status Update

### Critical Gap Identified: Enterprise Feature Gating

During Phase 2i/2j enterprise audit implementation, we identified that **no license gating exists** for enterprise features. The ADRs (013, 014) describe JWT-based licensing but implementation is missing.

### Current State
- ✅ ADR-013: Open Core Licensing defined
- ✅ ADR-014: Enterprise Package Architecture defined
- ❌ LicenseValidator not implemented
- ❌ Enterprise package shows Apache-2.0 (should be proprietary)
- ❌ No payment/billing infrastructure

### Blockers for npm Publishing
1. License gating must be in place before enterprise features are accessible
2. Enterprise package license must be fixed
3. Private registry configuration needed

### New Epics Created
1. **npm Publishing Pipeline** (5 issues) - P0
2. **License Key Infrastructure** (5 issues) - P1
3. **Feature Gating** (4 issues) - P1
4. **Billing & Subscriptions** (10 issues) - P1

### Dependencies
- Phase 7 Enterprise Implementation (SMI-1042 to SMI-1047) depends on:
  - License middleware being in place
  - Feature flag infrastructure

### Timeline Impact
- License infrastructure must complete before Phase 7 can proceed
- Estimated 2-3 weeks for license infrastructure
- Billing can proceed in parallel

### Next Steps
1. Fix enterprise package license immediately
2. Implement LicenseValidator class
3. Add middleware to MCP server
4. Begin Stripe integration in parallel`

  await client.createProjectUpdate({
    projectId: project.id,
    body: updateBody
  })
  console.log('Created project update')

  // Create all issues
  const allIssues = [
    ...npmPublishingIssues,
    ...licenseInfrastructureIssues,
    ...featureGatingIssues,
    ...billingIssues
  ]

  console.log(`\n--- Creating ${allIssues.length} Issues ---`)

  for (const issue of allIssues) {
    const labelIds = issue.labels
      .map(name => labelMap.get(name.toLowerCase()))
      .filter((id): id is string => id !== undefined)

    const result = await client.createIssue({
      teamId: team.id,
      projectId: project.id,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      labelIds
    })

    const created = await result.issue
    console.log(`Created: ${created?.identifier} - ${issue.title} [${issue.epic}]`)
  }

  console.log(`\n✅ Created ${allIssues.length} issues + 1 project update`)
}

main().catch(console.error)
