const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Validation check for credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const missing = [];
    if (!process.env.EMAIL_USER) missing.push("EMAIL_USER");
    if (!process.env.EMAIL_PASS) missing.push("EMAIL_PASS");
    throw new Error(`Email credentials missing in Environment: ${missing.join(', ')}`);
  }

  let transporterConfig = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // 2. Specialized Gmail handling or generic SMTP
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  
  if (host.includes('gmail')) {
    transporterConfig.service = 'gmail';
  } else {
    transporterConfig.host = host;
    transporterConfig.port = parseInt(process.env.EMAIL_PORT) || 587;
    transporterConfig.secure = transporterConfig.port === 465;
  }

  const transporter = nodemailer.createTransport({
    ...transporterConfig,
    tls: {
      // Must be false for many shared hosting/cloud environments
      rejectUnauthorized: false 
    },
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  const mailOptions = {
    from: `"WatchWise" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Nodemailer Error Details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error; 
  }
};

module.exports = sendEmail;
