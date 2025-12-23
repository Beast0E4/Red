export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 animate-fade-in">
      {/* Avatar */}
      {/* <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-semibold">T</span>
      </div> */}
      
      {/* Typing Bubble */}
      <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg max-w-[80px]">
        <div className="flex items-center gap-1 h-5">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-1"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-2"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-3"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-bounce-1 {
          animation: bounce-typing 1.4s infinite;
          animation-delay: 0s;
        }

        .animate-bounce-2 {
          animation: bounce-typing 1.4s infinite;
          animation-delay: 0.2s;
        }

        .animate-bounce-3 {
          animation: bounce-typing 1.4s infinite;
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}