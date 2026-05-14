const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Validation
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials (EMAIL_USER/EMAIL_PASS) are not set in environment variables.");
  }

  const isGmail = process.env.EMAIL_HOST?.includes('gmail') || process.env.EMAIL_USER?.includes('gmail');

  // 2. Transporter Configuration
  let config;
  if (isGmail) {
    // Gmail-specific "Magic" configuration
    config = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    };
  } else {
    // Generic SMTP
    config = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: process.env.EMAIL_PORT == 465 || !process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    };
  }

  const transporter = nodemailer.createTransport({
    ...config,
    pool: true, // Use connection pooling
    maxConnections: 1,
    maxMessages: 5,
    tls: {
      rejectUnauthorized: false // Often required on cloud hosting
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
    console.log(`Attempting to send email to ${options.email} via ${isGmail ? 'Gmail Service' : 'SMTP'}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully! Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Detailed Nodemailer Error:", {
      code: error.code,
      message: error.message,
      command: error.command,
      response: error.response,
      stack: error.stack
    });

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      throw new Error("Connection Timeout: The server took too long to respond. This is usually a network block by the hosting provider (Render) or the SMTP provider (Gmail). Try using Port 465 or verify your App Password.");
    }

    if (error.message.includes('Invalid login') || error.code === 'EAUTH') {
      throw new Error("Authentication Failed: Your EMAIL_USER or EMAIL_PASS (App Password) is incorrect.");
    }

    throw error;
  }
};

module.exports = sendEmail;
