import React, { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";

export default function ReactionModal({ reactions = [], onClose }) {
    const authState = useSelector ((state) => state.auth);

    // 1. Initialize active emoji with the first one in the list
    const [activeEmoji, setActiveEmoji] = useState(() => {
        return reactions.length > 0 ? reactions[0].emoji : null;
    });

    // 2. Find the reaction object for the currently selected emoji
    const currentReactionGroup = useMemo(() => {
        return reactions.find(r => r.emoji === activeEmoji);
    }, [reactions, activeEmoji]);

    // 3. Get users safely. If the group is undefined, default to empty array.
    const activeUsers = currentReactionGroup?.users || [];

    // Safe check: If no reactions passed, don't render anything
    if (!reactions || reactions.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
            <div 
                className="w-full max-w-sm bg-[#313338] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-[#2b2d31] border-b border-[#1e1f22]">
                    <h3 className="text-white font-bold">Reactions</h3>
                    <button onClick={onClose} className="text-[#b5bac1] hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Emoji Tabs */}
                <div className="flex gap-2 p-2 overflow-x-auto border-b border-[#26272d] custom-scrollbar">
                    {reactions.map((reaction) => (
                        <button
                            key={reaction.emoji}
                            onClick={() => setActiveEmoji(reaction.emoji)}
                            className={`
                                min-w-[3rem] px-3 py-1.5 rounded flex items-center gap-2 transition-colors
                                ${activeEmoji === reaction.emoji ? 'bg-[#404249] border-b-2 border-[#5865f2]' : 'hover:bg-[#35363c]'}
                            `}
                        >
                            <span className="text-xl">{reaction.emoji}</span>
                            <span className="text-xs text-[#b5bac1] font-bold">
                                {/* Use optional chaining (?.) just in case userIds is undefined */}
                                {reaction.users?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* User List */}
                <div className="h-64 overflow-y-auto custom-scrollbar p-2">
                    {activeUsers.length === 0 ? (
                        <div className="text-[#949ba4] text-center mt-4 text-sm">No users found</div>
                    ) : (
                        activeUsers.map((user, idx) => (
                            <div key={user._id || idx} className="flex items-center gap-3 p-2 hover:bg-[#35363c] rounded cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold text-sm">
                                    {/* Safe check for username existence */}
                                    {user.username?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-medium text-sm">
                                        {user._id === authState.data._id ? "You" : user.username || "Unknown User"}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}