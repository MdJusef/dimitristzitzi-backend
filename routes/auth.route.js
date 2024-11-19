const express = require("express");
const routes = express();
const {
  signup,
  verifyEmail,
  login,
  logout,
  signupAsInstructor,
  approveInstructor,
  cancelInstructor,
  loginAsInstructor,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controller/auth.controller");
const { authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");

// for signing up
routes.post("/auth/signup", authValidator.create, signup);

// for signing up as doctor
routes.post(
  "/auth/signup-as-instructor",
  authValidator.create,
  signupAsInstructor
);

routes.post(
  "/auth/verify-email",
  // userValidator.create,
  // authValidator.create,
  verifyEmail
);

routes.post(
  "/auth/forgot-password",
  // userValidator.create,
  // authValidator.create,
  forgotPassword
);

routes.post(
  "/auth/reset-password",
  // userValidator.create,
  // authValidator.create,
  resetPassword
);

routes.post(
  "/auth/change-password",
  // userValidator.create,
  // authValidator.create,
  changePassword
);

// for approving doctor
routes.post("/auth/approve-instructor", isAuthorizedAdmin, approveInstructor);

// for canceling doctor
routes.post("/auth/cancel-instructor", isAuthorizedAdmin, cancelInstructor);

// for logging in
routes.post("/auth/login", authValidator.login, login);

// for logging in
routes.post("/auth/login-as-doctor", authValidator.login, loginAsInstructor);

// for logging in
routes.post("/auth/logout", logout);

module.exports = routes;
