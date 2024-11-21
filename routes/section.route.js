const express = require("express");
const routes = express();
const {
  addSection,
  getAllSections,
  getSectionById,
  updateSectionById,
  deleteSectionById,
  toggleEnableDisableSection,
} = require("../controller/section.controller");
const { userValidator, authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");
const courseFileUpload = require("../middleware/courseFileUpload");

routes.post("/add-section", isAuthorizedUser, courseFileUpload(), addSection);

routes.get("/get-all-sections/:courseId", getAllSections);

routes.get("/get-section-by-id/:sectionId", getSectionById);

routes.put(
  "/update-section-by-id/:sectionId",
  isAuthorizedUser,
  courseFileUpload(),
  updateSectionById
);

routes.delete("/delete-section-by-id/:id", deleteSectionById);

routes.patch("/toggle-enable-disable-section/:id", toggleEnableDisableSection);

module.exports = routes;
