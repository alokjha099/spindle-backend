const nodemailer = require("nodemailer");

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASSWORD, // Your Gmail app password
  },
});

// Function to send an email
const run = async (subject, body, toEmailId) => {
  const mailOptions = {
    from: process.env.GMAIL_USER, // Sender's email address
    to: toEmailId, // Recipient's email address
    subject: subject, // Email subject
    html: `<h1>${body}</h1>`, // Email body in HTML format
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

module.exports = { run };
