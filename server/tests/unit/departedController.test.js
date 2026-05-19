/**
 * Unit tests for departed controller logic.
 * Uses jest.unstable_mockModule() for ES module compatibility.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// ─── Mock factories ───────────────────────────────────────────────────────────
const mockCandidateFindOne = jest.fn();
const mockCandidateDeleteOne = jest.fn();
const mockPassportFindById = jest.fn();
const mockPassportFindOne = jest.fn();
const mockPassportFindByIdAndUpdate = jest.fn();
const mockJobDemandFindById = jest.fn();
const mockJobDemandFindByIdAndUpdate = jest.fn();
const mockDepartedRecordCreate = jest.fn();
const mockDepartedRecordFindOne = jest.fn();
const mockDepartedRecordFindOneAndUpdate = jest.fn();
const mockDepartedRecordFind = jest.fn();
const mockDepartedRecordCountDocuments = jest.fn();
const mockDepartedRecordAggregate = jest.fn();

jest.unstable_mockModule("../../src/models/Candidate.js", () => ({
  default: { findOne: mockCandidateFindOne, deleteOne: mockCandidateDeleteOne },
}));
jest.unstable_mockModule("../../src/models/Passport.js", () => ({
  default: {
    findById: mockPassportFindById,
    findOne: mockPassportFindOne,
    findByIdAndUpdate: mockPassportFindByIdAndUpdate,
  },
}));
jest.unstable_mockModule("../../src/models/JobDemand.js", () => ({
  default: {
    findById: mockJobDemandFindById,
    findByIdAndUpdate: mockJobDemandFindByIdAndUpdate,
  },
}));
jest.unstable_mockModule("../../src/models/Medical.js", () => ({
  default: { deleteMany: jest.fn().mockResolvedValue({}) },
}));
jest.unstable_mockModule("../../src/models/Orientation.js", () => ({
  default: { deleteMany: jest.fn().mockResolvedValue({}) },
}));
jest.unstable_mockModule("../../src/models/InsuranceSsf.js", () => ({
  default: { deleteMany: jest.fn().mockResolvedValue({}) },
}));
jest.unstable_mockModule("../../src/models/FeeTransaction.js", () => ({
  default: { deleteMany: jest.fn().mockResolvedValue({}) },
}));
jest.unstable_mockModule("../../src/models/Task.js", () => ({
  default: { deleteMany: jest.fn().mockResolvedValue({}) },
}));
jest.unstable_mockModule("../../src/models/DepartedRecord.js", () => ({
  default: {
    create: mockDepartedRecordCreate,
    findOne: mockDepartedRecordFindOne,
    findOneAndUpdate: mockDepartedRecordFindOneAndUpdate,
    find: mockDepartedRecordFind,
    countDocuments: mockDepartedRecordCountDocuments,
    aggregate: mockDepartedRecordAggregate,
  },
}));
jest.unstable_mockModule("../../src/utils/tenantHelper.js", () => ({
  scopeFilter: jest.fn((req, extra = {}) => ({
    agencyId: req.user.agencyId,
    ...extra,
  })),
}));

const {
  markCandidateDeparted,
  getDepartedById,
  updateReturnStatus,
} = await import("../../src/controllers/departedController.js");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeReq = (overrides = {}) => ({
  params: { id: "cand123" },
  query: {},
  body: {},
  user: { userId: "user1", agencyId: "agency1", role: "admin" },
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── markCandidateDeparted ────────────────────────────────────────────────────
describe("markCandidateDeparted", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 404 when candidate not found", async () => {
    mockCandidateFindOne.mockReturnValue({ lean: () => null });
    const res = makeRes();
    await markCandidateDeparted(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Candidate not found" });
  });

  it("creates a DepartedRecord and returns 200 on success", async () => {
    const candidate = {
      _id: "cand123",
      agencyId: "agency1",
      fullName: "Test User",
      passportId: null,
      passportNumber: null,
      demandId: null,
    };
    mockCandidateFindOne.mockReturnValue({ lean: () => candidate });
    mockDepartedRecordCreate.mockResolvedValue({ _id: "dep1" });
    mockCandidateDeleteOne.mockResolvedValue({});

    const res = makeRes();
    await markCandidateDeparted(makeReq(), res);

    expect(mockDepartedRecordCreate).toHaveBeenCalled();
    expect(mockCandidateDeleteOne).toHaveBeenCalledWith({ _id: "cand123" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: "dep1" }),
    );
  });

  it("releases passport allocation when candidate has a passport", async () => {
    const candidate = {
      _id: "cand123",
      agencyId: "agency1",
      fullName: "Test User",
      passportId: "pass1",
      passportNumber: null,
      demandId: null,
    };
    const passport = { _id: "pass1" };
    mockCandidateFindOne.mockReturnValue({ lean: () => candidate });
    mockPassportFindById.mockReturnValue({ lean: () => passport });
    mockPassportFindByIdAndUpdate.mockResolvedValue({});
    mockJobDemandFindById.mockReturnValue({ lean: () => null });
    mockDepartedRecordCreate.mockResolvedValue({ _id: "dep1" });
    mockCandidateDeleteOne.mockResolvedValue({});

    await markCandidateDeparted(makeReq(), makeRes());

    expect(mockPassportFindByIdAndUpdate).toHaveBeenCalledWith(
      "pass1",
      expect.objectContaining({
        $set: expect.objectContaining({ allocationStatus: "departed" }),
      }),
    );
  });

  it("decrements demand filledPositions when candidate has a demand", async () => {
    const candidate = {
      _id: "cand123",
      agencyId: "agency1",
      fullName: "Test User",
      passportId: null,
      passportNumber: null,
      demandId: "demand1",
    };
    mockCandidateFindOne.mockReturnValue({ lean: () => candidate });
    mockJobDemandFindById.mockReturnValue({ lean: () => null });
    mockJobDemandFindByIdAndUpdate.mockResolvedValue({});
    mockDepartedRecordCreate.mockResolvedValue({ _id: "dep1" });
    mockCandidateDeleteOne.mockResolvedValue({});

    await markCandidateDeparted(makeReq(), makeRes());

    expect(mockJobDemandFindByIdAndUpdate).toHaveBeenCalledWith("demand1", {
      $inc: { filledPositions: -1 },
    });
  });
});

// ─── updateReturnStatus ───────────────────────────────────────────────────────
describe("updateReturnStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 for invalid returnStatus value", async () => {
    const res = makeRes();
    await updateReturnStatus(
      makeReq({ body: { returnStatus: "missing_in_action" } }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid return status" });
  });

  it.each(["abroad", "returned", "extended", "absconded"])(
    "accepts valid returnStatus '%s'",
    async (status) => {
      const record = { _id: "dep1", returnStatus: status, originalPassportId: null };
      mockDepartedRecordFindOneAndUpdate.mockResolvedValue(record);
      const res = makeRes();
      await updateReturnStatus(makeReq({ body: { returnStatus: status } }), res);
      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(record);
    },
  );

  it("restores passport to in_pool when status is 'returned' and passport exists", async () => {
    const record = {
      _id: "dep1",
      returnStatus: "returned",
      originalPassportId: "pass1",
    };
    mockDepartedRecordFindOneAndUpdate.mockResolvedValue(record);
    mockPassportFindByIdAndUpdate.mockResolvedValue({});

    await updateReturnStatus(
      makeReq({ body: { returnStatus: "returned" } }),
      makeRes(),
    );

    expect(mockPassportFindByIdAndUpdate).toHaveBeenCalledWith("pass1", {
      $set: { allocationStatus: "in_pool" },
    });
  });

  it("does not touch passport when status is not 'returned'", async () => {
    const record = {
      _id: "dep1",
      returnStatus: "abroad",
      originalPassportId: "pass1",
    };
    mockDepartedRecordFindOneAndUpdate.mockResolvedValue(record);

    await updateReturnStatus(
      makeReq({ body: { returnStatus: "abroad" } }),
      makeRes(),
    );

    expect(mockPassportFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when record not found", async () => {
    mockDepartedRecordFindOneAndUpdate.mockResolvedValue(null);
    const res = makeRes();
    await updateReturnStatus(makeReq({ body: { returnStatus: "abroad" } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─── getDepartedById ──────────────────────────────────────────────────────────
describe("getDepartedById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 404 when record not found", async () => {
    mockDepartedRecordFindOne.mockReturnValue({ lean: () => null });
    const res = makeRes();
    await getDepartedById(makeReq({ params: { id: "nope" } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns the record when found", async () => {
    const record = { _id: "dep1", fullName: "Test" };
    mockDepartedRecordFindOne.mockReturnValue({ lean: () => record });
    const res = makeRes();
    await getDepartedById(makeReq({ params: { id: "dep1" } }), res);
    expect(res.json).toHaveBeenCalledWith(record);
  });
});
