const Tip = require("../model/tip.model");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");

const addTip = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(failure("URL is required."));
    }

    const newTip = await Tip.create({
      url,
    });

    return res
      .status(HTTP_STATUS.OK)
      .send(success(" tip added successfully", newTip));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const updateTip = async (req, res) => {
  try {
    const { tipId } = req.params;
    const { url } = req.body;
    if (!url) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(failure("URL is not provided."));
    }

    if (!tipId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(failure("Tip ID is required."));
    }

    const updatedTip = await Tip.findByIdAndUpdate(
      tipId,
      { url },
      { new: true }
    );

    if (!updatedTip) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(failure("tip not found."));
    }

    return res
      .status(HTTP_STATUS.OK)
      .json(success("Healthy tip updated successfully", updatedTip));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(failure("Internal server error"));
  }
};

const getAllTips = async (req, res) => {
  try {
    const tips = await Tip.find().sort({ createdAt: -1 });

    return res
      .status(HTTP_STATUS.OK)
      .json(success("tips fetched successfully", tips));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(failure("Internal server error"));
  }
};

const deleteTip = async (req, res) => {
  try {
    const { tipId } = req.params;

    const deletedTip = await Tip.findByIdAndDelete(tipId);

    if (!deletedTip) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(failure("Healthy tip not found."));
    }

    return res
      .status(HTTP_STATUS.OK)
      .json(success("Healthy tip deleted successfully", deletedTip));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(failure("Internal server error"));
  }
};

module.exports = { addTip, updateTip, getAllTips, deleteTip };
