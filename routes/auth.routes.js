import { Router } from "express";
import { checkOTP, loginUser, registerUser, requestResetPassword, resetPassword, verifyEmail } from "../controllers/auth.controllers.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/password/forgot", requestResetPassword);
router.post("/password/otp", checkOTP);
router.post("/password/reset", resetPassword);

export default router;