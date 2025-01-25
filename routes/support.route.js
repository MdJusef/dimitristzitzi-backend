const express = require("express");
const routes = express();
const { sendMailToSupport } = require("../controller/support.controller");

routes.post("/send-mail-to-support", sendMailToSupport);
module.exports = routes;
