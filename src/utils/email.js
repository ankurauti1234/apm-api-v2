import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";

// EMAIL_USER=personalauthentication@gmail.com
// EMAIL_PASS=hqzy mehf gxfw mhin%  

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "personalauthentication@gmail.com",
    pass: "hqzy mehf gxfw mhin",
  },
});

transporter.use(
  "compile",
  hbs({
    viewEngine: {
      extName: ".hbs",
      partialsDir: path.resolve("./views/email/"),
      layoutsDir: path.resolve("./views/email/"),
      defaultLayout: false,
    },
    viewPath: path.resolve("./views/email/"),
    extName: ".hbs",
  })
);

export const sendInviteEmail = async (email, firstname, inviteToken, tempPassword, otp) => {
  const dashboardUrl = `${process.env.APP_URL}/activate?token=${inviteToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome - Account Activation",
    template: "invite",
    context: {
      firstname,
      email,
      tempPassword,
      otp,
      dashboardUrl,
    },
  };

  return await transporter.sendMail(mailOptions);
};