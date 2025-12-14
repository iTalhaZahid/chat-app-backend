import { Router } from "express";
import { loginUser, registerUser, verifyEmail } from "../controllers/auth.controllers.js";

const router= Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.post("/verify-email",verifyEmail);

export default router;