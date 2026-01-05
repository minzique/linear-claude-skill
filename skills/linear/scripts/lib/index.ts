/**
 * Linear Skill Shared Utilities
 *
 * This module provides standardized utilities for Linear operations.
 * All project creation scripts MUST use these utilities to ensure
 * consistency and avoid regressions.
 *
 * Configuration:
 *   LINEAR_API_KEY              - Required for all operations
 *   LINEAR_DEFAULT_INITIATIVE_ID - Optional default initiative for linking
 */

// Initiative utilities
export {
  DEFAULT_INITIATIVE_ID,
  INITIATIVES,  // Deprecated, use DEFAULT_INITIATIVE_ID
  linkProjectToInitiative,
  isProjectLinkedToInitiative,
  getProjectInitiativeStatus,
  linkProjectsToInitiative
} from './initiative'

// Label utilities
export {
  getLabelMap,
  ensureLabelsExist,
  applyLabelsToIssue,
  verifyLabelsApplied,
  extractUniqueLabels
} from './labels'

// Verification utilities
export {
  verifyProjectCreation,
  verifyProjectsForInitiative,
  printVerificationReport,
  type ProjectVerification
} from './verify'

// Project template
export {
  createProject,
  createProjectWithDefaults,
  type ProjectConfig,
  type IssueConfig,
  type CreateResult
} from './project-template'
