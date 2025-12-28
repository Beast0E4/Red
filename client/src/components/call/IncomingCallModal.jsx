import React from "react";
import { Phone, PhoneOff, User } from "lucide-react";

export default function IncomingCallModal({
    caller,
    onAccept,
    onReject,
    onEnd,
}) {
    const handleReject = () => {
        // Reject = end call before it starts
        if (onReject) onReject();
        if (onEnd) onEnd();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
            {/* Background decorative gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#23a559] rounded-full blur-[120px] opacity-10" />
            </div>

            <div className="relative z-10 flex flex-col items-center space-y-8">
                
                {/* Caller Avatar with Ripple Effect */}
                <div className="relative">
                    {/* Ripples (Greenish tint for incoming) */}
                    <div className="absolute inset-0 rounded-full bg-[#23a559] opacity-20 animate-ping" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute inset-0 rounded-full bg-[#23a559] opacity-10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
                    
                    {/* Main Avatar Circle */}
                    <div className="relative w-32 h-32 rounded-full bg-[#5865f2] flex items-center justify-center shadow-2xl ring-4 ring-[#1e1f22] overflow-hidden">
                        {caller?.avatar ? (
                            <img src={caller.avatar} alt={caller.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-4xl font-bold text-white">
                                {caller?.username?.charAt(0).toUpperCase() || <User className="w-12 h-12" />}
                            </div>
                        )}
                    </div>
                </div>

                {/* Text Details */}
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {caller?.username || "Unknown User"}
                    </h2>
                    <p className="text-[#b5bac1] font-medium text-sm uppercase tracking-wider animate-pulse">
                        Incoming Call...
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-12 w-full flex justify-center items-center gap-12">
                
                {/* Decline Button */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={handleReject}
                        className="group w-16 h-16 rounded-full bg-[#ed4245] hover:bg-[#c03537] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Decline"
                    >
                        <PhoneOff className="w-7 h-7 text-white fill-current" />
                    </button>
                    <span className="text-xs text-[#b5bac1] font-medium">Decline</span>
                </div>

                {/* Accept Button */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={onAccept}
                        className="group w-16 h-16 rounded-full bg-[#23a559] hover:bg-[#1f8b4c] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 animate-bounce"
                        style={{ animationDuration: '2s' }} // Slow bounce to draw attention
                        title="Accept"
                    >
                        <Phone className="w-7 h-7 text-white fill-current" />
                    </button>
                    <span className="text-xs text-[#b5bac1] font-medium">Accept</span>
                </div>

            </div>
        </div>
    );
}