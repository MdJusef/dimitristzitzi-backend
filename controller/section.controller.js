const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Section = require("../model/section.model");
const Course = require("../model/course.model");
const User = require("../model/user.model");
const Notification = require("../model/notification.model");

const addSection = async (req, res) => {
  try {
    const { courseId, title, lectureCount, totalDuration } = req.body;

    if (!req.user || !req.user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized! Pleaase login"));
    }

    const instructor = await User.findById(req.user._id);

    if (!instructor) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("instructor not found"));
    }
    const existingCourse = await Course.findOne({
      _id: courseId,
    });

    if (!existingCourse) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Course not found"));
    }

    const newSection = new Section({
      title,
      lectureCount,
      totalDuration,
      course: existingCourse._id,
    });

    if (!newSection) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Section could not be added"));
    }

    await newSection.save();

    existingCourse.sections.push(newSection._id);
    await existingCourse.save();

    const notification = new Notification({
      message: `New section has been created: ${newSection.title}.`,
      applicant: instructor._id,
      type: "section",
      course: existingCourse._id,
    });

    if (!notification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Notification could not be created"));
    }
    await notification.save();

    instructor.notifications.push(notification._id);
    await instructor.save();

    const section = await Section.findById(newSection._id).populate({
      path: "course",
      populate: {
        path: "instructor",
        select: "name email",
      },
    });

    if (!section) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Section could not be created"));
    }

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Section added successfully", section));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding course", err.message));
  }
};

const updateSectionById = async (req, res) => {
  try {
    if (!req.params.sectionId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide section id"));
    }
    const { title, lectureCount, totalDuration } = req.body;

    const section = await Section.findById(req.params.sectionId);

    if (!section) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }

    section.title = title || section.title;
    section.lectureCount = lectureCount || section.lectureCount;
    section.totalDuration = totalDuration || section.totalDuration;

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        section.thumbnailImage = imageFileName;
      }
    }

    await section.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated section", section));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllSections = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Course ID is required"));
    }

    const sections = await Section.find({ course: courseId, isDeleted: false });

    const count = await Section.countDocuments({
      course: courseId,
      isDeleted: false,
    });

    if (!sections.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Sections not found"));
    }

    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all sections", {
        sections,
        count,
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching sections", error.message));
  }
};

const getSectionById = async (req, res) => {
  try {
    if (!req.params.sectionId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide sectionId"));
    }
    const section = await Section.findById(req.params.sectionId);
    if (!section) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("section not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received section", section));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching section", error.message));
  }
};

const deleteSectionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide course id"));
    }
    const section = await Section.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!section) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("section not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted section", section));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting section", error.message));
  }
};

const toggleEnableDisableSection = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide course id"));
    }
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }
    section.isDisabled = !section.isDisabled;
    await section.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated course", section));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error updating course", error.message));
  }
};

module.exports = {
  addSection,
  getAllSections,
  getSectionById,
  updateSectionById,
  deleteSectionById,
  toggleEnableDisableSection,
};
