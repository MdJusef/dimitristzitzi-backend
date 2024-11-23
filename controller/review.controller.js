const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const { failure, success } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Review = require("../model/review.model");
const User = require("../model/user.model");
const Course = require("../model/course.model");

const addReview = async (req, res) => {
  try {
    const { review, rating, userId, courseId } = req.body;

    if (!review || !rating || !userId || !courseId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("All fields are required"));
    }

    const course = await Course.findById({ _id: courseId });

    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Course with ID was not found"));
    }

    const reviewExists = await Review.findOne({
      course: courseId,
      user: userId,
      isDeleted: false,
    });

    if (reviewExists) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Same user cannot review twice"));
    }

    const user = await User.findById({ _id: userId });

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User with ID was not found"));
    }

    const newReview = await Review.create({
      user: userId,
      course: courseId,
      review,
      rating,
    });

    if (!newReview) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Internal server error"));
    }

    // Ensure course.averageRating and course.reviewCount are initialized
    const currentAverage = course.averageRating || 0;
    const currentCount = course.reviewCount || 0;

    console.log("rating", rating);
    console.log("currentAverage", currentAverage);
    console.log("currentCount", currentCount);

    console.log("rating type", typeof rating);
    console.log("currentAverage type", typeof currentAverage);
    console.log("currentCount type", typeof currentCount);

    course.reviews.push(newReview._id);
    course.averageRating = parseFloat(
      (
        (currentAverage * currentCount + Number(rating)) /
        (currentCount + 1)
      ).toFixed(1)
    );
    console.log("course.averageRating", course.averageRating);
    course.reviewCount = currentCount + 1;
    await course.save();

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Added review successfully", newReview));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getAllWebsiteReviews = async (req, res) => {
  try {
    const reviews = await Review.find({});

    if (reviews) {
      return res
        .status(HTTP_STATUS.OK)
        .send(success("all reviews fetched successfully", reviews));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(failure("reviews could not be fetched"));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const getReviewByReviewId = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review could not be fetched"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("review fetched successfully", review));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const getReviewByUserId = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("All fields are required"));
    }

    const review = await Review.findOne({ userId });
    if (!review) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review could not be fetched"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("review fetched successfully", review));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const editReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const { review, rating, userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("userId and courseId are required"));
    }

    if (!reviewId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("reviewId is required"));
    }

    const course = await Course.findById({ _id: courseId });

    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Course with ID was not found"));
    }

    const reviewExists = await Review.findOne({
      _id: reviewId,
      course: courseId,
      user: userId,
    });

    if (!reviewExists) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review not found"));
    }

    const user = await User.findById({ _id: userId });

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User with ID was not found"));
    }

    reviewExists.review = review || reviewExists.review;
    reviewExists.rating = rating || reviewExists.rating;

    await reviewExists.save();

    // Ensure course.averageRating and course.reviewCount are initialized
    const currentAverage = course.averageRating || 0;
    const currentCount = course.reviewCount || 0;

    console.log("rating", rating);
    console.log("currentAverage", currentAverage);
    console.log("currentCount", currentCount);

    console.log("rating type", typeof rating);
    console.log("currentAverage type", typeof currentAverage);
    console.log("currentCount type", typeof currentCount);

    if (rating) {
      course.averageRating = parseFloat(
        (
          (currentAverage * currentCount + Number(rating)) /
          (currentCount + 1)
        ).toFixed(1)
      );
      console.log("course.averageRating", course.averageRating);
      await course.save();
    }

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("review edited successfully", reviewExists));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("courseId is required"));
    }
    if (!reviewId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("reviewId is required"));
    }

    const review = await Review.findById({ _id: reviewId });

    if (!review) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review could not be deleted"));
    }

    const course = await Course.findById({ _id: courseId });

    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }

    review.isDeleted = true;
    await review.save();

    const currentAverage = course.averageRating || 0;
    const currentCount = course.reviewCount || 0;

    course.averageRating = parseFloat(
      (
        (currentAverage * currentCount - review.rating) /
        (currentCount - 1)
      ).toFixed(1)
    );
    course.reviewCount = currentCount - 1;

    await course.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("review deleted successfully", review));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

module.exports = {
  addReview,
  getAllWebsiteReviews,
  getReviewByUserId,
  getReviewByReviewId,
  editReview,
  deleteReview,
};
