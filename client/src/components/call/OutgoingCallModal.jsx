import React from "react";
import { X, Video, Phone, Mic } from "lucide-react";

export default function OutgoingCallModal({ type, onCancel }) {
    const isVideo = type === "video";

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
            {/* Background decorative gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5865f2] rounded-full blur-[120px] opacity-10" />
            </div>

            <div className="relative z-10 flex flex-col items-center space-y-8">
                
                {/* Avatar / Icon Container with Ripple Effect */}
                <div className="relative">
                    {/* Ripples */}
                    <div className="absolute inset-0 rounded-full bg-[#5865f2] opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-0 rounded-full bg-[#5865f2] opacity-10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                    
                    {/* Main Icon Circle */}
                    <div className="relative w-32 h-32 rounded-full bg-[#5865f2] flex items-center justify-center shadow-2xl ring-4 ring-[#1e1f22]">
                        {isVideo ? (
                            <Video className="w-14 h-14 text-white" />
                        ) : (
                            <Phone className="w-14 h-14 text-white" />
                        )}
                    </div>
                </div>

                {/* Text Details */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-100 tracking-wide">
                        Calling...
                    </h2>
                    <p className="text-[#b5bac1] font-medium text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                        {isVideo ? (
                            <><Video className="w-4 h-4" /> Video Call</>
                        ) : (
                            <><Phone className="w-4 h-4" /> Audio Call</>
                        )}
                    </p>
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-12 w-full flex justify-center items-center gap-6">
                
                {/* Dummy decorative buttons to make it look like a real call UI */}
                <div className="w-12 h-12 rounded-full bg-[#2b2d31] flex items-center justify-center text-[#b5bac1] opacity-50 cursor-not-allowed">
                    <Mic className="w-5 h-5" />
                </div>

                {/* Main Hangup Button */}
                <button
                    onClick={onCancel}
                    className="group relative w-16 h-16 rounded-full bg-[#ed4245] hover:bg-[#c03537] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    title="End Call"
                >
                    <X className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>

                 {/* Dummy decorative buttons */}
                 <div className="w-12 h-12 rounded-full bg-[#2b2d31] flex items-center justify-center text-[#b5bac1] opacity-50 cursor-not-allowed">
                    <Video className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}