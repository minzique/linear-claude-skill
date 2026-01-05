/**
 * Linear Skill Shared Utilities
 *
 * This module provides standardized utilities for Linear operations.
 * All project creation scripts MUST use these utilities to ensure
 * consistency and avoid regressions.
 */

// Initiative utilities
export {
  INITIATIVES,
  linkProjectToInitiative,
  isProjectLinkedToInitiative,
  getProjectInitiativeStatus,
  linkAllSkillsmithProjects
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
  verifyAllSkillsmithProjects,
  printVerificationReport,
  type ProjectVerification
} from './verify'

// Project template
export {
  createProject,
  createSkillsmithProject,
  type ProjectConfig,
  type IssueConfig,
  type CreateResult
} from './project-template'
