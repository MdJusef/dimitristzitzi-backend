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

const updateServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated service", service));
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
      .limit(limit);
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

const getServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Course.findById(req.params.id);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching service", error.message));
  }
};

const getServiceByDoctorId = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide doctor id"));
    }
    const service = await Course.find({ doctor: req.params.id });
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching service", error.message));
  }
};

const deleteServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Course.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting service", error.message));
  }
};

const disableServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Course.findByIdAndUpdate(
      req.params.id,
      { isDisabled: true },
      { new: true }
    );
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully disabled service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error disabling service", error.message));
  }
};

const enableServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Course.findByIdAndUpdate(
      req.params.id,
      { isDisabled: false },
      { new: true }
    );
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully enabled service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error enabling service", error.message));
  }
};

const approveServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Course.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully approved service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error approving service", error.message));
  }
};

const cancelServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Course.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully approved service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error approving service", error.message));
  }
};

module.exports = {
  addCourse,
  getAllCourses,
  getServiceById,
  getServiceByDoctorId,
  updateServiceById,
  deleteServiceById,
  disableServiceById,
  enableServiceById,
  approveServiceById,
  cancelServiceById,
};
