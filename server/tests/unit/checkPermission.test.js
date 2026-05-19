import { describe, it, expect, jest } from "@jest/globals";
import {
  requireRole,
  requireAnyPermission,
} from "../../src/middleware/checkPermission.js";

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("requireRole", () => {
  it("calls next when user has an allowed role", () => {
    const middleware = requireRole("admin", "manager");
    const req = { user: { role: "admin" } };
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next for superadmin regardless of allowed list", () => {
    const middleware = requireRole("admin");
    const req = { user: { role: "superadmin" } };
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 403 when user role is not in allowed list", () => {
    const middleware = requireRole("admin", "manager");
    const req = { user: { role: "staff" } };
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when req.user is absent", () => {
    const middleware = requireRole("admin");
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireAnyPermission", () => {
  it("calls next when user has at least one matching permission", () => {
    const middleware = requireAnyPermission("canEditCandidates", "canExportData");
    const req = { user: { role: "staff", permissions: { canEditCandidates: true } } };
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("calls next for superadmin regardless of permissions", () => {
    const middleware = requireAnyPermission("canManageAgencies");
    const req = { user: { role: "superadmin", permissions: {} } };
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 403 when user has none of the required permissions", () => {
    const middleware = requireAnyPermission("canManageStaff", "canSendAlerts");
    const req = { user: { role: "agent", permissions: {} } };
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when req.user is absent", () => {
    const middleware = requireAnyPermission("canEditCandidates");
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
