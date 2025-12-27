import React, { useState } from "react";
import { Smile, Plus } from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function MessageBubble({ 
    message, 
    isMe, 
    showHeader, 
    currentUserId, 
    onReact 
}) {
    // State to toggle the reaction picker
    const [showPicker, setShowPicker] = useState(false);

    /* ================= Helpers ================= */
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getReactionGroups = () => {
        if (!message.reactions) return [];
        
        const groups = message.reactions.reduce((acc, reaction) => {
            const key = reaction.emoji;
            if (!acc[key]) {
                acc[key] = { emoji: key, count: 0, hasReacted: false };
            }
            acc[key].count += 1;
            if (reaction.userId === currentUserId) {
                acc[key].hasReacted = true;
            }
            return acc;
        }, {});

        return Object.values(groups);
    };

    const reactionGroups = getReactionGroups();

    const handleEmojiClick = (emoji) => {
        onReact(message._id, emoji);
        setShowPicker(false); // Close picker after selection
    };

    /* ================= Render ================= */
    return (
        <div className={`group relative flex gap-3 py-0.5 px-3 -mx-3 hover:bg-[#2e3035] ${showHeader ? 'mt-4' : ''}`}>
            
            {/* HOVER TOOLBAR (Floating Top Right) */}
            {/* Logic: If picker is open, force opacity-100. Otherwise, use group-hover logic. */}
            <div 
                className={`
                    absolute -top-2 right-4 bg-[#313338] border border-[#26272d] rounded shadow-sm 
                    flex items-center p-0.5 z-10 transition-opacity duration-200
                    ${showPicker ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
            >
                {/* EMOJI PICKER POPOVER */}
                {showPicker && (
                    <div className="absolute bottom-full right-0 mb-2 bg-[#2b2d31] border border-[#202225] p-2 rounded-lg shadow-xl flex gap-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                        {QUICK_REACTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleEmojiClick(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded text-lg transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                <button 
                    onClick={() => setShowPicker(!showPicker)}
                    className={`p-1.5 rounded cursor-pointer transition-colors ${showPicker ? 'bg-[#404249] text-[#dbdee1]' : 'hover:bg-[#404249] text-[#b5bac1] hover:text-[#dbdee1]'}`}
                    title="Add Reaction"
                >
                    <Smile className="w-4 h-4" />
                </button>
            </div>

            {/* Left Column: Avatar or Hover Timestamp */}
            {showHeader ? (
                <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity">
                    {message.sender.username?.charAt(0).toUpperCase()}
                </div>
            ) : (
                <div className="w-10 flex-shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-[#949ba4] opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        {formatTime(message.createdAt)}
                    </span>
                </div>
            )}
            
            {/* Right Column: Name + Message + Reactions */}
            <div className="flex-1 min-w-0">
                {showHeader && (
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-medium ${isMe ? `text-[#88f5fd]` : `text-white`} text-[15px] cursor-pointer hover:underline`}>
                            {isMe ? "You" : message.sender.username}
                        </span>
                        <span className="text-[11px] text-[#949ba4]">
                            {formatTime(message.createdAt)}
                        </span>
                    </div>
                )}
                
                {/* Message Content */}
                <p className={`text-[15px] ${isMe ? 'text-gray-100' : 'text-[#dbdee1]'} leading-[1.375rem] break-words whitespace-pre-wrap`}>
                    {message.content}
                </p>

                {/* Reactions Grid */}
                {reactionGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 select-none">
                        {reactionGroups.map((group) => (
                            <button
                                key={group.emoji}
                                onClick={() => onReact(message._id, group.emoji)}
                                className={`
                                    flex items-center gap-1.5 px-1.5 py-0.5 rounded-[0.5rem] border 
                                    text-sm font-medium transition-colors duration-100
                                    ${group.hasReacted 
                                        ? 'bg-[#373a53] border-[#5865f2] text-white' 
                                        : 'bg-[#2b2d31] border-transparent text-[#949ba4] hover:border-[#4e5058] hover:bg-[#313338]'}
                                `}
                            >
                                <span className="w-4 h-4 flex items-center justify-center">{group.emoji}</span>
                                <span className="text-xs">{group.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}