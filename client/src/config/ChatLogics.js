export const isSameSenderMargin = (messages, m, i, userId) => {
  if (!messages || !m || !m.sender) return "auto";

  if (
    i < messages.length - 1 &&
    messages[i + 1]?.sender?._id === m.sender._id &&
    messages[i]?.sender?._id !== userId
  )
    return 33;
  else if (
    (i < messages.length - 1 &&
      messages[i + 1]?.sender?._id !== m.sender._id &&
      messages[i]?.sender?._id !== userId) ||
    (i === messages.length - 1 && messages[i]?.sender?._id !== userId)
  )
    return 0;
  else return "auto";
};

export const isSameSender = (messages, m, i, userId) => {
  if (!messages || !m || !m.sender) return false;

  return (
    i < messages.length - 1 &&
    (messages[i + 1]?.sender?._id !== m.sender._id ||
      messages[i + 1]?.sender?._id === undefined) &&
    messages[i]?.sender?._id !== userId
  );
};

export const isLastMessage = (messages, i, userId) => {
  if (!messages || messages.length === 0) return false;

  return (
    i === messages.length - 1 &&
    messages[messages.length - 1]?.sender?._id !== userId &&
    messages[messages.length - 1]?.sender?._id
  );
};

export const isSameUser = (messages, m, i) => {
  if (!messages || !m || !m.sender || i <= 0) return false;
  return messages[i - 1]?.sender?._id === m.sender._id;
};

export const getSender = (loggedUser, users) => {
  if (!users || !Array.isArray(users) || users.length === 0) return "User";
  if (!loggedUser || !loggedUser._id) return users[0]?.name || "User";

  if (users.length === 1) return users[0]?.name || "User";
  return users[0]?._id === loggedUser._id
    ? users[1]?.name || "User"
    : users[0]?.name || "User";
};

export const getSenderFull = (loggedUser, users) => {
  if (!users || !Array.isArray(users) || users.length === 0) return {};
  if (!loggedUser || !loggedUser._id) return users[0] || {};

  if (users.length === 1) return users[0] || {};
  return users[0]?._id === loggedUser._id ? users[1] || {} : users[0] || {};
};

export const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatMessageDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }
};
