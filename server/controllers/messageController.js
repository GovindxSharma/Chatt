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
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name pic email" },
      })
      .populate("reactions.user", "name pic")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message (Text, Audio, File, Reply)
//@route           POST /api/message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, fileUrl, fileType, fileName, replyTo } = req.body;

  if ((!content && !fileUrl) || !chatId) {
    res.status(400);
    throw new Error("Invalid message data. Content or file is required.");
  }

  const rawChatId = typeof chatId === "object" && chatId._id ? chatId._id : chatId;

  const newMessage = {
    sender: req.user._id,
    content: content || "",
    fileUrl: fileUrl || "",
    fileType: fileType || "",
    fileName: fileName || "",
    replyTo: replyTo || undefined,
    chat: rawChatId,
  };

  try {
    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic email bio status");
    message = await message.populate({
      path: "replyTo",
      populate: { path: "sender", select: "name pic email" },
    });
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

//@description     Edit a Message Content
//@route           PUT /api/message/:id/edit
//@access          Protected
const editMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const messageId = req.params.id;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Message content cannot be empty");
  }

  let message = await Message.findById(messageId).populate("chat");

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the sender can edit this message");
  }

  message.content = content.trim();
  message.isEdited = true;
  await message.save();

  message = await Message.findById(messageId)
    .populate("sender", "name pic email bio status")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "name pic email" },
    })
    .populate("reactions.user", "name pic")
    .populate("chat");

  res.json(message);
});

//@description     Toggle Pin Message in Chat
//@route           PUT /api/message/:id/pin
//@access          Protected
const togglePinMessage = asyncHandler(async (req, res) => {
  const messageId = req.params.id;

  let message = await Message.findById(messageId).populate("chat");

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  message.isPinned = !message.isPinned;
  await message.save();

  message = await Message.findById(messageId)
    .populate("sender", "name pic email bio status")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "name pic email" },
    })
    .populate("reactions.user", "name pic")
    .populate("chat");

  res.json(message);
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
  message.fileType = "";
  message.fileName = "";
  await message.save();

  res.json({ message: "Message deleted successfully", _id: messageId, chatId: message.chat._id });
});

//@description     Clear Chat History
//@route           DELETE /api/message/clear/:chatId
//@access          Protected
const clearChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  await Message.updateMany(
    { chat: chatId },
    { $set: { isDeleted: true, content: "This message was deleted", fileUrl: "" } }
  );

  await Chat.findByIdAndUpdate(chatId, { latestMessage: null });

  res.json({ message: "Chat cleared successfully", chatId });
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
    message.reactions.splice(existingReactionIndex, 1);
  } else {
    message.reactions.push({
      user: req.user._id,
      emoji: emoji,
    });
  }

  await message.save();

  message = await Message.findById(messageId)
    .populate("sender", "name pic email")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "name pic email" },
    })
    .populate("reactions.user", "name pic")
    .populate("chat");

  res.json(message);
});

module.exports = {
  allMessages,
  sendMessage,
  editMessage,
  togglePinMessage,
  deleteMessage,
  clearChat,
  reactToMessage,
};
