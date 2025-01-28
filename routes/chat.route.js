const express = require("express");
const routes = express();
const { accessChat, fetchChats } = require("../controller/chat.controller");
const {
  sendMessage,
  fetchAllMessages,
} = require("../controller/message.controller");

routes.post("/access-chat/:id", accessChat);
// routes.route("/get-users-all-chat").get(protect, fetchChats);
routes.get("/get-users-all-chat/:id", fetchChats);

routes.post("/send-message/:id", sendMessage);

routes.get("/fetch-messages", fetchAllMessages);

module.exports = routes;
