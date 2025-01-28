const express = require("express");
const routes = express();
const {
  addService,
  getAllServices,
  getServiceById,
  getServiceByDoctorId,
  updateServiceById,
  deleteServiceById,
  disableServiceById,
  enableServiceById,
  approveServiceById,
  cancelServiceById,
} = require("../controller/service.controller");
const { userValidator, authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");
const { get } = require("mongoose");
// const { authValidator } = require("../middleware/authValidation");

routes.post(
  "/add-service",

  isAuthorizedAdmin,
  addService
);

routes.get("/get-all-services", getAllServices);

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
