import User from "../models/User.js";
import Candidate from "../models/Candidate.js";

export const ROLE_PERMISSIONS = {
  superadmin: {
    canEditCandidates: true,
    canDeleteCandidates: true,
    canViewFinance: true,
    canExportData: true,
    canManageStaff: true,
    canSendAlerts: true,
    canViewAuditLog: true,
    canManageAgencies: true,
    canImpersonate: true,
    canAccessAll: true,
  },
  admin: {
    canEditCandidates: true,
    canDeleteCandidates: true,
    canViewFinance: true,
    canExportData: true,
    canManageStaff: true,
    canSendAlerts: true,
    canViewAuditLog: true,
  },
  manager: {
    canEditCandidates: true,
    canDeleteCandidates: false,
    canViewFinance: true,
    canExportData: true,
    canManageStaff: false,
    canSendAlerts: true,
    canViewAuditLog: false,
  },
  staff: {
    canEditCandidates: true,
    canDeleteCandidates: false,
    canViewFinance: false,
    canExportData: false,
    canManageStaff: false,
    canSendAlerts: false,
    canViewAuditLog: false,
  },
  documentation: {
    canEditCandidates: true,
    canDeleteCandidates: false,
    canViewFinance: false,
    canExportData: true,
    canManageStaff: false,
    canSendAlerts: false,
    canViewAuditLog: false,
  },
  accounts: {
    canEditCandidates: false,
    canDeleteCandidates: false,
    canViewFinance: true,
    canExportData: true,
    canManageStaff: false,
    canSendAlerts: false,
    canViewAuditLog: false,
  },
  agent: {
    canEditCandidates: false,
    canDeleteCandidates: false,
    canViewFinance: false,
    canExportData: false,
    canManageStaff: false,
    canSendAlerts: false,
    canViewAuditLog: false,
  },
};

export const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.[permission] === true;
};

export const filterAgentCandidates = async (req, res, next) => {
  if (req.user.role === "superadmin") return next();

  if (req.user.role === "agent") {
    // Agents can only see candidates they introduced
    req.query.agentId = req.user.userId;

    // Prevent write operations for agents as requested ("agent can only view")
    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
      return res.status(403).json({ message: "Agents have read-only access" });
    }
  }
  next();
};

export const checkEditAccess = async (req, res, next) => {
  if (req.user.role === "superadmin" || req.user.role === "admin")
    return next();

  if (!hasPermission(req.user.role, "canEditCandidates")) {
    return res.status(403).json({ message: "Edit permission required" });
  }
  next();
};

export const checkDeleteAccess = async (req, res, next) => {
  if (req.user.role === "superadmin" || req.user.role === "admin")
    return next();

  if (!hasPermission(req.user.role, "canDeleteCandidates")) {
    return res.status(403).json({ message: "Delete permission required" });
  }
  next();
};

export const checkExportAccess = async (req, res, next) => {
  if (req.user.role === "superadmin" || req.user.role === "admin")
    return next();

  if (!hasPermission(req.user.role, "canExportData")) {
    return res.status(403).json({ message: "Export permission required" });
  }
  next();
};

export const checkStaffAccess = async (req, res, next) => {
  if (req.user.role === "superadmin" || req.user.role === "admin")
    return next();

  if (!hasPermission(req.user.role, "canManageStaff")) {
    return res
      .status(403)
      .json({ message: "Staff management permission required" });
  }
  next();
};

export const checkFinanceAccess = async (req, res, next) => {
  if (req.user.role === "superadmin" || req.user.role === "admin")
    return next();

  if (!hasPermission(req.user.role, "canViewFinance")) {
    return res
      .status(403)
      .json({ message: "Finance access required (Manager/Admin only)" });
  }
  next();
};

export const checkAlertAccess = async (req, res, next) => {
  if (req.user.role === "superadmin" || req.user.role === "admin")
    return next();

  if (!hasPermission(req.user.role, "canSendAlerts")) {
    return res
      .status(403)
      .json({ message: "Alert sending permission required" });
  }
  next();
};

export const checkAuditLogAccess = async (req, res, next) => {
  if (req.user.role === "superadmin" || req.user.role === "admin")
    return next();

  if (!hasPermission(req.user.role, "canViewAuditLog")) {
    return res.status(403).json({ message: "Audit log access required" });
  }
  next();
};

export const getDefaultPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.agent;
};

export default {
  ROLE_PERMISSIONS,
  hasPermission,
  filterAgentCandidates,
  checkEditAccess,
  checkDeleteAccess,
  checkExportAccess,
  checkStaffAccess,
  checkFinanceAccess,
  checkAlertAccess,
  checkAuditLogAccess,
  getDefaultPermissions,
};
