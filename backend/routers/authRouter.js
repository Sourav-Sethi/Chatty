import express from "express";
import { login, signup, logout, updateProfile, checkAuth, blockUser, unblockUser, reportUser, enable2FA, disable2FA, verify2FA } from "../controllers/authController.js";
import {protectRoute} from "../middleware/authMiddleWare.js"
const router = express.Router();

router.post("/signup",signup)

router.post("/login",login)

router.post("/logout",logout)

router.put("/update-profile",protectRoute,updateProfile)

router.get("/check",protectRoute,checkAuth)

router.post("/block", protectRoute, blockUser);
router.post("/unblock", protectRoute, unblockUser);
router.post("/report", protectRoute, reportUser);

router.post("/2fa/enable", protectRoute, enable2FA);
router.post("/2fa/disable", protectRoute, disable2FA);
router.post("/2fa/verify", protectRoute, verify2FA);

export default router;