import transporter from "./emailConfig.js";
import { Verification_Email_Template, Welcome_Email_Template } from "./EmailTemplate.js";

export const sendVerificationEmail = async (toEmail, verificationCode) => {
    try {
        const info = await transporter.sendMail({
            from: `"ChatX" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Verify Your Email",
            text: `Your verification code is: ${verificationCode}`, // plain‑text body
            html: Verification_Email_Template.replace('{verificationCode}', verificationCode),
        });
    } catch (error) {
        console.log("Error sending Email:", error)
    }
}
export const sendWelcomeEmail = async (name, toEmail) => {
    try {
        const info = await transporter.sendMail({
            from: `"ChatX" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Welcome to ChatX",
            text: `Welcome to ChatX! We're glad to have you on board.`, // plain‑text body
            html: Welcome_Email_Template.replace('{name}', name),
        });
    } catch (error) {
        console.log("Error sending Email:", error)
    }
}