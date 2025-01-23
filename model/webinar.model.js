const mongoose = require("mongoose");

const webinarSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    description: { type: String, required: true },
    thumbnailImage: { type: String },
    hostName: { type: String, required: true },
    hostTitle: { type: String, required: true },
    webinarLink: { type: String, required: true },
    promoCode: { type: String },
    isDisabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Webinar", webinarSchema);
