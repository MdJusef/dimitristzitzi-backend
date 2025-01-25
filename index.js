const status = require("express-status-monitor");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const databaseConnection = require("./config/database");
const UserRouter = require("./routes/user.route");
const AuthRouter = require("./routes/auth.route");
const CourseRouter = require("./routes/course.route");
const SectionRouter = require("./routes/section.route");
const LectureRouter = require("./routes/lecture.route");
const AppointmentRouter = require("./routes/appointment.route");
const ChatRouter = require("./routes/chat.route");
const PaymentRouter = require("./routes/payment.route");
const ReviewRouter = require("./routes/review.route");
const termsOfServiceRouter = require("./routes/termsOfService.route");
const faqRouter = require("./routes/faq.route");
const tipRouter = require("./routes/tip.route");
const notificationRouter = require("./routes/notification.route");
const webinarRouter = require("./routes/webinar.route");
const supportRouter = require("./routes/support.route");

const app = express();

dotenv.config();

// const corsOptions = {
//     origin: "http://localhost:5173",
//     credentials: true,
// };

// app.use(cors(corsOptions));

app.use(cors({ origin: "*" }));

app.use(express.json()); // Parses data as JSON
app.use(express.text()); // Parses data as text
app.use(express.urlencoded({ extended: true })); // Parses data as urlencoded

// checks invalid json file
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).send({ message: "invalid json file" });
  }
  next();
});

const PORT = 5000;

app.use(status());

app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/users", UserRouter);
app.use("/users", AuthRouter);
app.use("/course", CourseRouter);
app.use("/section", SectionRouter);
app.use("/lecture", LectureRouter);
app.use("/appointment", AppointmentRouter);
app.use("/payment", PaymentRouter);
app.use("/chats", ChatRouter);
app.use("/review", ReviewRouter);
app.use("/terms-of-service", termsOfServiceRouter);
app.use("/faq", faqRouter);
app.use("/tip", tipRouter);
app.use("/notification", notificationRouter);
app.use("/webinar", webinarRouter);
app.use("/support", supportRouter);

// Route to handle all other invalid requests
app.use((req, res) => {
  return res.status(400).send({ message: "Route doesnt exist" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: "Internal Server Error" });
});

databaseConnection(() => {
  app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
  });
});
