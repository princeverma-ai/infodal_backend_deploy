//imports ----------------------------------------------------->
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

//Schema ------------------------------------------------------>
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super-admin", "admin", "manager"],
      default: "admin",
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      select: false,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    accountVerificationToken: {
      type: String,
    },
    isAdminVerified: {
      type: Boolean,
      default: false,
    },
    adminVerificationToken: {
      type: String,
    },
    adminVerificationTokenExpires: {
      type: Date,
    },
    accountVerificationTokenExpires: {
      type: Date,
    },
    phone: {
      type: String,
      trim: true,
    },
  },

  {
    timestamps: true,
  }
);

//Password encryption ------------------------------------------>
adminSchema.pre("save", async function (next) {
  //Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  return next();
});

//Password changed at ------------------------------------------>
adminSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  return next();
});

//Hide inactive users ------------------------------------------>
adminSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//Password changed after ---------------------------------------->
adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  //False means NOT changed
  return false;
};

//Password verification ---------------------------------------->
adminSchema.methods.checkPassword = async function (
  candidatePassword,
  adminPassword
) {
  return await bcrypt.compare(candidatePassword, adminPassword);
};

//Password reset token ---------------------------------------->
adminSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //*Password reset expires is 10 min here
  this.passwordResetExpires = new Date(
    Date.now() + process.env.TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  return resetToken;
};

//Account verification token------------------------------------>
adminSchema.methods.createAccountVerificationToken = async function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.accountVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  //*Account verification expires here
  this.accountVerificationTokenExpires = new Date(
    Date.now() + process.env.TOKEN_EXPIRY_MINUTES * 60 * 1000
  );
  return verificationToken;
};

//Admin verification token-------------------------------------->
adminSchema.methods.createAdminVerificationToken = async function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.adminVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  //*Admin verification expires here
  this.adminVerificationTokenExpires = new Date(
    Date.now() + process.env.TOKEN_EXPIRY_MINUTES * 60 * 1000
  );
  return verificationToken;
};

//admin model -------------------------------------------------->
const Admin = mongoose.model("Admin", adminSchema);

//Export admin model ------------------------------------------->
module.exports = Admin;
