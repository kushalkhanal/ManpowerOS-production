/**
 * Workflow domain (client) — barrel export.
 *
 * This is the canonical entry point for client-side workflow logic.
 * UI components and pages should import from here rather than from
 * client/src/constants/workflow.js (kept only as a legacy compat layer).
 */

export * from './countries.js';
export * from './stages.js';
export * from './pipelines.js';
