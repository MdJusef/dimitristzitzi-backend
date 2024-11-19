const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "please provide email"],
      unique: true,
    },
    image: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 5,
      select: false,
    },
    role: [
      {
        type: String,
        enum: ["user", "instructor", "admin"],
        default: "user",
      },
    ],
    instructorApplicationStatus: {
      type: String,
      enum: ["notApplied", "pending", "approved", "cancelled"],
      default: "notApplied",
    },
    phone: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    dateOfBirth: {
      type: Date,
    },
    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
    isInstructor: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyCode: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
