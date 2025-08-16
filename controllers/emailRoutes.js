
const express = require('express');
const router = express.Router();
const EmailService = require('../services/emailService');

const emailService = new EmailService();

// Test route to send email
router.post('/send-demo-email', async (req, res) => {
  try {
    const demoRequest = {
      email: req.body.email,          // frontend से email आएगा
      name: req.body.name || "User",  // optional
      type: "demo",
      requestId: "REQ" + Date.now(),
      createdAt: new Date()
    };

    await emailService.sendDemoConfirmation(demoRequest);

    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

module.exports = router;