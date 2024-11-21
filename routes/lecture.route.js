const express = require("express");
const routes = express();
const {
  addLecture,
  getAllLecturesOfOneSection,
  getAllLecturesOfOneCourse,
  getLectureById,
  updateLectureById,
  deleteLectureById,
  toggleEnableDisableLecture,
} = require("../controller/lecture.controller");
const { userValidator, authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");
const courseFileUpload = require("../middleware/courseFileUpload");

routes.post("/add-lecture", isAuthorizedUser, courseFileUpload(), addLecture);

routes.get(
  "/get-all-lectures-of-one-section/:sectionId",
  getAllLecturesOfOneSection
);

routes.get(
  "/get-all-lectures-of-one-course/:courseId",
  getAllLecturesOfOneCourse
);

routes.get("/get-lecture-by-id/:lectureId", getLectureById);

routes.put(
  "/update-lecture-by-id/:lectureId",
  courseFileUpload(),
  updateLectureById
);

routes.delete("/delete-lecture-by-id/:id", deleteLectureById);

routes.patch("/toggle-enable-disable-lecture/:id", toggleEnableDisableLecture);

module.exports = routes;
