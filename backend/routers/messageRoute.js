import express from "express"
import { protectRoute } from "../middleware/authMiddleWare.js"
import {getUsersForSidebar, getMessages,sendMessages, markMessagesAsRead, addReaction, removeReaction, editMessage, deleteMessage, createGroup, getGroups, sendGroupMessage, getGroupMessages, recordGameResult, getLeaderboard, getUserAchievements} from "../controllers/messageController.js"
const router = express.Router()

router.get("/users",protectRoute,getUsersForSidebar);
router.get("/:id",protectRoute,getMessages);
router.post("/send/:id",protectRoute,sendMessages);
router.post("/read/:id", protectRoute, markMessagesAsRead);
router.post("/reaction/:messageId", protectRoute, addReaction);
router.delete("/reaction/:messageId", protectRoute, removeReaction);
router.put("/edit/:messageId", protectRoute, editMessage);
router.delete("/delete/:messageId", protectRoute, deleteMessage);
router.post("/group", protectRoute, createGroup);
router.get("/groups", protectRoute, getGroups);
router.post("/group/:groupId/message", protectRoute, sendGroupMessage);
router.get("/group/:groupId/messages", protectRoute, getGroupMessages);
router.post("/games/result", protectRoute, recordGameResult);
router.get("/games/leaderboard", protectRoute, getLeaderboard);
router.get("/games/achievements", protectRoute, getUserAchievements);

export default router;