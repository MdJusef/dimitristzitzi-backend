const Chat = require("../model/chat.model");
const User = require("../model/user.model");
const Message = require("../model/message.model");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");

const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const loggedInUserId = req.param.id;
    if (!chatId || !content) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide chatId and content"));
    }
    const newMessage = {
      //   sender: req.user._id,
      sender: loggedInUserId,
      content,
      chat: chatId,
    };
    let message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Message sent successfully", message));
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const fetchAllMessages = async (req, res) => {
  try {
    const { chatId } = req.body;
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Messages fetched successfully", messages));
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

module.exports = {
  sendMessage,
  fetchAllMessages,
};
