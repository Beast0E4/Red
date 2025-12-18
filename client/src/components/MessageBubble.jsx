import React from "react";

const MessageBubble = React.memo(({ message, isMe }) => {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} px-2`}>
      <div
        className={`
          relative max-w-[70%] px-3 py-2 leading-relaxed
          ${isMe
            ? "bg-[#9abff3] text-gray-900 rounded-l-lg rounded-tr-lg"
            : "bg-white text-gray-900 rounded-r-lg rounded-tl-lg"}
          shadow-sm
        `}
      >
        {/* Message Text */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Timestamp */}
        <div className="flex justify-end">
          <span className="text-[8px] text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;
