const express = require("express");
const routes = express();
const {
  addCourse,
  getAllCourses,
  getCourseById,
  getCourseByInstructorId,
  // getUserCourseTransactionStatistcs,
  getInstructorTransactions,
  updateCourseById,
  deleteCourseById,
  toggleEnableDisableCourse,
  getAllCoursesByCategory,
  toggleApproveCancelCourse,
  getAllCategories,
} = require("../controller/course.controller");
const { userValidator, authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");
const courseFileUpload = require("../middleware/courseFileUpload");

routes.post("/add-course", isAuthorizedUser, courseFileUpload(), addCourse);

routes.get("/get-all-courses", getAllCourses);
routes.get("/get-all-courses-by-category", getAllCoursesByCategory);

routes.get("/get-course-by-id/:id", getCourseById);

routes.get("/get-course-by-instructor-id/:id", getCourseByInstructorId);

routes.put(
  "/update-course-by-id/:id",
  isAuthorizedUser,
  courseFileUpload(),
  updateCourseById
);

routes.delete("/delete-course-by-id/:id", deleteCourseById);

routes.patch("/toggle-enable-disable-course/:id", toggleEnableDisableCourse);

routes.patch(
  "/toggle-approve-cancel-course/:id",
  isAuthorizedAdmin,
  toggleApproveCancelCourse
);

routes.get("/get-all-categories", getAllCategories);

// routes.get(
//   "/get-user-course-transaction-statistcs/:id",
//   // isAuthorizedUser,
//   getUserCourseTransactionStatistcs
// );
routes.get(
  "/get-instructor-transactions/:instructorId",
  // isAuthorizedUser,
  getInstructorTransactions
);

module.exports = routes;
