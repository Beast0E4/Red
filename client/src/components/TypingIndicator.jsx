export default function TypingIndicator({ username }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-gray-500 italic">
        {username} is typing
      </span>

      {/* Animated dots */}
      <div className="flex gap-1">
        <span className="dot" />
        <span className="dot animation-delay-200" />
        <span className="dot animation-delay-400" />
      </div>
    </div>
  );
}
