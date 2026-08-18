const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages for a Chat
//@route           GET /api/message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId,
      isDeleted: { $ne: true },
    })
      .populate("sender", "name pic email bio status")
      .populate("reactions.user", "name pic")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message (Text or Media)
//@route           POST /api/message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, fileUrl } = req.body;

  if ((!content && !fileUrl) || !chatId) {
    res.status(400);
    throw new Error("Invalid message data. Content or file is required.");
  }

  const rawChatId = typeof chatId === "object" && chatId._id ? chatId._id : chatId;

  const newMessage = {
    sender: req.user._id,
    content: content || "",
    fileUrl: fileUrl || "",
    chat: rawChatId,
  };

  try {
    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic email bio status");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email bio status",
    });

    await Chat.findByIdAndUpdate(rawChatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete a Message
//@route           DELETE /api/message/:id
//@access          Protected
const deleteMessage = asyncHandler(async (req, res) => {
  const messageId = req.params.id;

  const message = await Message.findById(messageId).populate("chat");

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  const isSender = message.sender.toString() === req.user._id.toString();
  const isAdmin =
    message.chat.groupAdmin &&
    message.chat.groupAdmin.toString() === req.user._id.toString();

  if (!isSender && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to delete this message");
  }

  message.isDeleted = true;
  message.content = "This message was deleted";
  message.fileUrl = "";
  await message.save();

  res.json({ message: "Message deleted successfully", _id: messageId, chatId: message.chat._id });
});

//@description     Toggle Emoji Reaction on a Message
//@route           PUT /api/message/:id/react
//@access          Protected
const reactToMessage = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const messageId = req.params.id;

  if (!emoji) {
    res.status(400);
    throw new Error("Emoji is required");
  }

  let message = await Message.findById(messageId);

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  const existingReactionIndex = message.reactions.findIndex(
    (r) =>
      r.user.toString() === req.user._id.toString() && r.emoji === emoji
  );

  if (existingReactionIndex > -1) {
    // Remove reaction if already reacted with the same emoji
    message.reactions.splice(existingReactionIndex, 1);
  } else {
    // Add reaction
    message.reactions.push({
      user: req.user._id,
      emoji: emoji,
    });
  }

  await message.save();

  message = await Message.findById(messageId)
    .populate("sender", "name pic email")
    .populate("reactions.user", "name pic")
    .populate("chat");

  res.json(message);
});

module.exports = {
  allMessages,
  sendMessage,
  deleteMessage,
  reactToMessage,
};
