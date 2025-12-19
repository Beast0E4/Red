import React from "react";

const MessageBubble = React.memo(({ message, isMe }) => {
  // Helper to determine tick color based on read status
  // If the background is blue (isMe), we use light blue for read, or opacity for unread.
  const getTickColor = () => {
    if (message.read) return "text-blue-200"; // Distinct color for read
    return "text-blue-100/50"; // Faded color for sent/delivered
  };

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
          isMe
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
        }`}
      >
        {/* Message Text */}
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Timestamp & Read Status Container */}
        <div
          className={`text-[10px] mt-1 flex justify-end items-center gap-1 ${
            isMe ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {/* Time */}
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {/* Read Status Indicator (Only show for 'Me') */}
          {isMe && (
            <span className={getTickColor()}>
              {/* Double Tick SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 7 17l-5-5" />
                <path d="m22 10-7.5 7.5L13 16" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;