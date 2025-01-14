const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const Appointment = require("../model/appointment.model");
const Course = require("../model/course.model");
const User = require("../model/user.model");
const Service = require("../model/service.model");
const Transaction = require("../model/transaction.model");
const HTTP_STATUS = require("../constants/statusCodes");
const { success, failure } = require("../utilities/common");
const { emailWithNodemailerGmail } = require("../config/email.config");

const createPaymentIntent = async (req, res) => {
  try {
    const { courseId, paymentMethodId, amount } = req.body;

    if (!courseId || !paymentMethodId || !amount) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide all the fields"));
    }

    // Fetch the appointment details
    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("course not found"));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in cents
      currency: "usd", // or your preferred currency
      payment_method: paymentMethodId,
      confirm: false, // Do not confirm automatically
    });

    if (!paymentIntent) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Payment failed"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payment processed successfully", paymentIntent));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Payment failed", err.message));
  }
};

const confirmPaymentbyPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId, courseId } = req.body;

    if (!paymentIntentId || !courseId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("please provide paymentIntent and courseId"));
    }

    // Retrieve the payment intent details from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Payment intent not found"));
    }

    const course = await Course.findById(courseId);
    const user = await User.findById(req.user._id);

    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Course not found"));
    }

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    // Update user's enrolled courses
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }

    // Update course's enrolled students
    if (!course.enrolledStudents.includes(user._id)) {
      course.enrolledStudents.push(user._id);
      await course.save();
    }

    // Create a new transaction
    const transaction = new Transaction({
      user: user._id,
      course: course._id,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: "paid",
    });
    await transaction.save();

    const emailData = {
      email: user.email,
      subject: "Course Purchase Successful",
      html: `
        <h2 style="color: #007BFF; text-align: center;">Course Purchase Confirmed</h2>
        <p>Dear <strong>${user.name || "user"}</strong>,</p>
        <p>Thank you for purchasing the course <strong>${
          course.title
        }</strong>.</p>
        <p>You now have full access to the course materials and content.</p>
        <p>Happy learning!</p>
        <p>Best regards,</p>
        <p><strong>Pantagnostis</strong></p>
      `,
    };

    emailWithNodemailerGmail(emailData);

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payment confirmed successfully", paymentIntent));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Payment failed", err.message));
  }
};

const getPaymentIntent = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    // console.log("paymentIntent", paymentIntent.status);
    if (!paymentIntent) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Payment not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payment retrieved successfully", paymentIntent));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Payment failed", err.message));
  }
};

const getAllPaymentIntents = async (req, res) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list();
    if (!paymentIntents) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Payment intents not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payment intents retrieved successfully", paymentIntents));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Payment intents failed", err.message));
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  getAllPaymentIntents,
  confirmPaymentbyPaymentIntent,
};
