const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Webinar = require("../model/webinar.model");
const User = require("../model/user.model");
const Notification = require("../model/notification.model");

const addWebinar = async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      description,
      hostName,
      hostTitle,
      webinarLink,
      promoCode,
    } = req.body;

    const creator = await User.findById(req.user._id);

    if (!creator) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("creator not found"));
    }

    const newWebinar = new Webinar({
      title,
      date,
      time,

      description,
      hostName,
      hostTitle,
      webinarLink,
      promoCode,

      creator: creator._id,
    });

    if (!newWebinar) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("webinar could not be added"));
    }

    if (req.files && req.files["image"]) {
      console.log("req.files", req.files);
      console.log("req.files[image]", req.files["image"]);
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        newWebinar.thumbnailImage = imageFileName;
      }
    }

    await newWebinar.save();

    creator.webinars.push(newWebinar._id);
    await creator.save();

    const notification = new Notification({
      message: `New webinar has been added: ${newWebinar.title}.`,
      applicant: creator._id,
      type: "webinar",
      webinar: newWebinar._id,
    });

    if (!notification) {
      return res.status(HTTP_STATUS.BAD_REQUEST).send(failure("Error"));
    }
    await notification.save();

    creator.notifications.push(notification._id);
    await creator.save();
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("webinar added successfully", newWebinar));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding webinar", err.message));
  }
};

const updateWebinarById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide webinar id"));
    }
    const {
      title,
      date,
      time,
      description,
      hostName,
      hostTitle,
      webinarLink,
      promoCode,
    } = req.body;

    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("webinar not found"));
    }

    webinar.title = title || webinar.title;
    webinar.date = date || webinar.date;
    webinar.time = time || webinar.time;
    webinar.description = description || webinar.description;
    webinar.hostName = hostName || webinar.hostName;
    webinar.hostTitle = hostTitle || webinar.hostTitle;
    webinar.webinarLink = webinarLink || webinar.webinarLink;
    webinar.promoCode = promoCode || webinar.promoCode;

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        webinar.thumbnailImage = imageFileName;
      }
    }

    await webinar.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated webinar", webinar));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error updating webinar", error.message));
  }
};

const getAllWebinars = async (req, res) => {
  try {
    const webinars = await Webinar.find();

    const count = await Webinar.countDocuments();

    if (!webinars || !webinars.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("webinars not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all webinars", {
        result: webinars,
        total: count,
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching webinars", error.message));
  }
};

const getAllCoursesByCategory = async (req, res) => {
  try {
    const courses = await Webinar.find({ isDeleted: false });

    if (!courses || !courses.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("courses not found"));
    }

    const coursesByCategory = {};
    courses.forEach((course) => {
      if (!coursesByCategory[course.category]) {
        coursesByCategory[course.category] = [];
      }
      coursesByCategory[course.category].push(course);
    });

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received all courses", coursesByCategory));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching courses", error.message));
  }
};

const getWebinarById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide course id"));
    }

    const webinar = await Webinar.findById(req.params.id);

    if (!webinar) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("webinar not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received webinar", webinar));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching webinar", error.message));
  }
};

const getCourseByInstructorId = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide instructor id"));
    }
    const courses = await Webinar.find({ instructor: req.params.id }).populate(
      "reviews"
    );
    if (!courses || !courses.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("courses not found"));
    }

    const totalCourses = courses.length;
    const coursesWithEnrolledStudents = courses.filter(
      (course) => course.enrolledStudents && course.enrolledStudents.length > 0
    ).length;
    const totalEnrolledStudents = courses.reduce(
      (sum, course) =>
        sum + (course.enrolledStudents ? course.enrolledStudents.length : 0),
      0
    );

    let totalRatings = 0;
    let totalRatingCount = 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    courses.forEach((course) => {
      if (course.reviews && course.reviews.length > 0) {
        course.reviews.forEach((review) => {
          totalRatings += review.rating;
          totalRatingCount++;
          ratingCounts[review.rating]++;
        });
      }
    });

    const averageRating = totalRatingCount
      ? (totalRatings / totalRatingCount).toFixed(2)
      : 0;

    const ratingPercentages = {};
    for (const [star, count] of Object.entries(ratingCounts)) {
      ratingPercentages[star] = totalRatingCount
        ? ((count / totalRatingCount) * 100).toFixed(2)
        : 0;
    }

    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received courses", {
        courses,
        totalCourses,
        coursesWithEnrolledStudents,
        totalEnrolledStudents,
        averageRating,
        ratingPercentages,
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching courses", error.message));
  }
};

const deleteWebinarById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide webinar id"));
    }
    const webinar = await Webinar.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!webinar) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("webinar not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted webinar", webinar));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting webinar", error.message));
  }
};

module.exports = {
  addWebinar,
  getAllWebinars,
  getAllCoursesByCategory,
  getWebinarById,
  getCourseByInstructorId,

  updateWebinarById,
  deleteWebinarById,
};
