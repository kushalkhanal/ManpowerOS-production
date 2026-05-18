import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Agency from "../models/Agency.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getDefaultPermissions } from "../middleware/rbac.js";

const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Find user by email across all agencies
  const user = await User.findOne({ email: email.toLowerCase() }).populate(
    "agencyId",
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const minsLeft = Math.ceil(
      (new Date(user.lockedUntil) - new Date()) / 60000,
    );
    return res
      .status(403)
      .json({ message: `Account locked. Try again in ${minsLeft} minutes` });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Account is disabled" });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Lock after 5 attempts
    if (user.failedLoginAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      user.lockedUntil = lockUntil;
      user.failedLoginAttempts = 0;
      await user.save();
      return res
        .status(403)
        .json({
          message:
            "Account locked due to 5 failed attempts. Try again in 15 minutes",
        });
    }

    await user.save();
    return res.status(401).json({ message: "Invalid credentials" });
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  const previousLoginCount = user.loginCount || 0;
  user.loginCount = previousLoginCount + 1;
  user.lastLoginAt = new Date();

  // Clear stale mustChangePassword flag for users who have logged in before —
  // only truly new/invited users (never logged in) should be forced to change.
  if (user.mustChangePassword && previousLoginCount > 0) {
    user.mustChangePassword = false;
  }

  await user.save();

  const token = generateToken(
    {
      userId: user._id,
      agencyId: user.agencyId?._id || user.agencyId,
      role: user.role,
      name: user.name,
    },
    rememberMe ? "30d" : "7d",
  );

  res.status(200).json({
    token,
    mustChangePassword: !!user.mustChangePassword,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    agency: user.agencyId
      ? {
          _id: user.agencyId._id,
          name: user.agencyId.name,
          subdomain: user.agencyId.subdomain,
        }
      : null,
  });
});

const registerAgency = asyncHandler(async (req, res) => {
  const { agencyName, subdomain, adminName, adminEmail, adminPassword } =
    req.body;

  const existingAgency = await Agency.findOne({
    subdomain: subdomain.toLowerCase(),
  });
  if (existingAgency) {
    return res.status(400).json({ message: "Subdomain already taken" });
  }

  const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User with this email already exists" });
  }

  const agency = await Agency.create({
    name: agencyName,
    subdomain: subdomain.toLowerCase(),
    plan: "trial",
    isActive: true,
  });

  const admin = await User.create({
    agencyId: agency._id,
    name: adminName,
    email: adminEmail.toLowerCase(),
    passwordHash: adminPassword,
    role: "admin",
    isActive: true,
    mustChangePassword: false,
  });

  const token = generateToken({
    userId: admin._id,
    agencyId: agency._id,
    role: admin.role,
    name: admin.name,
  });

  res.status(201).json({
    message: "Agency created successfully",
    token,
    user: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    agency: {
      _id: agency._id,
      name: agency.name,
      subdomain: agency.subdomain,
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select(
    "-passwordHash -mfaSecret -mfaEnabled",
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const agency = await Agency.findById(req.user.agencyId);

  res.status(200).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isImpersonating: !!req.user.isImpersonating,
    },
    agency: agency
      ? {
          _id: agency._id,
          name: agency.name,
          subdomain: agency.subdomain,
          plan: agency.plan,
        }
      : null,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "New password must be at least 8 characters" });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Skip current-password check for forced first-login change
  if (!user.mustChangePassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
  }

  user.passwordHash = newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.status(200).json({ message: "Password changed successfully" });
});

const verifyInviteToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token || token.length !== 64) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    inviteToken: tokenHash,
    inviteTokenExpires: { $gt: new Date() },
  }).select("name email role agencyId");

  if (!user) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Invite link has expired or is invalid",
      });
  }
  res
    .status(200)
    .json({
      success: true,
      name: user.name,
      email: user.email,
      role: user.role,
    });
});

const completeInvite = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    inviteToken: tokenHash,
    inviteTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Invite link has expired or is invalid",
      });
  }

  user.passwordHash = newPassword;
  user.mustChangePassword = false;
  user.inviteToken = undefined;
  user.inviteTokenExpires = undefined;
  user.isActive = true;
  await user.save();

  const agency = await Agency.findById(user.agencyId);
  const authToken = generateToken({
    userId: user._id,
    agencyId: user.agencyId,
    role: user.role,
    name: user.name,
  });

  res.status(200).json({
    success: true,
    message: "Password set successfully",
    token: authToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    agency: agency
      ? {
          _id: agency._id,
          name: agency.name,
          subdomain: agency.subdomain,
          plan: agency.plan,
        }
      : null,
  });
});

export default {
  login,
  registerAgency,
  getMe,
  changePassword,
  verifyInviteToken,
  completeInvite,
};
