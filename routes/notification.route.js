const express = require("express");
const routes = express();
const {
  getNotificationsByUserId,
  readNotification,
  getAllNotifications,
} = require("../controller/notification.controller");

// Route to get notifications by userId
routes.get("/get-notifications-by-user/:userId", getNotificationsByUserId);
routes.get("/get-all-notifications", getAllNotifications);
routes.post("/read-notification/:notificationId", readNotification);
module.exports = routes;
