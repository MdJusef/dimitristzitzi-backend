const express = require("express");
const routes = express();
const {
  addTip,
  updateTip,
  getAllTips,
  deleteTip,
} = require("../controller/tip.controller");

routes.post("/add-tip", addTip);
routes.put("/update-tip/:tipId", updateTip);
routes.get("/get-all-tips", getAllTips);
routes.delete("/delete-tip/:tipId", deleteTip);
module.exports = routes;
