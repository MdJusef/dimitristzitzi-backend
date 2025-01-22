const express = require("express");
const routes = express();
const {
  createPaymentIntent,
  getPaymentIntent,
  getAllPaymentIntents,
  confirmPaymentbyPaymentIntent,
  getAllTransactions,
  getTransactionByUserId,
  saveCard,
  confirmPaymentUsingSavedCard,
  getUserCourseTransactions,
} = require("../controller/payment.controller");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");

routes.post("/create-payment-intent", isAuthorizedUser, createPaymentIntent);
routes.post(
  "/confirm-payment",
  isAuthorizedUser,
  confirmPaymentbyPaymentIntent
);
routes.post("/get-payment-intent", getPaymentIntent);
routes.get("/get-all-payment-intents", isAuthorizedAdmin, getAllPaymentIntents);

routes.get("/get-all-transactions", getAllTransactions);
routes.get("/get-transaction-by-user-id/:userId", getTransactionByUserId);

routes.get("/get-user-course-transactions/:userId", getUserCourseTransactions);

routes.post("/save-card", saveCard);
routes.post("/confirm-payment-using-saved-card", confirmPaymentUsingSavedCard);

module.exports = routes;
