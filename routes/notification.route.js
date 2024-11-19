const express = require("express");
const routes = express();
const {
  getNotificationsByUserId,
  getAllNotifications,
} = require("../controller/notification.controller");

// Route to get notifications by userId
routes.get("/get-notifications-by-user/:userId", getNotificationsByUserId);
routes.get("/get-all-notifications", getAllNotifications);
module.exports = routes;
