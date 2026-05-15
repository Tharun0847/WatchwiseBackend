const axios = require('axios');

/**
 * Sends an email using the Brevo (Sendinblue) API
 * Bypasses Render's SMTP block using Port 443 (HTTPS)
 */
const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY; // Support both names
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set in Render environment variables.");
  }

  const data = {
    sender: { email: fromEmail, name: "WatchWise" },
    to: [{ email: options.email }],
    subject: options.subject,
    textContent: options.message,
    htmlContent: options.html || options.message,
  };

  try {
    console.log(`Attempting to send email to ${options.email} via Brevo API...`);
    
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log("Email sent successfully via Brevo API!");
    return response.data;
  } catch (error) {
    const errorData = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error("Brevo API Error Details:", errorData);
    
    if (error.response && error.response.status === 401) {
      throw new Error("Brevo Authentication Failed: Your API Key is invalid.");
    }

    throw new Error(`Email Service Error: ${errorData}`);
  }
};

module.exports = sendEmail;
