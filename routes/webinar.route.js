const express = require("express");
const routes = express();
const {
  addWebinar,
  getAllWebinars,
  getWebinarById,
  //   getCourseByInstructorId,
  //   getUserCourseTransactionStatistcs,
  updateWebinarById,
  deleteWebinarById,
  //   toggleEnableDisableCourse,
  //   getAllCoursesByCategory,
  //   toggleApproveCancelCourse,
  //   getAllCategories,
} = require("../controller/webinar.controller");
const { userValidator, authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");
const courseFileUpload = require("../middleware/courseFileUpload");

routes.post("/add-webinar", isAuthorizedUser, courseFileUpload(), addWebinar);

routes.get("/get-all-webinars", getAllWebinars);

routes.get("/get-webinar-by-id/:id", getWebinarById);

// routes.get("/get-course-by-instructor-id/:id", getCourseByInstructorId);

routes.put(
  "/update-webinar-by-id/:id",
  isAuthorizedUser,
  courseFileUpload(),
  updateWebinarById
);

routes.delete("/delete-webinar-by-id/:id", deleteWebinarById);

// routes.patch("/toggle-enable-disable-course/:id", toggleEnableDisableCourse);

// routes.patch(
//   "/toggle-approve-cancel-course/:id",
//   isAuthorizedAdmin,
//   toggleApproveCancelCourse
// );

// routes.get("/get-all-categories", getAllCategories);

// routes.get(
//   "/get-user-course-transaction-statistcs/:id",
//   // isAuthorizedUser,
//   getUserCourseTransactionStatistcs
// );

module.exports = routes;
