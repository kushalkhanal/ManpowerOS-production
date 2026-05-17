/**
 * Reset password for existing user
 * Usage: node reset-password.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

async function resetPassword() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const User = mongoose.model(
      "User",
      new mongoose.Schema(
        {
          email: String,
          passwordHash: String,
          name: String,
          role: String,
        },
        { strict: false },
      ),
    );

    // Find the first super admin
    const superAdmin = await User.findOne({ role: "superadmin" });

    if (!superAdmin) {
      console.log("❌ No super admin found!");
      process.exit(1);
    }

    const newPassword = "Admin@123456";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    superAdmin.passwordHash = hashedPassword;
    await superAdmin.save();

    console.log("✅ Password reset successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 LOGIN CREDENTIALS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email:    ${superAdmin.email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log(`👤 Name:     ${superAdmin.name}`);
    console.log(`🎯 Role:     ${superAdmin.role}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🌐 Login at: http://localhost:5173\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

resetPassword();
