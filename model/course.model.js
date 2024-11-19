const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    price: { type: Number, required: true },
    platformFees: { type: Number, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },

    language: { type: String, required: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    thumbnailImage: { type: String },
    promoVideo: { type: String },
    topic: { type: String, required: true },
    teachingMaterials: { type: [String], required: false },
    targetAudience: { type: [String], required: false },
    requirements: { type: [String], required: false },
    welcomeMessage: { type: String, required: true },
    congratulationsMessage: { type: String, required: true },
    isDisabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
