const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    duration: { type: String },
    description: { type: String },
    videoUrl: { type: String },
    videoLink: { type: String },
    position: { type: Number },

    subtitle: { type: String },
    thumbnailImage: { type: String },
    welcomeMessage: { type: String },
    congratulationsMessage: { type: String },
    isDisabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lecture", lectureSchema);
