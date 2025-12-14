import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";    //for generating random tokens in reset password
import { generateToken } from "../utils/token.js";
import { sendResetPasswordEmail, sendVerificationEmail, sendWelcomeEmail } from "../middlewares/email.js";


const OTP_EXP_MINUTES = 1;
const RESET_TOKEN_EXP_MINUTES = 1;

export const registerUser = async (req, res) => {
    // Registration logic will go here

    const { email, password, name, avatar } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        //Create OTP CODE
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);   //1 minute from now
        //create new user
        if (!user) {
            user = new User({
                email,
                password,
                name,
                avatar: avatar || "",
                verificationCode,
                verificationCodeExpiresAt,
            });
        } else {
            // if user exists but not verified, update the details instead of creating new one
            user.name = name ?? user.name;
            user.avatar = avatar ?? user.avatar;
            user.verificationCode = verificationCode;
            user.verificationCodeExpiresAt = verificationCodeExpiresAt;
            user.password = password; // will be hashed below
        }

        //hash the password before saving to database
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        //save the user to database
        await user.save();
        await sendVerificationEmail(email, verificationCode);

        //gen token (JWT) logic will go here
        const token = generateToken(user);

        res.status(201).json({ success: true, message: "User registered successfully." });

    } catch (error) {
        console.log('error:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const loginUser = async (req, res) => {

    const { email, password } = req.body;
    try {
        //find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }
        //compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }
        // check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: "Please verify your email first" });
        }

        //gen token (JWT) logic will go here
        const token = generateToken(user);
        res.status(200).json({ success: true, token });


    } catch (error) {
        console.log('error:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;

        //find user by email
        const user = await User.findOne({
            email, verificationCode
        })
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid verification code or email" });
        }
        // expiry check
        if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
            return res.status(400).json({ success: false, message: "Verification code expired" });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpiresAt = undefined;
        await user.save();
        //gen token (JWT) logic will go here
        const token = generateToken(user);
        await sendWelcomeEmail(user.name, email);
        res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.log("Error Verifiying Code:", error)
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

//Reset Password

export const requestResetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        //find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ success: true, message: "If that email exists, a code was sent." });
        }
        //Create OTP CODE
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        user.verificationCodeExpiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);   //1 minute from now
        await user.save();
        await sendResetPasswordEmail(email, verificationCode);
        res.status(200).json({ success: true, message: "Verification code sent to your email" });
    } catch (error) {
        console.log("Error Resetting Password:", error)
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const checkOTP = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        //find user by email and verification code
        const user = await User.findOne({ email, verificationCode });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid verification code or email" });
        }
        // expiry check
        if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
            return res.status(400).json({ success: false, message: "Verification code expired" });
        }
        //generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXP_MINUTES * 60 * 1000);
        // clear OTP after it’s used
        user.verificationCode = undefined;
        user.verificationCodeExpiresAt = undefined;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Verification code is valid",
            resetToken
        });

    } catch (error) {
        console.log("Error Checking OTP:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }
        // find user by reset token
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordTokenExpiresAt: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        //hash the new password before saving to database
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        //clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiresAt = undefined;
        await user.save();
        res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.log("Error Resetting Password:", error)
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
