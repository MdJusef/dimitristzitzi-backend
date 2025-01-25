const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Course = require("../model/course.model");
const User = require("../model/user.model");
const Notification = require("../model/notification.model");
const Transaction = require("../model/transaction.model");

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
      promoVideoURL,
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
      promoVideoURL,
    });

    if (!newCourse) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Course could not be added"));
    }

    if (req.files && req.files["image"]) {
      console.log("req.files", req.files);
      console.log("req.files[image]", req.files["image"]);
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
    const category = req.query.category; // Get the category from the query parameters
    const search = req.query.search; // Get the search string from the query parameters

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    // Construct the query object
    const query = { isDeleted: false };
    if (category) {
      query.category = category; // Add category filter if category is provided
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(query)

      .skip(skip)
      .limit(limit)
      .populate("instructor");
    const count = await Course.countDocuments(query);

    if (!courses || !courses.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("courses not found"));
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
      .send(failure("Error fetching courses", error.message));
  }
};

const getAllCoursesByCategory = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: false });

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
      .populate({
        path: "sections",
        populate: {
          path: "lectures", // Populate user in reviews
          model: "Lecture",
          select:
            "-notifications -password -__v -courses -reviews -createdAt -updatedAt -emailVerified -emailVerifyCode -isActive -isLocked -uploadedCourses -enrolledCourses",
        },
      })
      .populate("instructor");
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
        .send(failure("Please provide instructor id"));
    }
    const courses = await Course.find({ instructor: req.params.id }).populate(
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

// const getUserCourseTransactionStatistcs = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide user id"));
//     }
//     const userId = req.params.id;
//     const { filter } = req.query;
//     // Get the current date
//     const currentDate = new Date();

//     // Define filter logic
//     let filterCondition = {};
//     if (filter === "weekly") {
//       const oneWeekAgo = new Date();
//       oneWeekAgo.setDate(currentDate.getDate() - 7);
//       filterCondition = { createdAt: { $gte: oneWeekAgo } };
//     } else if (filter === "monthly") {
//       const oneMonthAgo = new Date();
//       oneMonthAgo.setMonth(currentDate.getMonth() - 1);
//       filterCondition = { createdAt: { $gte: oneMonthAgo } };
//     } else if (filter === "yearly") {
//       const oneYearAgo = new Date();
//       oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
//       filterCondition = { createdAt: { $gte: oneYearAgo } };
//     }

//     // Find the user and their uploaded courses
//     const user = await User.findById(userId).populate({
//       path: "uploadedCourses",
//       match: filterCondition, // Apply the filter condition
//     });

//     if (!user) {
//       return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
//     }

//     const uploadedCourses = user.uploadedCourses;

//     // Calculate total enrolled students and total sales amount
//     let totalEnrolledStudents = 0;
//     let totalSalesAmount = 0;

//     uploadedCourses.forEach((course) => {
//       const enrolledCount = course.enrolledStudents.length;
//       totalEnrolledStudents += enrolledCount;
//       totalSalesAmount += enrolledCount * course.price;
//     });

//     return res.status(200).send(
//       success("Successfully retrieved user course statistics", {
//         totalEnrolledStudents,
//         totalSalesAmount,
//         uploadedCoursesCount: uploadedCourses.length,
//       })
//     );
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error fetching user course statistics", error.message));
//   }
// };

// const getUserCourseTransactionStatistcs = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide user id"));
//     }
//     const userId = req.params.id;
//     const { filter } = req.query; // Query parameter for filtering (e.g., "weekly", "monthly", "yearly")

//     const currentDate = new Date();

//     // Find the user and their uploaded courses
//     const user = await User.findById(userId).populate({
//       path: "uploadedCourses",
//       populate: {
//         path: "enrolledStudents",
//         model: "User",
//         select:
//           "-password -__v -courses -reviews -createdAt -updatedAt -emailVerified -emailVerifyCode -isActive -isLocked -uploadedCourses -enrolledCourses",
//       },
//     });

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     const uploadedCourses = user.uploadedCourses;
//     console.log("uploadedCourses", uploadedCourses);

//     // Helper function to calculate total sales for a specific date range
//     const calculateSales = (startDate, endDate) => {
//       let totalSales = 0;

//       uploadedCourses.forEach((course) => {
//         course.enrolledStudents.forEach((enrollmentDate) => {
//           const enrolledDate = new Date(enrollmentDate);
//           if (enrolledDate >= startDate && enrolledDate <= endDate) {
//             totalSales += course.price;
//           }
//         });
//       });

//       return totalSales;
//     };

//     let responseData = [];

//     if (filter === "weekly") {
//       // Get the start of the current week
//       const startOfWeek = new Date(currentDate);
//       startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday is the start of the week

//       for (let i = 0; i < 7; i++) {
//         const dayStart = new Date(startOfWeek);
//         dayStart.setDate(startOfWeek.getDate() + i);

//         const dayEnd = new Date(dayStart);
//         dayEnd.setHours(23, 59, 59, 999);

//         responseData.push({
//           day: dayStart.toLocaleDateString(),
//           totalSalesAmount: calculateSales(dayStart, dayEnd),
//         });
//       }
//     } else if (filter === "monthly") {
//       // Get the start of the current month
//       const startOfMonth = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1
//       );
//       const daysInMonth = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0
//       ).getDate();

//       for (let i = 1; i <= daysInMonth; i++) {
//         const dayStart = new Date(
//           currentDate.getFullYear(),
//           currentDate.getMonth(),
//           i
//         );
//         const dayEnd = new Date(dayStart);
//         dayEnd.setHours(23, 59, 59, 999);

//         responseData.push({
//           day: dayStart.toLocaleDateString(),
//           totalSalesAmount: calculateSales(dayStart, dayEnd),
//         });
//       }
//     } else if (filter === "yearly") {
//       // Get the start of the current year
//       const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

//       for (let i = 0; i < 12; i++) {
//         const monthStart = new Date(currentDate.getFullYear(), i, 1);
//         const monthEnd = new Date(currentDate.getFullYear(), i + 1, 0); // Last day of the month

//         responseData.push({
//           month: monthStart.toLocaleString("default", { month: "long" }),
//           totalSalesAmount: calculateSales(monthStart, monthEnd),
//         });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Successfully retrieved user course statistics",
//       filter,
//       data: responseData,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const getInstructorTransactions = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { period = "monthly" } = req.query;

    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      return res
        .status(404)
        .json({ success: false, message: "Instructor not found" });
    }

    const courses = await Course.find({ instructor: instructorId }).populate(
      "enrolledStudents",
      "_id"
    );
    if (!courses || courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No courses found for this instructor",
      });
    }

    const courseIds = courses.map((course) => course._id);
    const enrolledStudentIds = courses.flatMap((course) =>
      course.enrolledStudents.map((student) => student._id)
    );

    const startDate = new Date();
    const endDate = new Date();
    let format = "monthly";

    if (period === "weekly") {
      startDate.setDate(startDate.getDate() - 7);
      format = "weekly";
    } else if (period === "yearly") {
      startDate.setFullYear(startDate.getFullYear() - 1);
      format = "yearly";
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const transactions = await Transaction.find({
      course: { $in: courseIds },
      user: { $in: enrolledStudentIds },
      date: { $gte: startDate, $lte: endDate },
      status: "paid",
    });

    let data;

    if (period === "yearly") {
      data = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2025, i).toLocaleString("default", { month: "long" }),
        totalSalesAmount: 0,
      }));
      transactions.forEach((transaction) => {
        const monthIndex = new Date(transaction.date).getMonth();
        data[monthIndex].totalSalesAmount += transaction.amount;
      });
    } else if (period === "weekly") {
      const days = Array.from({ length: 7 }, (_, i) => {
        const day = new Date();
        day.setDate(endDate.getDate() - i);
        return {
          day: day.toLocaleDateString(),
          totalSalesAmount: 0,
        };
      }).reverse();
      transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date).toLocaleDateString();
        const dayData = days.find((day) => day.day === transactionDate);
        if (dayData) {
          dayData.totalSalesAmount += transaction.amount;
        }
      });
      data = days;
    } else if (period === "monthly") {
      const daysInMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        0
      ).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => ({
        day: new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          i + 1
        ).toLocaleDateString(),
        totalSalesAmount: 0,
      }));
      transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date).toLocaleDateString();
        const dayData = days.find((day) => day.day === transactionDate);
        if (dayData) {
          dayData.totalSalesAmount += transaction.amount;
        }
      });
      data = days;
    }

    res.status(200).json({
      success: true,
      message: "Successfully retrieved user course statistics",
      filter: period,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
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
        categories: categories.map((category) => ({
          courseCategory: category._id,
          count: category.count,
        })),
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
  getAllCoursesByCategory,
  getCourseById,
  getCourseByInstructorId,
  // getUserCourseTransactionStatistcs,
  getInstructorTransactions,
  updateCourseById,
  deleteCourseById,
  toggleEnableDisableCourse,
  toggleApproveCancelCourse,
  getAllCategories,
};
