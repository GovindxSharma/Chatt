const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  sendMessage,
  allMessages,
  editMessage,
  togglePinMessage,
  deleteMessage,
  clearChat,
  reactToMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);
router.route("/:id").delete(protect, deleteMessage);
router.route("/:id/edit").put(protect, editMessage);
router.route("/:id/pin").put(protect, togglePinMessage);
router.route("/:id/react").put(protect, reactToMessage);
router.route("/clear/:chatId").delete(protect, clearChat);

module.exports = router;