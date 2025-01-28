const TermsOfService = require("../model/termsOfService.model");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");

const addTerms = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Content is required for terms of service."));
    }

    let termsOfService = await TermsOfService.findOne();
    if (!termsOfService) {
      termsOfService = await TermsOfService.create({
        content,
      });

      await termsOfService.save();

      return res
        .status(HTTP_STATUS.OK)
        .send(success("Terms of Service added successfully", termsOfService));
    }
    termsOfService.content = content;
    await termsOfService.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Terms of Service updated successfully", termsOfService));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getTermsOfService = async (req, res) => {
  try {
    const terms = await TermsOfService.findOne();

    if (!terms) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No terms of service found."));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Terms of Service fetched successfully", terms));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

module.exports = { addTerms, getTermsOfService };
