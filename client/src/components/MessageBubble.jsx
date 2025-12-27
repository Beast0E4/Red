import React, { useState, useRef } from "react";
import { Smile, Plus, MoreHorizontal } from "lucide-react";
import ReactionModal from "./ReactionModal"; // Import the modal here directly

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function MessageBubble({ 
    message, 
    isMe, 
    showHeader, 
    currentUserId, 
    onReact 
}) {
    const [showPicker, setShowPicker] = useState(false);
    const [showReactionsModal, setShowReactionsModal] = useState(false); // Local state for modal
    const longPressTimer = useRef(null);

    /* ================= Helpers ================= */
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getReactionGroups = () => {
        if (!message.reactions) return [];

        const groups = message.reactions.reduce((acc, reaction) => {
            const { emoji, users = [] } = reaction;

            if (!acc[emoji]) {
                acc[emoji] = {
                    emoji,
                    count: 0,
                    hasReacted: false,
                };
            }

            // ✅ count = number of users for this emoji
            acc[emoji].count += users.length;

            // ✅ check if current user reacted
            if (users.some(u => u._id === currentUserId || u === currentUserId)) {
                acc[emoji].hasReacted = true;
            }

            return acc;
        }, {});

        return Object.values(groups);
    };

    const reactionGroups = getReactionGroups();

    const handleEmojiClick = (emoji) => {
        onReact(message._id, emoji);
        setShowPicker(false);
    };

    /* ================= Touch / Long Press Logic ================= */
    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setShowPicker(true);
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleTouchMove = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    /* ================= Render ================= */
    return (
        <>
            {/* 1. Render Modal locally if state is true */}
            {showReactionsModal && (
                <ReactionModal
                    reactions={message.reactions} 
                    onClose={() => setShowReactionsModal(false)} 
                />
            )}

            <div 
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                className={`group relative flex gap-3 py-0.5 px-3 -mx-3 hover:bg-[#2e3035] ${showHeader ? 'mt-4' : ''} select-none md:select-text`}
            >
                {/* TOOLBAR */}
                <div 
                    className={`
                        absolute -top-2 right-4 bg-[#313338] border border-[#26272d] rounded shadow-sm 
                        flex items-center p-0.5 z-10 transition-opacity duration-200
                        ${showPicker ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}
                    `}
                >
                    {/* Emoji Picker Popover */}
                    {showPicker && (
                        <div className="absolute bottom-full right-0 mb-2 bg-[#2b2d31] border border-[#202225] p-2 rounded-lg shadow-xl flex gap-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                            {QUICK_REACTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEmojiClick(emoji);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded text-lg transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                            {/* Close (Mobile) */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPicker(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center hover:bg-[#ed4245] rounded text-white text-xs transition-colors md:hidden"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={() => setShowPicker(!showPicker)}
                        className="p-1.5 hover:bg-[#404249] rounded cursor-pointer text-[#b5bac1] hover:text-[#dbdee1]"
                    >
                        <Smile className="w-4 h-4" />
                    </button>
                    
                    {/* View Reactions Button (Three Dots) */}
                    {message.reactions && message.reactions.length > 0 && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowReactionsModal(true); // <--- Trigger local state
                                setShowPicker(false); // Close picker if open
                            }}
                            className="p-1.5 hover:bg-[#404249] rounded cursor-pointer text-[#b5bac1] hover:text-[#dbdee1]"
                            title="View Reactions"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    )}

                    <button className="p-1.5 hover:bg-[#404249] rounded cursor-pointer text-[#b5bac1] hover:text-[#dbdee1]">
                        <Plus className="w-4 h-4 rotate-45" />
                    </button>
                </div>

                {/* Left Column */}
                {showHeader ? (
                    <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 mt-0.5">
                        {message.sender.username?.charAt(0).toUpperCase()}
                    </div>
                ) : (
                    <div className="w-10 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-[#949ba4] opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatTime(message.createdAt)}
                        </span>
                    </div>
                )}
                
                {/* Right Column */}
                <div className="flex-1 min-w-0">
                    {showHeader && (
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`font-medium ${isMe ? `text-[#88f5fd]` : `text-white`} text-[15px]`}>
                                {isMe ? "You" : message.sender.username}
                            </span>
                            <span className="text-[11px] text-[#949ba4]">
                                {formatTime(message.createdAt)}
                            </span>
                        </div>
                    )}
                    
                    <p className={`text-[15px] ${isMe ? 'text-gray-100' : 'text-[#dbdee1]'} leading-[1.375rem] break-words whitespace-pre-wrap`}>
                        {message.content}
                    </p>

                    {/* Reaction Pills */}
                    {reactionGroups.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {reactionGroups.map((group) => (
                                <button
                                    key={group.emoji}
                                    onClick={() => onReact(message._id, group.emoji)}
                                    // Allow right-click to view details (Optional but nice UX)
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setShowReactionsModal(true);
                                    }}
                                    className={`
                                        flex items-center gap-1.5 px-1.5 py-0.5 rounded-[0.5rem] border 
                                        text-sm font-medium transition-colors duration-100
                                        ${group.hasReacted 
                                            ? 'bg-[#373a53] border-[#5865f2] text-white' 
                                            : 'bg-[#2b2d31] border-transparent text-[#949ba4] hover:border-[#4e5058] hover:bg-[#313338]'}
                                    `}
                                    title="Right click to view details"
                                >
                                    <span className="w-4 h-4 flex items-center justify-center">{group.emoji}</span>
                                    <span className="text-xs">{group.count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}