const FAQ = require("../model/faq.model");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");

const addFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Both question and answer are required."));
    }

    const newFAQ = await FAQ.create({
      question,
      answer,
    });

    return res
      .status(HTTP_STATUS.OK)
      .send(success("FAQ added successfully", newFAQ));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

// Update an existing FAQ
const updateFAQ = async (req, res) => {
  try {
    const { faqId, question, answer } = req.body;

    if (!faqId || !question || !answer) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("FAQ ID and question and answer are required."));
    }

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      faqId,
      { question, answer },
      { new: true }
    );

    if (!updatedFAQ) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("FAQ not found."));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("FAQ updated successfully", updatedFAQ));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

// Get all FAQs
const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });

    return res
      .status(HTTP_STATUS.OK)
      .send(success("FAQs fetched successfully", faqs));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

// Delete an FAQ
const deleteFAQ = async (req, res) => {
  try {
    const { faqId } = req.params;

    const deletedFAQ = await FAQ.findByIdAndDelete(faqId);

    if (!deletedFAQ) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(failure("FAQ not found."));
    }

    return res
      .status(HTTP_STATUS.OK)
      .json(success("FAQ deleted successfully", deletedFAQ));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(failure("Internal server error"));
  }
};
module.exports = { addFAQ, updateFAQ, getAllFAQs, deleteFAQ };
