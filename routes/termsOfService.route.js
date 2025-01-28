const express = require("express");
const routes = express();
const {
  addTerms,
  getTermsOfService,
} = require("../controller/termsOfService.controller");

routes.get("/get-terms-of-service", getTermsOfService);
routes.post("/add-terms-of-service", addTerms);
module.exports = routes;
