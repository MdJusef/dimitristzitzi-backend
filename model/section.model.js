const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    lectureCount: { type: Number, default: 0 },
    totalDuration: { type: String },

    subtitle: { type: String },
    description: { type: String },
    thumbnailImage: { type: String },
    welcomeMessage: { type: String },
    congratulationsMessage: { type: String },
    isDisabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Section", sectionSchema);
