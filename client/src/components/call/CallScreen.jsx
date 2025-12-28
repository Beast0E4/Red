import React, { useEffect, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, User } from "lucide-react";
import { useSelector } from "react-redux";

export default function CallScreen({
    localVideoRef,
    remoteVideoRef,
    onEnd,
    call, // "audio" | "video"
}) {
    const authState = useSelector ((state) => state.auth);

    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const remoteUsername = call.from ? call.from?.username : call.to?.username;
    const username = authState.data.username;

    /* ================= CALL TIMER ================= */
    useEffect(() => {
        const timer = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    /* ================= FORMAT TIME ================= */
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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
        <div className="fixed inset-0 z-100 bg-gradient-to-br from-[#0a0b0d] via-[#111318] to-[#1a1d24] flex flex-col overflow-hidden">

            {/* ================= ANIMATED BACKGROUND ================= */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* ================= TOP BAR ================= */}
            <div className="relative z-20 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-white/80 text-sm font-medium">{formatTime(callDuration)}</span>
                    </div>
                    <div className="px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                        <span className="text-white/60 text-sm">{call.type === "video" ? "Video Call" : "Voice Call"}</span>
                    </div>
                </div>
            </div>

            {/* ================= REMOTE MEDIA AREA ================= */}
            <div className="flex-1 relative flex items-center justify-center">
                
                {/* REMOTE VIDEO STREAM */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${call.type === "audio" ? "invisible absolute" : "visible"}`}
                />

                {/* AUDIO CALL UI OVERLAY */}
                {call.type === "audio" && (
                    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 z-10">
                        {/* Animated Glow */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-[140px] opacity-20 animate-pulse" />
                        </div>

                        {/* Avatar with Ring Animation */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl ring-4 ring-white/10 ring-offset-4 ring-offset-[#111318]">
                                <User className="w-20 h-20 text-white" strokeWidth={1.5} />
                            </div>
                            {/* Pulsing Rings */}
                            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
                            <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" style={{ animationDelay: '0.5s' }} />
                        </div>

                        {/* User Info */}
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">{}</h2>
                            <div className="flex items-center gap-2 justify-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <p className="text-emerald-400 font-medium">Connected</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIDEO CALL OVERLAY - Remote Username */}
                {call.type === "video" && (
                    <div className="absolute top-6 left-8 z-10">
                        <div className="px-5 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{remoteUsername}</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-xs text-emerald-400">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ================= LOCAL VIDEO (PiP) ================= */}
            {call.type === "video" && (
                <div
                    className={`
                        absolute top-24 right-8 w-56 aspect-[3/4]
                        bg-gradient-to-br from-[#1e1f22] to-[#2b2d31] rounded-2xl overflow-hidden 
                        shadow-2xl border-2 border-white/10
                        transition-all duration-300 ease-out
                        ${videoOff ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"}
                    `}
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                    {/* Local Username Overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                        <div className="px-3 py-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                            <p className="text-white text-sm font-medium truncate">{username}</p>
                        </div>
                    </div>
                    {/* Muted Indicator */}
                    {muted && (
                        <div className="absolute top-3 right-3">
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                                <MicOff className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================= CONTROLS ================= */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-4 px-8 py-5 bg-black/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10">

                    {/* MUTE BUTTON */}
                    <button
                        onClick={() => setMuted((m) => !m)}
                        className={`
                            group relative w-16 h-16 rounded-2xl flex items-center justify-center 
                            transition-all duration-300 transform hover:scale-105 active:scale-95
                            ${muted 
                                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50" 
                                : "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10"
                            }
                        `}
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
                    </button>

                    {/* VIDEO TOGGLE */}
                    {call.type === "video" && (
                        <button
                            onClick={() => setVideoOff((v) => !v)}
                            className={`
                                group relative w-16 h-16 rounded-2xl flex items-center justify-center 
                                transition-all duration-300 transform hover:scale-105 active:scale-95
                                ${videoOff 
                                    ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50" 
                                    : "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10"
                                }
                            `}
                            title={videoOff ? "Turn Video On" : "Turn Video Off"}
                        >
                            {videoOff ? <VideoOff className="w-7 h-7 text-white" /> : <Video className="w-7 h-7 text-white" />}
                        </button>
                    )}

                    {/* END CALL BUTTON */}
                    <button
                        onClick={onEnd}
                        className="w-20 h-16 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ml-2 shadow-lg shadow-red-500/50"
                        title="End Call"
                    >
                        <PhoneOff className="w-8 h-8 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}