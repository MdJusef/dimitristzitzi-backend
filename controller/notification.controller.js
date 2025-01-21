const User = require("../model/user.model");
const Notification = require("../model/notification.model");
const HTTP_STATUS = require("../constants/statusCodes");

// Controller to get notifications by userId
const getNotificationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide userId"));
    }

    // Fetch the user to check if they exist
    const user = await User.findById(userId).populate("notifications");

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not exist"));
    }
    // Return the user's notifications
    res.status(HTTP_STATUS.OK).send({
      message: "Notifications fetched successfully",
      notifications: user.notifications,
    });
    // .json({
    //   message: "Notifications fetched successfully",
    //   notifications: user.notifications,
    // });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    // Fetch the user to check if they exist
    const notifications = await Notification.find();

    if (!notifications) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not exist"));
    }

    res.status(HTTP_STATUS.OK).send({
      message: "Notifications fetched successfully",
      notifications: notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const readNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide notificationId"));
    }

    // Fetch the notification to check if it exists
    const notification = await Notification.findById(notificationId);
    console.log(notification, "notification");
    if (!notification || notification === null) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Notification does not exist"));
    }

    // Update the notification to read
    notification.isRead = true;
    await notification.save();

    res.status(HTTP_STATUS.OK).send({
      message: "Notification read successfully",
      notification: notification,
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getNotificationsByUserId,
  readNotification,
  getAllNotifications,
};
