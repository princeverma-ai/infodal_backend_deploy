//imports ----------------------------------------------------->
const nodemailer = require("nodemailer");

//Exports ---------------------------------------------------->
exports.sendEmail = async (options) => {
  try {
    // create transporter object using the SMTP transport
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, //user
        pass: process.env.EMAIL_PASS, //password
      },
    });
    if (process.env.NODE_ENV === "production") {
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: `"${process.env.DOMAIN_OWNER_NAME}" <${process.env.DOMAIN_EMAIL}>`, // sender address
        to: `${options.recipientEmail}`, // list of receivers
        subject: `${options.subject}`, // Subject line
        text: `${options.text}`, // plain text body
        html: `${options.html}`, // html body
      });

      console.log(`Email Sent to : ${options.recipientEmail}`);

      return info;
    }
  } catch (err) {
    cosole.log(`Cannot Send Emai to : ${options.recipientEmail}`);
    console.log(err);
    return null;
  }
};
