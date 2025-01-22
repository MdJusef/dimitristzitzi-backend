const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const Appointment = require("../model/appointment.model");
const Course = require("../model/course.model");
const User = require("../model/user.model");
const Service = require("../model/service.model");
const Transaction = require("../model/transaction.model");
const HTTP_STATUS = require("../constants/statusCodes");
const { success, failure } = require("../utilities/common");
const { emailWithNodemailerGmail } = require("../config/email.config");
const mongoose = require("mongoose");

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

    console.log("user", user);
    console.log("user.enrolledCourses", user.enrolledCourses);

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

const getUserCourseTransactions = async (req, res) => {
  try {
    if (!req.params.userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide userId" });
    }
    const { userId } = req.params;
    // const userId = req.user.id;

    // Find the user and their uploaded courses
    const user = await User.findById(userId).select("uploadedCourses");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const uploadedCourseIds = user.uploadedCourses;
    // const uploadedCourseIds = [
    //   new mongoose.Types.ObjectId("6778cff579a63bc07b38f7e7"),
    // ];

    if (!uploadedCourseIds.length) {
      return res.status(200).json({
        success: true,
        message: "No uploaded courses found for this user.",
        transactions: [],
      });
    }

    console.log("uploadedCourseIds", uploadedCourseIds);

    const transactions = await Transaction.find({
      course: { $in: uploadedCourseIds },
      // status: "paid",
    }).populate("course", "title");

    console.log("transactions", transactions);

    if (!transactions.length) {
      return res.status(200).json({
        success: true,
        message: "No transactions found for the uploaded courses.",
        transactions: [],
      });
    }

    const formattedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        let paymentMethod = "Unknown"; // Default payment method fallback

        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            transaction.paymentId
          );

          // Extract payment method type directly if no charge exists
          if (paymentIntent.latest_charge) {
            const charge = await stripe.charges.retrieve(
              paymentIntent.latest_charge
            );
            paymentMethod = charge.payment_method_details?.type || "Unknown";
          } else if (paymentIntent.payment_method_types?.length) {
            paymentMethod = paymentIntent.payment_method_types[0];
          }
        } catch (error) {
          console.error(
            `Error fetching payment details for paymentId: ${transaction.paymentId}`,
            error.message
          );
        }

        return {
          date: transaction.date,
          method: paymentMethod,
          amount: transaction.amount,
          status: transaction.status,
          courseTitle: transaction.course?.title || "Unknown Course",
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Successfully retrieved course transactions.",
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getTransactionByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query;
    const periods = {
      weekly: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      monthly: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      yearly: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    };
    const transactionQuery = { user: userId };
    if (period && Object.keys(periods).includes(period)) {
      transactionQuery.date = periods[period];
    } else {
      transactionQuery.date = periods.monthly;
    }

    const transactions = await Transaction.find(transactionQuery);
    if (!transactions) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Transactions not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Transactions retrieved successfully", transactions));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Transactions failed", err.message));
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    if (!transactions) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Transactions not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Transactions retrieved successfully", transactions));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Transactions failed", err.message));
  }
};

// const getAllTransactionsByInstructorId = async();

const saveCard = async (req, res) => {
  try {
    const { email, token } = req.body;
    // Create or retrieve the customer
    let customer = await stripe.customers.create({
      email, // Replace with your logic
    });

    console.log("customer", customer);

    if (!customer) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Customer could not be created"));
    }

    // Attach the card to the customer
    const card = await stripe.customers.createSource(customer.id, {
      source: token,
    });

    console.log("card", card);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Card saved successfully", { customerId: customer.id }));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Card failed", err.message));
  }
};

const confirmPaymentUsingSavedCard = async (req, res) => {
  const { customerId, amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: "usd",
      customer: customerId,
      off_session: true,
      confirm: true,
    });

    console.log("paymentIntent", paymentIntent);

    if (!paymentIntent) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("payment intent could not be created"));
    }

    return res.status(HTTP_STATUS.OK).send(
      success("payment completed using saved card", {
        paymentIntent: paymentIntent,
      })
    );
  } catch (error) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Card failed", err.message));
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  getAllPaymentIntents,
  confirmPaymentbyPaymentIntent,
  getAllTransactions,
  getTransactionByUserId,
  saveCard,
  confirmPaymentUsingSavedCard,
  getUserCourseTransactions,
};
