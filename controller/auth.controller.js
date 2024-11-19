const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { success, failure, generateRandomCode } = require("../utilities/common");
const User = require("../model/user.model");
const Notification = require("../model/notification.model");
const HTTP_STATUS = require("../constants/statusCodes");
const { emailWithNodemailerGmail } = require("../config/email.config");

const signup = async (req, res) => {
  try {
    const validation = validationResult(req).array();
    console.log(validation);
    if (validation.length) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to add the user", validation[0].msg));
    }

    // if (req.body.role === "admin") {
    //   return res
    //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    //     .send(failure(`Admin cannot be signed up`));
    // }

    const emailCheck = await User.findOne({ email: req.body.email });

    if (emailCheck && !emailCheck.emailVerified) {
      const emailVerifyCode = generateRandomCode(4);
      emailCheck.emailVerifyCode = emailVerifyCode;
      await emailCheck.save();

      const emailData = {
        email: emailCheck.email,
        subject: "Account Activation Email",
        html: `
                      <h1>Hello, ${emailCheck?.name || "User"}</h1>
                      <p>Your email verification code is <h3>${emailVerifyCode}</h3> to verify your email</p>
                      
                    `,
      };
      emailWithNodemailerGmail(emailData);

      return res
        .status(HTTP_STATUS.OK)
        .send(success("Please verify your email"));
    }

    if (emailCheck) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`User with email: ${req.body.email} already exists`));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const emailVerifyCode = generateRandomCode(4);

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role,
      emailVerifyCode,
    });

    // payload, secret, JWT expiration
    // const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {
    //     expiresIn: process.env.JWT_EXPIRES_IN
    // })

    const emailData = {
      email: req.body.email,
      subject: "Account Activation Email",
      html: `
                  <h1>Hello, ${newUser?.name || "User"}</h1>
                  <p>Your email verification code is <h3>${emailVerifyCode}</h3> to verify your email</p>
                  
                `,
    };

    emailWithNodemailerGmail(emailData);

    const token = jwt.sign(newUser.toObject(), process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.setHeader("Authorization", token);
    if (newUser) {
      return res
        .status(HTTP_STATUS.OK)
        .send(success("Account created successfully ", { newUser, token }));
    }
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Account couldnt be created"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const signupAsInstructor = async (req, res) => {
  try {
    const validation = validationResult(req).array();
    if (validation.length) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to add the user", validation[0].msg));
    }
    // if (!req.body.email || !req.body.password) {
    //   return res
    //     .status(HTTP_STATUS.BAD_REQUEST)
    //     .send(failure("please provide mail and password"));
    // }

    const emailCheck = await User.findOne({ email: req.body.email });

    const admin = await User.findOne({ role: "admin" });

    // if (!admin) {
    //   return res.status(HTTP_STATUS.NOT_FOUND).send(failure("Admin not found"));
    // }

    if (emailCheck && emailCheck.instructorApplicationStatus === "pending") {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(
          failure(
            `${req.body.email} has already applied for the instructor's position`
          )
        );
    }

    if (
      emailCheck &&
      (emailCheck.isInstructor === true ||
        emailCheck.instructorApplicationStatus === "approved")
    ) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`${req.body.email} is already an instructor`));
    }

    if (emailCheck) {
      emailCheck.instructorApplicationStatus = "pending";
      await emailCheck.save();

      const emailVerifyCode = generateRandomCode(4);
      emailCheck.emailVerifyCode = emailVerifyCode;
      await emailCheck.save();

      if (!emailCheck.emailVerified) {
        const emailData = {
          email: emailCheck.email,
          subject:
            "Account Activation & instructor Application Successful Email",
          html: `
                  <h1>Hello, ${emailCheck?.name || "User"}</h1>
                  <p>Congrats, you have successfully applied for the instructor's position</p>
                  <p>Your email verification code is <strong>${emailVerifyCode}</strong></p>
                `,
        };
        emailWithNodemailerGmail(emailData);
      }

      const newNotification = await Notification.create({
        applicant: emailCheck._id,
        admin: admin._id || null,
        status: "pending",
        message: `${emailCheck.email} has applied for the instructor role.`,
      });

      if (!newNotification) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .send(failure("Could not send notification"));
      }

      emailCheck.notifications.push(newNotification._id);
      await emailCheck.save();

      if (admin) {
        admin.notifications.push(newNotification._id);
        await admin.save();
      }

      return res
        .status(HTTP_STATUS.OK)
        .send(
          success("You have successfully applied for the instructor's position")
        );
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      instructorApplicationStatus: "pending",
    });

    if (!newUser) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Account couldnt be created"));
    }

    const emailVerifyCode = generateRandomCode(4);
    newUser.emailVerifyCode = emailVerifyCode;
    await newUser.save();
    const emailData = {
      email: req.body.email,
      subject: "Account Activation & instructor Application Successful Email",
      html: `
      <h1>Hello, ${req.body.name || "User"}</h1>
      <p>Congrats, you have successfully applied for the doctor's position</p>
      <p>Your email verification code is <h6>${emailVerifyCode}</h6></p>
      `,
    };
    emailWithNodemailerGmail(emailData);

    const newNotification = await Notification.create({
      applicant: newUser._id,
      admin: admin._id || null,
      status: "pending",
      message: `${newUser.email} has applied for the instructor role.`,
    });

    if (!newNotification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Could not send notification"));
    }

    newUser.notifications.push(newNotification._id);
    await newUser.save();

    if (admin) {
      admin.notifications.push(newNotification._id);
      await admin.save();
    }

    res
      .status(HTTP_STATUS.OK)
      .send(
        success(
          "Account created successfully & applied for instructor's position",
          { user: newUser }
        )
      );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, emailVerifyCode } = req.body;
    if (!email || !emailVerifyCode) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email and verification code"));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not exist"));
    }

    if (user.emailVerifyCode !== emailVerifyCode) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Invalid verification code"));
    }

    user.emailVerified = true;
    user.emailVerifyCode = null;
    await user.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Email verified successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const approveInstructor = async (req, res) => {
  try {
    const { instructorId } = req.body; // instructorId of the user who applied

    if (!instructorId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide instructorId"));
    }

    if (!req.user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized! Admin access only"));
    }

    const instructor = await User.findById(instructorId);
    const admin = await User.findOne({ email: req.user.email });

    if (!admin) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized! Admin not found"));
    }

    if (!instructor) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not exist"));
    }

    if (!instructor.role.includes("instructor")) {
      instructor.role.push("instructor");
    }

    instructor.instructorApplicationStatus = "approved";
    instructor.isInstructor = true;

    await instructor.save();

    const emailData = {
      email: instructor.email,
      subject: "Application Approved - Welcome to Our Platform!",
      html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h5 style="color: #4CAF50;">Congratulations, ${
                  instructor.name || "User"
                }!</h5>
                <p>We are pleased to inform you that your application to join our platform as an instructor has been <strong>approved</strong>.</p>
                
                <p>Thank you for choosing to collaborate with us, and we look forward to working with you to provide top-notch teaching services to our learners.</p>
                
                <p>Below are some important next steps to get started:</p>
                <ul>
                  <li>Complete your profile in the instructor’s portal.</li>
                  <li>Review our policies and guidelines.</li>
                </ul>

                <p>If you have any questions, feel free to reach out to us at any time.</p>

                <p>Sincerely,<br/>
                <strong>pantognostis</strong><br/>
                <a href="mailto:support@pantognostis.com">support@pantognostis.com</a></p>
              </body>
            </html>
          `,
    };
    emailWithNodemailerGmail(emailData);

    // Create a new notification for the admin doctor
    const newNotification = await Notification.create({
      applicant: instructor._id,
      admin: admin._id,
      status: "approved",
      message: `your application has been approved.`,
    });

    if (!newNotification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Could not send notification"));
    }

    instructor.notifications.push(newNotification._id);
    await instructor.save();

    admin.notifications.push(newNotification._id);
    await admin.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Instructor application approved", instructor));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to approve instructor", err));
  }
};

const cancelInstructor = async (req, res) => {
  try {
    const { instructorId } = req.body;

    if (!instructorId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide instructorId"));
    }

    if (!req.user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized! Admin access only"));
    }

    const instructor = await User.findById(instructorId);
    const admin = await User.findOne({ email: req.user.email });

    if (!instructor) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User not found"));
    }

    if (!admin) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized! Admin not found"));
    }

    if (
      instructor.instructorApplicationStatus === "cancelled" ||
      instructor.instructorApplicationStatus === "notApplied"
    ) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User did not apply for instructor's position yet"));
    }

    instructor.instructorApplicationStatus = "cancelled";
    instructor.isInstructor = false;
    instructor.role = "user";

    const emailData = {
      email: instructor.email,
      subject: "Application Status - Instructor Application",
      html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #f44336;">Dear Dr. ${
                instructor.name || "User"
              },</h2>
              <p>We regret to inform you that after careful review, your application to join our platform as an instructor has been <strong>declined</strong> at this time.</p>
              
              <p>We appreciate your interest in collaborating with us. Unfortunately, we are unable to proceed with your application due to the current needs and requirements of our team.</p>
              
              <p>If you have any questions or would like further clarification, please do not hesitate to reach out. We encourage you to reapply in the future as new opportunities may become available.</p>

              <p>Thank you once again for your interest, and we wish you success in your future endeavors.</p>

              <p>Sincerely,<br/>
              <strong>Pantognostis</strong><br/>
              <a href="mailto:support@pantognostis.com">support@pantognostis.com</a></p>
            </body>
          </html>
                  `,
    };
    emailWithNodemailerGmail(emailData);

    await instructor.save();

    // Create a new notification for the admin doctor
    const newNotification = await Notification.create({
      applicant: instructor._id,
      admin: admin._id,
      status: "cancelled",
      message: `your application has been cancelled.`,
    });

    if (!newNotification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Could not send notification"));
    }

    instructor.notifications.push(newNotification._id);
    await instructor.save();

    admin.notifications.push(newNotification._id);
    await admin.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Doctor application cancelled", instructor));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to cancel doctor"));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // check if email & pass exist
    if (!email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide mail and password"));
    }

    // fetching the fields
    const user = await User.findOne({ email }).select(
      "+password -__v -isLocked -createdAt -updatedAt -instructorApplicationStatus -isInstructor -notifications -consultationHistory -consultationUpcoming -services -reviews"
    );

    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please register first"));
    }

    // object conversion
    const userObj = user.toObject();

    // when the user doesnt exist or pass dont match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("wrong email or password"));
    }

    // token
    const token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // deleting unnecessary fields
    user.password = undefined;
    delete userObj.password;
    delete userObj.__v;

    res.setHeader("Authorization", token);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Logged in successfully", { user, token }));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const loginAsInstructor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if email & pass exist
    if (!email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide mail and password"));
    }

    // fetching the fields
    const user = await User.findOne({ email }).select("+password");

    // object conversion
    const userObj = user.toObject();

    // when the user doesnt exist or pass dont match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("wrong email or password"));
    }

    if (user.instructorApplicationStatus === "pending") {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(
          failure("Your account is not approved yet. Please wait for approval")
        );
    }

    if (user.instructorApplicationStatus === "cancelled") {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(
          failure("Your request has been cancelled. Please try again later")
        );
    }

    // token
    const token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // deleting unnecessary fields
    user.password = undefined;
    delete userObj.password;
    delete userObj.wrongAttempts;
    delete userObj.isLocked;
    delete userObj.lockedTill;
    delete userObj.createdAt;
    delete userObj.updatedAt;
    delete userObj.__v;

    res.setHeader("Authorization", token);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Logged in successfully", { user, token }));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : null;
    if (!token) {
      // No token means user is not logged in
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("You are not logged in"));
    }
    console.log("after reset", res);
    return res.status(HTTP_STATUS.OK).send(success("Logged out successfully"));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Logout failed"));
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email"));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User with this email does not exist"));
    }

    const emailVerifyCode = generateRandomCode(4);

    user.emailVerifyCode = emailVerifyCode;
    user.emailVerified = false;
    await user.save();

    const emailData = {
      email,
      subject: "Password Reset Email",
      html: `
        <h6>Hello, ${user.name || "User"}</h6>
        <p>Your Email verification Code is <strong>${emailVerifyCode}</strong> to reset your password</p>
        <small>This Code is valid for 3 minutes</small>
      `,
    };
    await emailWithNodemailerGmail(emailData);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Verification code sent successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email, password and confirm password"));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User with this email does not exist"));
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Password and confirm password do not match"));
    }

    if (!user.emailVerified) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please verify your email first"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.emailVerifyCode = null;

    await user.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Password reset successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword, confirmPassword } = req.body;
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(
          failure(
            "Please provide email, old password, new password and confirm password"
          )
        );
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("New password and confirm password do not match"));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User with this email does not exist"));
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Old password is incorrect"));
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Password changed successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};
module.exports = {
  signup,
  signupAsInstructor,
  approveInstructor,
  cancelInstructor,
  login,
  loginAsInstructor,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
};
