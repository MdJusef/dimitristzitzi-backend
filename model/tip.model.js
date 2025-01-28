const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TipSchema = new Schema(
  {
    //   title: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //   },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    //   description: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //   },
    //   category: {
    //     type: String,
    //     enum: ['Nutrition', 'Exercise', 'Mental Health', 'Sleep', 'Others'],
    //     default: 'Others',
    //   },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tip", TipSchema);
