//imports ----------------------------------------------------->
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

//Schema ------------------------------------------------------>
const userSchema = new mongoose.Schema(
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
    accountVerificationTokenExpires: {
      type: Date,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [100, "Bio must be of maximum 40 characters long"],
    },
    phone: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
    address: {
      type: {
        addressLine1: {
          type: String,
          trim: true,
        },
        addressLine2: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        state: {
          type: String,
          trim: true,
        },
        country: {
          type: String,
          trim: true,
        },
        pincode: {
          type: String,
          trim: true,
        },
      },
    },

    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    coursesEnrolled: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Course",
      },
    ],
    cartItems: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Course",
      },
    ],
    source: {
      type: String,
    },
    inCashId: {
      type: mongoose.Schema.ObjectId,
      ref: "InCash",
    },
    affiliateCodeId: {
      type: mongoose.Schema.ObjectId,
      ref: "AffiliateCode",
    },
  },
  {
    timestamps: true,
  }
);

//Password encryption ------------------------------------------>
userSchema.pre("save", async function (next) {
  //Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  return next();
});

//Password changed at ------------------------------------------>
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  return next();
});

//Hide inactive users ------------------------------------------>
userSchema.pre(/^find/, function (next) {
  if (this.bypassInactiveCheck) {
    this.bypassInactiveCheck = false;
    return next();
  }
  //this points to the current query
  this.find({ active: { $ne: false } });

  if (this.populateFields) {
    this.populate({
      path: "coursesEnrolled",
      select: "name",
    });

    this.populate({
      path: "cartItems",
      select: "name",
    });

    this.populate({
      path: "inCashId",
      select: "inCashAmount",
    });

    this.populate({
      path: "affiliateCodeId",
      select: "affiliateCode",
    });
  }

  next();
});

//Password changed after ---------------------------------------->
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
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
userSchema.methods.checkPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Password reset token ---------------------------------------->
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //*Password reset token expires
  this.passwordResetExpires = new Date(
    Date.now() + process.env.TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  return resetToken;
};

//Account verification token------------------------------------>
userSchema.methods.createAccountVerificationToken = async function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.accountVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  //*Account verification token expires
  this.accountVerificationTokenExpires = new Date(
    Date.now() + process.env.TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  return verificationToken;
};

//User model -------------------------------------------------->
const User = mongoose.model("User", userSchema);

//Export User model ------------------------------------------->
module.exports = User;
