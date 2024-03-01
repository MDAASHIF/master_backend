import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import authMiddleware from "../middleware/Authenticate.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.post("/auth/logout", AuthController.logoutUser);
router.post("/avatar",[authMiddleware, upload.single("avatar")],AuthController.updateUserAvatar )

export default router;