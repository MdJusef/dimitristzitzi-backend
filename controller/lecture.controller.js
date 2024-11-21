const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Lecture = require("../model/lecture.model");
const Course = require("../model/course.model");
const Section = require("../model/section.model");
const User = require("../model/user.model");
const Notification = require("../model/notification.model");

const addLecture = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized! Pleaase login"));
    }
    const { courseId, sectionId, title, duration, description, position } =
      req.body;
    if (!courseId || !sectionId || !title || !duration) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide courseId, sectionId, title, duration"));
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

    const existingSection = await Section.findOne({
      _id: sectionId,
    });

    if (!existingCourse) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Course not found"));
    }

    if (!existingSection) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Section not found"));
    }

    const newLecture = new Lecture({
      title,
      duration,
      description,
      position,
      course: existingCourse._id,
      section: existingSection._id,
    });

    if (!newLecture) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("lecture could not be added"));
    }

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        newLecture.thumbnailImage = imageFileName;
      }
    }

    if (req.files && req.files["videoFile"]) {
      let videoFileName = "";
      if (req.files.videoFile[0]) {
        // Add public/uploads link to the video file
        videoFileName = `public/uploads/videos/${req.files.videoFile[0].filename}`;
        newLecture.videoUrl = videoFileName;
      }
    }

    await newLecture.save();

    existingSection.lectures.push(newLecture._id);
    await existingSection.save();

    const notification = new Notification({
      message: `New lecture has been created: ${newLecture.title}.`,
      applicant: instructor._id,
      type: "lecture",
      course: existingCourse._id,
      lecture: newLecture._id,
    });

    if (!notification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Notification could not be created"));
    }
    await notification.save();

    instructor.notifications.push(notification._id);
    await instructor.save();

    const lecture = await Lecture.findById(newLecture._id).populate(
      "course section"
    );

    if (!lecture) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("lecture could not be created"));
    }

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("lecture added successfully", lecture));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding course", err.message));
  }
};

const updateLectureById = async (req, res) => {
  try {
    if (!req.params.lectureId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide lecture id"));
    }
    const { title, duration, description, position } = req.body;

    const lecture = await Lecture.findById(req.params.lectureId);

    if (!lecture) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("lecture not found"));
    }

    lecture.title = title || lecture.title;
    lecture.duration = duration || lecture.duration;
    lecture.description = description || lecture.description;
    lecture.position = position || lecture.position;

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        lecture.thumbnailImage = imageFileName;
      }
    }

    if (req.files && req.files["videoFile"]) {
      let videoFileName = "";
      if (req.files.videoFile[0]) {
        // Add public/uploads link to the video file
        videoFileName = `public/uploads/videos/${req.files.videoFile[0].filename}`;
        lecture.videoUrl = videoFileName;
      }
    }

    await lecture.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated lecture", lecture));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllLecturesOfOneSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!sectionId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("sectionId is required"));
    }

    const lectures = await Lecture.find({
      section: sectionId,
      isDeleted: false,
    });

    const count = await Lecture.countDocuments({
      section: sectionId,
      isDeleted: false,
    });

    if (!lectures.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Lectures not found"));
    }

    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all lectures", {
        lectures,
        count,
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching lectures", error.message));
  }
};

const getLectureById = async (req, res) => {
  try {
    if (!req.params.lectureId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide lectureId"));
    }
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("lecture not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received lecture", lecture));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching lecture", error.message));
  }
};

const getAllLecturesOfOneCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("courseId is required"));
    }

    const lectures = await Lecture.find({
      course: courseId,
      isDeleted: false,
    });

    const count = await Lecture.countDocuments({
      course: courseId,
      isDeleted: false,
    });

    if (!lectures.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Lectures not found"));
    }

    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all lectures", {
        lectures,
        count,
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching lectures", error.message));
  }
};

const deleteLectureById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide lecture id"));
    }
    const lecture = await Lecture.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!lecture) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("lecture not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted lecture", lecture));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting lecture", error.message));
  }
};

const toggleEnableDisableLecture = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide lecture id"));
    }
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("lecture not found"));
    }
    lecture.isDisabled = !lecture.isDisabled;
    await lecture.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated lecture", lecture));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error updating lecture", error.message));
  }
};

module.exports = {
  addLecture,
  getAllLecturesOfOneSection,
  getAllLecturesOfOneCourse,
  getLectureById,
  updateLectureById,
  deleteLectureById,
  toggleEnableDisableLecture,
};
