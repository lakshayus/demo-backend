const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === "true", // true = 465, false = 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false, // for self-signed certs
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log("✅ Email service connected successfully");
    } catch (error) {
      console.error("❌ Error initializing email service:", error.message);
    }
  }

  // Send demo confirmation email to user
  async sendDemoConfirmation(demoRequest) {
    try {
      if (!this.transporter || !demoRequest.email) return;

      const subject = `Demo Request Confirmed - Framtt Car Rental Management`;

      const textContent = `
Hi${demoRequest.name ? ` ${demoRequest.name}` : ""},

We've received your demo request for our car rental management platform.

Request Details:
- Type: ${this.formatRequestType(demoRequest.type)}
- Request ID: ${demoRequest.requestId}
${demoRequest.moduleId ? `- Module: ${this.formatModuleName(demoRequest.moduleId)}\n` : ""}
- Submitted: ${new Date(demoRequest.createdAt).toLocaleString()}

Our team will contact you shortly!

Thanks, 
Framtt Team
      `;

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: demoRequest.email,
        subject,
        text: textContent,
        html: `<h2>Thank you for your interest in Framtt!</h2>
               <p>Your request <b>${demoRequest.requestId}</b> has been received.</p>
               <p>Our team will contact you within 24 hours.</p>`,
      });

      console.log(`📩 Demo confirmation email sent to ${demoRequest.email}`);
    } catch (error) {
      console.error("❌ Error sending demo confirmation email:", error.message);
    }
  }

  // Send demo notification email to sales team
  async sendDemoNotification(demoRequest) {
    try {
      if (!this.transporter) return;

      const subject = `New Demo Request - ${this.formatRequestType(
        demoRequest.type
      )} - ${demoRequest.requestId}`;

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: process.env.SALES_EMAIL,
        subject,
        html: `<h2>🚨 New Demo Request</h2>
               <p><b>ID:</b> ${demoRequest.requestId}</p>
               <p><b>Name:</b> ${demoRequest.name}</p>
               <p><b>Email:</b> ${demoRequest.email}</p>
               <p><b>Company:</b> ${demoRequest.company || "N/A"}</p>`,
      });

      console.log("📩 Demo notification email sent to sales team");
    } catch (error) {
      console.error("❌ Error sending demo notification email:", error.message);
    }
  }

  // Helpers
  formatRequestType(type) {
    const types = {
      general: "General Demo Request",
      module: "Module-Specific Demo",
      full: "Full Platform Demo",
      pricing: "Pricing Information Request",
    };
    return types[type] || "Demo Request";
  }

  formatModuleName(moduleId) {
    const modules = {
      analytics: "Revenue & Analytics Dashboard",
      communication: "Smart Customer Communication",
      tracking: "Live Vehicle Tracking",
      whatsapp: "WhatsApp Booking Integration",
      marketing: "AI Marketing Optimization",
      booking: "Smart Booking Engine",
    };
    return modules[moduleId] || moduleId;
  }

  formatTimeline(timeline) {
    const timelines = {
      immediately: "Immediately",
      "1_month": "Within 1 month",
      "3_months": "Within 3 months",
      "6_months": "Within 6 months",
      "1_year": "Within 1 year",
    };
    return timelines[timeline] || timeline;
  }
}

module.exports = new EmailService();
