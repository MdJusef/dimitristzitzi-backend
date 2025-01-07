const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Course = require("../model/course.model");
const User = require("../model/user.model");
const Notification = require("../model/notification.model");

const addCourse = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      price,
      platformFees,
      category,
      subCategory,
      topic,
      language,
      level,
      duration,
      description,
      teachingMaterials,
      targetAudience,
      requirements,
      welcomeMessage,
      congratulationsMessage,
      sectionCount,
      lectureCount,
    } = req.body;

    const instructor = await User.findById(req.user._id);

    if (!instructor) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("instructor not found"));
    }

    const parsedTargetAudience = Array.isArray(targetAudience)
      ? targetAudience
      : JSON.parse(targetAudience || "[]");

    const parsedRequirements = Array.isArray(requirements)
      ? requirements
      : JSON.parse(requirements || "[]");

    const parsedTeachingMaterials = Array.isArray(teachingMaterials)
      ? teachingMaterials
      : JSON.parse(teachingMaterials || "[]");

    const newCourse = new Course({
      title,
      subtitle,
      price,
      platformFees,
      category,
      subCategory,
      topic,
      language,
      level,
      duration,
      description,
      teachingMaterials: parsedTeachingMaterials,
      targetAudience: parsedTargetAudience,
      requirements: parsedRequirements,
      welcomeMessage,
      congratulationsMessage,
      instructor: instructor._id,
      sectionCount,
      lectureCount,
    });

    if (!newCourse) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Course could not be added"));
    }

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        newCourse.thumbnailImage = imageFileName;
      }
    }

    if (req.files && req.files["videoFile"]) {
      let videoFileName = "";
      if (req.files.videoFile[0]) {
        // Add public/uploads link to the video file
        videoFileName = `public/uploads/videos/${req.files.videoFile[0].filename}`;
        newCourse.promoVideo = videoFileName;
      }
    }

    await newCourse.save();

    instructor.uploadedCourses.push(newCourse._id);
    await instructor.save();

    const notification = new Notification({
      message: `New course has been created: ${newCourse.title}.`,
      applicant: instructor._id,
      type: "course",
      course: newCourse._id,
    });

    if (!notification) {
      return res.status(HTTP_STATUS.BAD_REQUEST).send(failure("Error"));
    }
    await notification.save();

    instructor.notifications.push(notification._id);
    await instructor.save();
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Course added successfully", newCourse));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding course", err.message));
  }
};

const updateCourseById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide course id"));
    }
    const {
      title,
      subtitle,
      price,
      platformFees,
      category,
      subCategory,
      topic,
      language,
      level,
      duration,
      description,
      teachingMaterials,
      targetAudience,
      requirements,
      welcomeMessage,
      congratulationsMessage,
      sectionCount,
      lectureCount,
    } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }

    const parsedTargetAudience = Array.isArray(targetAudience)
      ? targetAudience
      : JSON.parse(targetAudience || "[]");

    const parsedRequirements = Array.isArray(requirements)
      ? requirements
      : JSON.parse(requirements || "[]");

    const parsedTeachingMaterials = Array.isArray(teachingMaterials)
      ? teachingMaterials
      : JSON.parse(teachingMaterials || "[]");

    course.title = title || course.title;
    course.subtitle = subtitle || course.subtitle;
    course.price = price || course.price;
    course.platformFees = platformFees || course.platformFees;
    course.category = category || course.category;
    course.subCategory = subCategory || course.subCategory;
    course.topic = topic || course.topic;
    course.language = language || course.language;
    course.level = level || course.level;
    course.duration = duration || course.duration;
    course.description = description || course.description;
    course.teachingMaterials =
      parsedTeachingMaterials || course.teachingMaterials;
    course.targetAudience = parsedTargetAudience || course.targetAudience;
    course.requirements = parsedRequirements || course.requirements;
    course.welcomeMessage = welcomeMessage || course.welcomeMessage;
    course.congratulationsMessage =
      congratulationsMessage || course.congratulationsMessage;
    course.sectionCount = sectionCount || course.sectionCount;
    course.lectureCount = lectureCount || course.lectureCount;

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        course.thumbnailImage = imageFileName;
      }
    }

    if (req.files && req.files["videoFile"]) {
      let videoFileName = "";
      if (req.files.videoFile[0]) {
        // Add public/uploads link to the video file
        videoFileName = `public/uploads/videos/${req.files.videoFile[0].filename}`;
        course.promoVideo = videoFileName;
      }
    }

    await course.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated course", course));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllCourses = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    const courses = await Course.find({ isDeleted: false })

      .skip(skip)
      .limit(limit)
      .populate("instructor");
    const count = await Course.countDocuments({ isDeleted: false });

    if (!courses) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Services not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all courses", {
        result: courses,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching services", error.message));
  }
};

const getCourseById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide course id"));
    }
    // const course = await Course.findById(req.params.id).populate(
    //   "instructor reviews sections"
    // );
    // const course = await Course.findById(req.params.id)
    //   .populate("instructor reviews") // Populate instructor and reviews
    //   .populate({
    //     path: "reviews.user", // Populate user in the reviews
    //     model: "User",
    //   })
    //   .catch((err) => {
    //     console.error("Population Error:", err);
    //   });
    const course = await Course.findById(req.params.id)
      .populate({
        path: "reviews",
        populate: {
          path: "user", // Populate user in reviews
          model: "User",
          select:
            "-notifications -password -__v -courses -reviews -createdAt -updatedAt -emailVerified -emailVerifyCode -isActive -isLocked -uploadedCourses -enrolledCourses",
        },
      })
      .populate("instructor sections");
    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received course", course));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching course", error.message));
  }
};

const getCourseByInstructorId = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide doctor id"));
    }
    const course = await Course.find({ instructor: req.params.id });
    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received course", course));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching course", error.message));
  }
};

const deleteCourseById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide course id"));
    }
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted course", course));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting course", error.message));
  }
};

const toggleEnableDisableCourse = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide course id"));
    }
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }
    course.isDisabled = !course.isDisabled;
    await course.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated course", course));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error updating course", error.message));
  }
};

const toggleApproveCancelCourse = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide course id"));
    }
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }
    course.status = course.status === "approved" ? "cancelled" : "approved";
    await course.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated course", course));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error updating course", error.message));
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Course.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    if (!categories) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Categories not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all categories with their courses count", {
        categories,
        count: categories.length,
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching categories", error.message));
  }
};

module.exports = {
  addCourse,
  getAllCourses,
  getCourseById,
  getCourseByInstructorId,
  updateCourseById,
  deleteCourseById,
  toggleEnableDisableCourse,
  toggleApproveCancelCourse,
  getAllCategories,
};
