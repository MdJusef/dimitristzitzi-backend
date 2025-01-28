const express = require("express");
const routes = express();
const {
  addFAQ,
  updateFAQ,
  getAllFAQs,
  deleteFAQ,
} = require("../controller/faq.controller");

routes.post("/add-faq", addFAQ);
routes.put("/update-faq", updateFAQ);
routes.get("/get-all-faqs", getAllFAQs);
routes.delete("/delete-faq/:faqId", deleteFAQ);
module.exports = routes;
