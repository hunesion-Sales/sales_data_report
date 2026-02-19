import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// Configure Nodemailer with Gmail SMTP
// Note: User needs to set env vars: SMTP_EMAIL and SMTP_PASSWORD (App Password)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

export const sendAdminNotification = functions.auth.user().onCreate(async (user: functions.auth.UserRecord) => {
    const { email, displayName, uid } = user;
    functions.logger.info(`New user created: ${email} (${uid})`);

    try {
        // 1. Find all admin users
        const adminSnapshot = await db.collection("users")
            .where("role", "==", "admin")
            .get();

        if (adminSnapshot.empty) {
            functions.logger.warn("No admin users found to notify.");
            return;
        }

        const adminEmails = adminSnapshot.docs
            .map(doc => doc.data().email)
            .filter(email => email); // Filter out undefined/null

        if (adminEmails.length === 0) {
            functions.logger.warn("No admin emails found.");
            return;
        }

        // 2. Send email to admins
        const mailOptions = {
            from: `"Sales Report App" <${process.env.SMTP_EMAIL || "noreply@hunesion.com"}>`,
            to: adminEmails.join(","), // Send to all admins
            subject: `[New User Signup] ${displayName || "Unknown"} (${email})`,
            html: `
        <h2>New User Signup Request</h2>
        <p>A new user has registered and is pending approval.</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Name:</strong> ${displayName || "N/A"}</li>
          <li><strong>UID:</strong> ${uid}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Please log in to the <a href="https://hunesalesreport.web.app/admin/users">Admin Dashboard</a> to approve this user.</p>
      `,
        };

        await transporter.sendMail(mailOptions);
        functions.logger.info(`Notification email sent to ${adminEmails.length} admins.`);

    } catch (error) {
        functions.logger.error("Error sending admin notification:", error);
    }
});
