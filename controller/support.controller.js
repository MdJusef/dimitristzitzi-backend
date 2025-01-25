const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const { emailToContactUs } = require("../config/email.config");

const sendMailToSupport = async (req, res) => {
  try {
    const { name, email, message, phoneNumber } = req.body;

    if (!name || !email || !message) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Name, email and message are required."));
    }

    const emailData = {
      email: email,
      subject: "Support Request",
      html: `
            <h3>Support Request</h3>
            <h4>Name: ${name}</h4>
            <p>Phone Number: ${phoneNumber}</p>
            <p>${message}</p>          
        `,
    };
    emailToContactUs(emailData);
    return res.status(HTTP_STATUS.OK).send(success("Email sent successfully"));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};
module.exports = {
  sendMailToSupport,
};
