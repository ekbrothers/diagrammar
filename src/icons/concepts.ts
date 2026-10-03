import type { IconDefinition } from '../render/icons.js';

/**
 * Outline icons for infrastructure ideas rather than products.
 *
 * A Terraform workspace, a plan and a state file have no logo to borrow, because they are
 * concepts a tool introduces rather than things a vendor brands. These are drawn here on the same
 * 24-unit grid as the built-in set and follow the text color. They are named after the idea, not
 * the vendor, so they suit any tool with the same concept and imply no endorsement.
 */
export const concepts: Record<string, IconDefinition> = {
  // A labelled container: the place work happens.
  workspace: { body: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 5V3M17 5V3"/>' },
  // Nested frames: a grouping that holds workspaces.
  project: { body: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' },
  // A reusable block.
  module: { body: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><path d="M16.5 13v7M13 16.5h7"/>' },
  // A document holding recorded facts.
  'state-file': { body: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>' },
  // A proposed change: a list with additions and removals.
  plan: { body: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h3M8 12h3M8 16h3M15.5 7v3M14 8.5h3M14 15.5h3"/>' },
  // A change being carried out.
  apply: { body: '<path d="M5 12a7 7 0 1 1 2 4.9"/><path d="M5 12H2M5 12l3-3M5 12l3 3M10 12.5l1.5 1.5 3-3.5"/>' },
  // Messages waiting in line.
  queue: { body: '<rect x="2" y="8" width="5" height="8" rx="1"/><rect x="9.5" y="8" width="5" height="8" rx="1"/><rect x="17" y="8" width="5" height="8" rx="1"/>' },
  // Fast storage in front of something slower.
  cache: { body: '<path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3v10c0 1.7-3.6 3-8 3s-8-1.3-8-3z"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3M13 7.5 10.5 11h3L11 14.5"/>' },
  // A unit of work that runs and finishes.
  job: { body: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 6V4h8v2M9 12l2 2 4-4"/>' },
  // Work that happens on a timetable.
  schedule: { body: '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M9 3h6M12 3v3"/>' },
  // Something kept hidden.
  secret: { body: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>' },
};

export default concepts;
