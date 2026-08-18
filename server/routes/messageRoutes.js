const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  sendMessage,
  allMessages,
  deleteMessage,
  reactToMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);
router.route("/:id").delete(protect, deleteMessage);
router.route("/:id/react").put(protect, reactToMessage);

module.exports = router;