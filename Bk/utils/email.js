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
    // Using googlemail.com alias as it sometimes bypasses basic firewall filters
    config = {
      host: 'smtp.googlemail.com', 
      port: 465,
      secure: true, // Switching back to 465 with secure:true for this attempt
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    };
  } else {
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
    family: 4, 
    autoSelectFamily: false, // CRITICAL: Prevents Node 18+ from falling back to IPv6
    logger: true,
    debug: true,
    tls: {
      rejectUnauthorized: false,
      servername: config.host // Ensures the handshake matches the host
    },
    connectionTimeout: 30000, 
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  const mailOptions = {
    from: `"WatchWise" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    console.log(`Attempting to send email to ${options.email} via ${config.host} on port ${config.port}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully! Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Detailed Nodemailer Error:", {
      code: error.code,
      message: error.message,
      command: error.command,
      stack: error.stack
    });

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.code === 'ESOCKET' || error.code === 'ENETUNREACH') {
      throw new Error("Render Firewall Block: Render is blocking your connection to Gmail. You must contact Render Support to unblock Port 465/587 or use an API-based service like SendGrid/Mailgun.");
    }

    throw error;
  }
};

module.exports = sendEmail;
