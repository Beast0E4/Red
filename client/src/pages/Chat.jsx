import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchAllUsers } from "../redux/slices/auth.slice";
import { initSocket } from "../redux/slices/socket.slice";
import { fetchMessagesByUserId } from "../redux/slices/chat.slice";

import MessageBubble from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";

export default function Chat() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const socket = useSelector((state) => state.socket.socket);
    const authState = useSelector((state) => state.auth);
    const chatState = useSelector((state) => state.chat);

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const typingTimeoutRef = useRef(null);

    const bottomRef = useRef(null);

    // Mobile sidebar toggle
    const [showSidebar, setShowSidebar] = useState(false);

    /* ================= Auth + Socket ================= */
    useEffect(() => {
        if (!authState.isLoggedIn) {
            navigate("/create-account");
            return;
        }
        dispatch(initSocket({ userId: authState.data._id, dispatch }));
    }, []);

    /* ================= Fetch Users ================= */
    useEffect(() => {
        const loadUsers = async () => {
            const res = await dispatch(fetchAllUsers());
            setUsers(
                res.payload.users.filter(
                    (u) => u._id !== authState.data._id
                )
            );
        };
        loadUsers();
    }, []);

    /* ================= Fetch Messages ================= */
    useEffect(() => {
        if (!selectedUser) return;

        const loadMessages = async () => {
            const res = await dispatch(
                fetchMessagesByUserId(selectedUser._id)
            );
            setMessages(res.payload);
        };

        loadMessages();
    }, [selectedUser]);

    /* ================= Socket ================= */
    useEffect(() => {
        if (!socket) return;

        socket.on("receive-message", (msg) => {
            if (
                selectedUser &&
                (msg.sender === selectedUser._id ||
                    msg.receiver === selectedUser._id)
            ) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        socket.on("typing:start", ({ sender }) => {
            if (sender === selectedUser?._id) {
                setTypingUser(sender);
            }
        });

        socket.on("typing:stop", () => {
            setTypingUser(null);
        });

        return () => {
            socket.off("message");
            socket.off("typing:start");
            socket.off("typing:stop");
        };
    }, [socket, selectedUser]);

    /* ================= Scroll ================= */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length, typingUser]);

    const formatLastSeen = (date) => {
        if (!date) return "Offline";

        const last = new Date(date);
        const now = new Date();
        const diff = Math.floor((now - last) / 1000); // seconds

        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

        return last.toLocaleDateString();
    };


    /* ================= Send ================= */
    const sendMessage = () => {
        if (!selectedUser || !text.trim()) return;

        socket.emit("send-message", {
            sender: authState.data._id,
            receiver: selectedUser._id,
            content: text,
        });

        setText("");
    };

    /* ================= Typing ================= */
    const handleTyping = (e) => {
        setText(e.target.value);
        if (!socket || !selectedUser) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit("typing:start", {
                sender: authState.data._id,
                receiver: selectedUser._id,
            });
        }

        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit("typing:stop", {
                sender: authState.data._id,
                receiver: selectedUser._id,
            });
        }, 800);
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setShowSidebar(false); // Close sidebar on mobile after selection
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="h-screen flex bg-[#0f172a] text-gray-200 overflow-hidden relative">
            {/* Mobile Overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* ================= Sidebar ================= */}
            <div
                className={`
                    fixed lg:relative
                    inset-y-0 left-0
                    z-50 lg:z-0
                    w-80 sm:w-96 lg:w-80 xl:w-96
                    bg-[#020617] border-r border-white/10
                    flex flex-col
                    transform transition-transform duration-300 ease-out
                    ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Sidebar Header */}
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg sm:text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Messages
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {users.length} contacts
                        </p>
                    </div>
                    <button
                        onClick={() => setShowSidebar(false)}
                        className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto">
                    {users.map((user) => (
                        <div
                            key={user._id}
                            onClick={() => handleSelectUser(user)}
                            className={`
                                flex items-center gap-3 sm:gap-4
                                px-4 sm:px-5 py-3 sm:py-4
                                cursor-pointer
                                transition-all duration-200
                                border-b border-white/5
                                ${
                                    selectedUser?._id === user._id
                                        ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-l-4 border-indigo-500"
                                        : "hover:bg-white/5 border-l-4 border-transparent"
                                }
                            `}
                        >
                            <div className="relative flex-shrink-0">
                                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {user.username[0].toUpperCase()}
                                </div>
                                {chatState.onlineUsers?.includes(user._id.toString()) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-[#020617]" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="font-medium truncate text-sm sm:text-base">
                                    {user.username}
                                </p>

                                {user._id === typingUser ? (
                                    <p className="text-xs text-indigo-400 italic flex items-center gap-1">
                                        <span className="flex gap-0.5">
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </span>
                                        typing
                                    </p>
                                ) : chatState.onlineUsers?.includes(user._id.toString()) ? (
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Online
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        Offline
                                    </p>
                                )}
                            </div>

                            {selectedUser?._id === user._id && (
                                <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ================= Chat Area ================= */}
            <div className="flex-1 min-w-0 flex flex-col bg-[#020617]">
                {/* Chat Header */}
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-white/10 bg-[#020617] flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {selectedUser ? (
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                                    {selectedUser.username[0].toUpperCase()}
                                </div>
                                {chatState.onlineUsers?.includes(selectedUser._id.toString()) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-[#020617]" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold truncate text-sm sm:text-base">
                                    {selectedUser.username}
                                </p>
                                {typingUser === selectedUser._id ? (
                                    <p className="text-xs text-indigo-400">typing...</p>
                                ) : chatState.onlineUsers?.includes(selectedUser._id.toString()) ? (
                                    <p className="text-xs text-green-400">Online</p>
                                ) : (
                                    <p className="text-xs text-gray-500">Last seen : {formatLastSeen (selectedUser.lastSeen)}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm sm:text-base">
                            Select a contact to start chatting
                        </p>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 bg-[#0f172a]">
                    {!selectedUser && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-3 px-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium text-sm sm:text-base">No conversation selected</p>
                                    <p className="text-gray-600 text-xs sm:text-sm mt-1">Choose a contact from the sidebar to begin</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg._id}
                            message={msg}
                            isMe={msg.sender === authState.data._id}
                        />
                    ))}

                    {typingUser && <TypingIndicator />}

                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 lg:p-5 border-t border-white/10 bg-[#020617]">
                    <div className="flex gap-2 sm:gap-3 max-w-4xl mx-auto">
                        <input
                            value={text}
                            onChange={handleTyping}
                            onKeyPress={handleKeyPress}
                            disabled={!selectedUser}
                            placeholder={selectedUser ? "Type a message..." : "Select a user first..."}
                            className="
                                flex-1 min-w-0
                                bg-[#0f172a] text-gray-200
                                rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base
                                border border-white/10
                                focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all
                                placeholder:text-gray-600
                            "
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!selectedUser || !text.trim()}
                            className="
                                bg-gradient-to-br from-indigo-500 to-purple-600
                                text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full
                                disabled:opacity-40 disabled:cursor-not-allowed
                                hover:shadow-lg hover:shadow-indigo-500/30
                                active:scale-95
                                transition-all duration-200
                                font-medium text-sm sm:text-base
                                flex-shrink-0
                            "
                        >
                            <span className="hidden sm:inline">Send</span>
                            <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}