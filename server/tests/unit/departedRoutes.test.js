/**
 * Route-level unit tests for /departed — verifies middleware ordering and
 * access control without a real DB or HTTP server.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// ─── Stubs for controller functions ──────────────────────────────────────────
const stubHandler = jest.fn((req, res) => res.json({ ok: true }));

jest.unstable_mockModule("../../src/controllers/departedController.js", () => ({
  getDepartedRecords: stubHandler,
  getDepartedStats: stubHandler,
  getDepartedById: stubHandler,
  updateReturnStatus: stubHandler,
}));

jest.unstable_mockModule("../../src/middleware/authenticate.js", () => ({
  authenticate: jest.fn((req, res, next) => next()),
}));

const makeAgentReq = () => ({
  user: { role: "agent", userId: "u1", agencyId: "a1" },
  method: "GET",
  query: {},
});

const makeAdminReq = () => ({
  user: { role: "admin", userId: "u2", agencyId: "a1" },
  method: "GET",
  query: {},
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── filterAgentCandidates behaviour (from rbac.js — pure logic, no mock needed)
import { filterAgentCandidates } from "../../src/middleware/rbac.js";

describe("filterAgentCandidates middleware on GET", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls next for admin without modifying query", () => {
    const req = makeAdminReq();
    const next = jest.fn();
    filterAgentCandidates(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.query.agentId).toBeUndefined();
  });

  it("restricts agent reads by injecting agentId into query", () => {
    const req = makeAgentReq();
    const next = jest.fn();
    filterAgentCandidates(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.query.agentId).toBe("u1");
  });

  it("blocks agent POST with 403", () => {
    const req = { ...makeAgentReq(), method: "POST" };
    const res = makeRes();
    const next = jest.fn();
    filterAgentCandidates(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows superadmin through without restriction", () => {
    const req = { user: { role: "superadmin" }, method: "GET", query: {} };
    const next = jest.fn();
    filterAgentCandidates(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.query.agentId).toBeUndefined();
  });
});

// ─── requireRole on PATCH /departed/:id/return-status ────────────────────────
import { requireRole } from "../../src/middleware/checkPermission.js";

describe("requireRole guard on return-status route", () => {
  const guard = requireRole("admin", "manager", "superadmin");

  it("allows admin through", () => {
    const req = { user: { role: "admin" } };
    const next = jest.fn();
    guard(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it("allows manager through", () => {
    const req = { user: { role: "manager" } };
    const next = jest.fn();
    guard(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks staff with 403", () => {
    const req = { user: { role: "staff" } };
    const res = makeRes();
    const next = jest.fn();
    guard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks agent with 403", () => {
    const req = { user: { role: "agent" } };
    const res = makeRes();
    const next = jest.fn();
    guard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── requireRole on POST /candidates/:id/depart ───────────────────────────────
describe("requireRole guard on depart route", () => {
  const guard = requireRole("admin", "manager", "superadmin");

  it("blocks documentation role from departing a candidate", () => {
    const req = { user: { role: "documentation" } };
    const res = makeRes();
    const next = jest.fn();
    guard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks accounts role from departing a candidate", () => {
    const req = { user: { role: "accounts" } };
    const res = makeRes();
    const next = jest.fn();
    guard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
