const { required } = require("joi");
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    subtitle: { type: String },
    price: { type: Number, required: true },
    platformFees: { type: Number, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },

    language: { type: String },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
    duration: { type: String },
    description: { type: String, required: true },
    thumbnailImage: { type: String },
    promoVideo: { type: String },
    promoVideoURL: { type: String },
    topic: { type: String },
    teachingMaterials: { type: [String] },
    targetAudience: { type: [String] },
    requirements: { type: [String] },
    welcomeMessage: { type: String },
    congratulationsMessage: { type: String, required: true },
    isDisabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },
    sectionCount: { type: Number, default: 0 },
    lectureCount: { type: Number, default: 0 },
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
