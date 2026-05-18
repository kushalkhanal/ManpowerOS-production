// Single source of truth for all role strings used across the application.
// These must stay in sync with the `role` enum in server/src/models/User.js.
export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  MANAGER: "manager",
  ACCOUNTS: "accounts",
  DOCUMENTATION: "documentation",
  AGENT: "agent",
  STAFF: "staff",
};

// Higher number = more privileged. Used for hierarchy checks.
export const ROLE_HIERARCHY = {
  superadmin: 7,
  admin: 6,
  manager: 5,
  documentation: 4,
  accounts: 3,
  staff: 2,
  agent: 1,
};

// Canonical list used for Zod enums and UI dropdowns.
export const ALL_ROLES = Object.values(ROLES);

// Roles that agency admins are allowed to assign to their own staff.
// superadmin is excluded — only the system can assign that role.
export const ASSIGNABLE_ROLES = ALL_ROLES.filter((r) => r !== ROLES.SUPERADMIN);
