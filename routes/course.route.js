const express = require("express");
const routes = express();
const {
  addCourse,
  getAllCourses,
  getServiceById,
  getServiceByDoctorId,
  updateServiceById,
  deleteServiceById,
  disableServiceById,
  enableServiceById,
  approveServiceById,
  cancelServiceById,
} = require("../controller/course.controller");
const { userValidator, authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");
const courseFileUpload = require("../middleware/courseFileUpload");

routes.post("/add-course", isAuthorizedUser, courseFileUpload(), addCourse);

routes.get("/get-all-courses", getAllCourses);

routes.get(
  "/get-service-by-id/:id",

  getServiceById
);

routes.get(
  "/get-service-by-doctorId/:id",

  getServiceByDoctorId
);

routes.put("/update-service-by-id/:id", isAuthorizedAdmin, updateServiceById);

routes.delete(
  "/delete-service-by-id/:id",
  isAuthorizedAdmin,
  deleteServiceById
);

routes.patch(
  "/disable-service-by-id/:id",
  isAuthorizedAdmin,
  disableServiceById
);

routes.patch(
  "/enable-service-by-id/:id",

  isAuthorizedAdmin,
  enableServiceById
);

routes.patch(
  "/approve-service-by-id/:id",

  isAuthorizedAdmin,
  approveServiceById
);

routes.patch(
  "/cancel-service-by-id/:id",

  isAuthorizedAdmin,
  cancelServiceById
);

module.exports = routes;
