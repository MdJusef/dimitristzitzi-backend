const express = require("express");
const routes = express();
const {
  bookAppointment,
  addZoomLinkToAppointment,
  addEmailForZoomLink,
  assignDoctorToAppointment,
  cancelAppointment,
  completeAppointment,
  getAllAppointments,
  getAppointmentById,
  getAppointmentByPatientId,
  getAppointmentByDoctorId,
} = require("../controller/appointment.controller");
const { userValidator, authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");
// const { authValidator } = require("../middleware/authValidation");

routes.post(
  "/book-service",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedUser,
  bookAppointment
);

routes.post(
  "/add-zoom-link",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedAdmin,
  addZoomLinkToAppointment
);

routes.post(
  "/add-email-for-zoom-link",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedUser,
  addEmailForZoomLink
);

routes.get(
  "/get-all-appointments",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedAdmin,
  getAllAppointments
);

routes.get(
  "/get-appointment-by-id/:id",
  // userValidator.create,
  // authValidator.create,
  getAppointmentById
);

routes.get(
  "/get-appointment-by-patientId",
  isAuthorizedUser,
  getAppointmentByPatientId
);

routes.get(
  "/get-appointment-by-doctorId",
  isAuthorizedUser,
  getAppointmentByDoctorId
);

routes.patch(
  "/cancel-appointment-by-id",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedAdmin,
  cancelAppointment
);

routes.patch(
  "/complete-appointment-by-id",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedAdmin,
  completeAppointment
);

routes.patch(
  "/assign-doctor-to-appointment",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedAdmin,
  assignDoctorToAppointment
);

module.exports = routes;
