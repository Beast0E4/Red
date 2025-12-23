import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Send, Menu, X, Users, Search } from "lucide-react";

import { initSocket } from "../redux/slices/socket.slice";
import {
    fetchAllChats,
    fetchMessagesByChatId,
    incrementUnread,
    clearUnread,
} from "../redux/slices/chat.slice";

import MessageBubble from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";

export default function Chat() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const socket = useSelector((state) => state.socket.socket);
    const authState = useSelector((state) => state.auth);
    const chatState = useSelector((state) => state.chat);

    const chats = chatState.chats;

    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [typingUser, setTypingUser] = useState(null);
    const typingTimeoutRef = useRef(null);

    const [showSidebar, setShowSidebar] = useState(false);
    const bottomRef = useRef(null);

    /* ================= Auth + Socket ================= */
    useEffect(() => {
        if (!authState.isLoggedIn) {
            navigate("/create-account");
            return;
        }

        dispatch(initSocket({ userId: authState.data._id, dispatch }));
    }, []);

    /* ================= Fetch Chats ================= */
    useEffect(() => {
        dispatch(fetchAllChats());
    }, []);

    /* ================= Fetch Messages ================= */
    useEffect(() => {
        if (!selectedChat) return;

        const loadMessages = async () => {
            const res = await dispatch(
                fetchMessagesByChatId(selectedChat._id)
            );

            setMessages(res.payload);
        };

        loadMessages();

        dispatch(clearUnread(selectedChat._id));

        socket?.emit("message:read", {
            chatId: selectedChat._id,
            reader: authState.data._id,
        });
    }, [selectedChat]);

    /* ================= Socket Listeners ================= */
    useEffect(() => {
        if (!socket) return;

        const onReceiveMessage = (msg) => {
            if (!selectedChat || msg.chat !== selectedChat._id) {
                dispatch(incrementUnread(msg.chat));
                return;
            }

            setMessages((prev) => [...prev, msg]);

            if (msg.receiver === authState.data._id) {
                socket.emit("message:read", {
                    chatId: msg.chat,
                    reader: authState.data._id,
                });
            }
        };

        const onTypingStart = ({ sender, chatId }) => {
            if (selectedChat && chatId === selectedChat._id) {
                setTypingUser(sender);
            }
        };

        const onTypingStop = ({ sender, chatId }) => {
            if (selectedChat && chatId === selectedChat._id) {
                setTypingUser(null);
            }
        };

        const onMessageRead = ({ chatId }) => {
            if (selectedChat && chatId === selectedChat._id) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.sender === authState.data._id
                            ? { ...m, status: "read" }
                            : m
                    )
                );
            }
        };

        socket.on("receive-message", onReceiveMessage);
        socket.on("typing:start", onTypingStart);
        socket.on("typing:stop", onTypingStop);
        socket.on("message:read", onMessageRead);

        return () => {
            socket.off("receive-message", onReceiveMessage);
            socket.off("typing:start", onTypingStart);
            socket.off("typing:stop", onTypingStop);
            socket.off("message:read", onMessageRead);
        };
    }, [socket, selectedChat]);

    /* ================= Auto Scroll ================= */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages?.length, typingUser]);

    /* ================= Send Message ================= */
    const sendMessage = () => {
        if (!selectedChat || !text.trim()) return;

        const receiver = selectedChat.participants.find(
            (p) => p._id !== authState.data._id
        );

        socket.emit("send-message", {
            chatId: selectedChat._id,
            sender: authState.data._id,
            receiver: receiver._id,
            content: text,
        });

        setText("");
    };

    /* ================= Typing ================= */
    const handleTyping = (e) => {
        setText(e.target.value);
        if (!socket || !selectedChat) return;

        const receiver = selectedChat.participants.find(
            (p) => p._id !== authState.data._id
        );

        socket.emit("typing:start", {
            sender: authState.data._id,
            receiver: receiver._id,
            chatId: selectedChat._id,
        });

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing:stop", {
                chatId: selectedChat._id,
                sender: authState.data._id,
                receiver: receiver._id,
            });
        }, 800);
    };

    /* ================= Helpers ================= */
    const getOtherUser = (chat) =>
        chat.participants.find(
            (p) => p._id !== authState.data._id
        );

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        setShowSidebar(false);
    };

    const filteredChats = chats.filter((chat) => {
        const other = getOtherUser(chat);
        return other.username.toLowerCase().includes(searchQuery.toLowerCase());
    });

    /* ================= UI ================= */
    return (
        <div className="h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 overflow-hidden">
            {/* Backdrop for mobile */}
            {showSidebar && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* ================= Sidebar ================= */}
            <div
                className={`
                    fixed lg:relative inset-y-0 left-0 z-50
                    w-full sm:w-96 lg:w-80 xl:w-96
                    bg-gradient-to-b from-slate-900 to-slate-950
                    border-r border-slate-700/50
                    shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    flex flex-col
                `}
            >
                {/* Sidebar Header */}
                <div className="p-4 sm:p-6 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Messages
                            </h1>
                        </div>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm
                                     placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent
                                     transition-all"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredChats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-slate-400">No chats found</p>
                        </div>
                    ) : (
                        filteredChats.map((chat) => {
                            const other = getOtherUser(chat);
                            const isSelected = selectedChat?._id === chat._id;
                            
                            return (
                                <div
                                    key={chat._id}
                                    onClick={() => handleSelectChat(chat)}
                                    className={`
                                        relative px-4 sm:px-6 py-4 cursor-pointer 
                                        border-b border-slate-800/50
                                        transition-all duration-200
                                        ${isSelected
                                            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border-l-4 border-indigo-500"
                                            : "hover:bg-slate-800/30 border-l-4 border-transparent hover:border-slate-700"}
                                    `}
                                >
                                    <div className="flex gap-3">
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                                                          flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                                                {other.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                                        </div>

                                        {/* Chat Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-semibold text-sm sm:text-base truncate">
                                                    {other.username}
                                                </p>
                                                {chat.unreadCount > 0 && (
                                                    <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs 
                                                                   px-2 py-0.5 rounded-full font-medium shadow-lg ml-2">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-slate-400 truncate">
                                                {chat.lastMessage?.content || "No messages yet"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ================= Chat Area ================= */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur shadow-lg">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {selectedChat ? (
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                                              flex items-center justify-center text-white font-semibold shadow-lg flex-shrink-0">
                                    {getOtherUser(selectedChat).username.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-base sm:text-lg truncate">
                                        {getOtherUser(selectedChat).username}
                                    </p>
                                    {chatState.onlineUsers.includes (getOtherUser(selectedChat)._id) && <p className="text-xs sm:text-sm text-emerald-400">Online</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-slate-500">
                                <Users className="w-5 h-5" />
                                <p className="text-sm sm:text-base">Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar bg-slate-900/30">
                    {!selectedChat ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 
                                          rounded-full flex items-center justify-center mb-4 sm:mb-6">
                                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold mb-2">Welcome to Messages</h2>
                            <p className="text-sm sm:text-base text-slate-400 max-w-md">
                                Select a conversation from the sidebar to start chatting with your friends
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages?.map((msg) => (
                                <MessageBubble
                                    key={msg._id}
                                    message={msg}
                                    isMe={
                                        msg.sender?._id
                                            ? msg.sender._id.toString() === authState.data._id
                                            : msg.sender === authState.data._id
                                    }
                                />
                            ))}

                            {typingUser && <TypingIndicator />}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 sm:p-6 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur">
                    <div className="flex gap-2 sm:gap-3 max-w-4xl mx-auto">
                        <input
                            value={text}
                            onChange={handleTyping}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={!selectedChat}
                            placeholder={selectedChat ? "Type your message..." : "Select a chat to start messaging"}
                            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 sm:px-6 py-3 sm:py-3.5 
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent
                                     placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-all text-sm sm:text-base"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!selectedChat || !text.trim()}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
                                     disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed
                                     px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-medium shadow-lg
                                     transition-all duration-200 flex items-center gap-2 flex-shrink-0
                                     hover:shadow-indigo-500/25"
                        >
                            <span className="hidden sm:inline">Send</span>
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(100, 116, 139, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(100, 116, 139, 0.7);
                }
            `}</style>
        </div>
    );
}