export default function TypingIndicator() {
  return (
    <div className="flex justify-start px-2">
      <div className="bg-white px-3 py-3 rounded-md shadow-sm flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot delay-200" />
        <span className="typing-dot delay-400" />
      </div>
    </div>
  );
}
