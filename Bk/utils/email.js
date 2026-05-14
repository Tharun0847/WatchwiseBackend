const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const missing = [];
    if (!process.env.EMAIL_USER) missing.push("EMAIL_USER");
    if (!process.env.EMAIL_PASS) missing.push("EMAIL_PASS");
    throw new Error(`Email credentials missing: ${missing.join(', ')}`);
  }

  // 1. Force use Port 465 for SSL/TLS (More stable on Render)
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = 465; // Changed from 587 to 465

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Essential for cloud providers to prevent handshake failures
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 20000, // Increased to 20 seconds
    greetingTimeout: 20000,
    socketTimeout: 20000,
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
    
    // Provide a more helpful error for common timeout issues
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      throw new Error("The connection to the email server timed out. This is often caused by a firewall or network restriction on the hosting provider.");
    }
    
    throw error;
  }
};

module.exports = sendEmail;
