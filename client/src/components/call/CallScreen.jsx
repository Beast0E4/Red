import React, { useEffect, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, User } from "lucide-react";

export default function CallScreen({
    localVideoRef,
    remoteVideoRef,
    // remoteAudioRef, // ❌ Not needed anymore. remoteVideoRef handles both.
    onEnd,
    type, // "audio" | "video"
}) {
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);

    /* ================= TOGGLE MIC ================= */
    useEffect(() => {
        if (!localVideoRef.current?.srcObject) return;
        const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !muted;
        }
    }, [muted, localVideoRef]);

    /* ================= TOGGLE VIDEO ================= */
    useEffect(() => {
        if (!localVideoRef.current?.srcObject) return;
        const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoOff;
        }
    }, [videoOff, localVideoRef]);

    return (
        <div className="fixed inset-0 z-50 bg-[#0f1012] flex flex-col overflow-hidden">

            {/* ================= REMOTE MEDIA AREA ================= */}
            <div className="flex-1 relative flex items-center justify-center">
                
                {/* 1. REMOTE STREAM
                    We always render this. If it's an audio call, we visually hide it 
                    but keep it in the DOM so audio plays.
                */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${type === "audio" ? "invisible absolute" : "visible"}`}
                />

                {/* 2. AUDIO CALL UI OVERLAY 
                    Shown only when type === "audio"
                */}
                {type === "audio" && (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300 z-10">
                        {/* Pulsing Background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5865f2] rounded-full blur-[120px] opacity-10" />
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#5865f2] rounded-full blur-xl opacity-20 animate-pulse" />
                            <div className="relative w-32 h-32 rounded-full bg-[#5865f2] flex items-center justify-center shadow-2xl ring-4 ring-[#1e1f22]">
                                <User className="w-16 h-16 text-white" />
                            </div>
                        </div>

                        {/* Status Text */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white tracking-wide">Connected</h2>
                            <p className="text-[#b5bac1] font-mono mt-1">00:00</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ================= LOCAL VIDEO (PiP) ================= */}
            {/* Only show PiP if it's a video call */}
            {type === "video" && (
                <div
                    className={`
                        absolute top-6 right-6 w-48 aspect-[3/4]
                        bg-[#1e1f22] rounded-xl overflow-hidden shadow-2xl border border-white/10
                        transition-all duration-300 ease-in-out
                        ${videoOff ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}
                    `}
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                </div>
            )}

            {/* ================= CONTROLS ================= */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-4 px-6 py-4 bg-[#2b2d31]/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/5">

                    {/* MUTE BUTTON */}
                    <button
                        onClick={() => setMuted((m) => !m)}
                        className={`
                            group w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
                            ${muted ? "bg-white text-black hover:bg-gray-200" : "bg-[#404249] text-white hover:bg-[#4e5058]"}
                        `}
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    {/* VIDEO TOGGLE (Conditional) */}
                    {type === "video" && (
                        <button
                            onClick={() => setVideoOff((v) => !v)}
                            className={`
                                group w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
                                ${videoOff ? "bg-white text-black hover:bg-gray-200" : "bg-[#404249] text-white hover:bg-[#4e5058]"}
                            `}
                            title={videoOff ? "Turn Video On" : "Turn Video Off"}
                        >
                            {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                        </button>
                    )}

                    {/* END CALL BUTTON */}
                    <button
                        onClick={onEnd}
                        className="w-16 h-14 rounded-full bg-[#ed4245] hover:bg-[#c03537] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ml-2"
                        title="End Call"
                    >
                        <PhoneOff className="w-7 h-7 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}