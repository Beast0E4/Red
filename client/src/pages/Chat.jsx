import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Send, Menu, X, Users, Search, Hash, Settings, Bell, Pin, Smile, Paperclip, Gift, Mic, Phone, Video, MoreVertical, Plus } from "lucide-react";

import { initSocket } from "../redux/slices/socket.slice";
import {
    fetchAllChats,
    fetchMessagesByChatId,
    incrementUnread,
    clearUnread,
} from "../redux/slices/chat.slice";

import CreateGroupModal from "../components/CreateGroupModal";
import { fetchAllUsers } from "../redux/slices/auth.slice";
import MessageBubble from "../components/MessageBubble";

export default function Chat() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const socket = useSelector((state) => state.socket.socket);
    const authState = useSelector((state) => state.auth);
    const chatState = useSelector((state) => state.chat);

    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [typingUser, setTypingUser] = useState(null);
    const typingTimeoutRef = useRef(null);

    const [showSidebar, setShowSidebar] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

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
        dispatch(fetchAllUsers());
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
            sender: authState.data._id,
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

            if (msg.receiver === authState.data._id || selectedChat.isGroupChat) {
                socket.emit("message:read", {
                    chatId: msg.chat,
                    reader: authState.data._id,
                });
            }
        };

        const onTypingStart = ({ sender, chatId }) => {
            console.log ("strart");
            if (selectedChat && chatId === selectedChat._id) {
                if (sender !== authState.data._id) setTypingUser(sender);
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

    useEffect(() => {
        if (!socket) return;
        
        const onReactionUpdate = (updatedMessage) => {
            console.log (updatedMessage);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === updatedMessage._id ? updatedMessage : msg
                )
            );
        };

        socket.on("message:reaction:update", onReactionUpdate);

        return () => {
            socket.off("message:reaction:update", onReactionUpdate);
        };
    }, [socket]);


    /* ================= Auto Scroll ================= */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages?.length, typingUser]);

    const onReact = (messageId, emoji) => {
        if (!socket) return;

        socket.emit ("message:react", {
            messageId,
            emoji,
            sender: authState.data._id,
            chatId: selectedChat._id,
        });
    };


    /* ================= Helpers ================= */
    const getChatDetails = (chat) => {
        if (!chat) return {};
        
        if (chat.isGroupChat) {
            return {
                name: chat.chatName,
                avatar: null,
                isOnline: false,
                isGroup: true
            };
        }

        const otherUser = chat.participants.find(
            (p) => p._id !== authState.data._id
        );
        return {
            name: otherUser?.username || "Unknown",
            avatar: otherUser?.username?.charAt(0).toUpperCase(),
            isOnline: chatState.onlineUsers?.includes(otherUser?._id),
            isGroup: false,
            otherUserId: otherUser?._id
        };
    };

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        setShowSidebar(false);
    };

    // const filteredChats = chatState.chats.filter((chat) => {
    //     const details = getChatDetails(chat);
    //     return details.name?.toLowerCase().includes(searchQuery.toLowerCase());
    // });

    // Split chats into DMs and Groups
    const directMessages = chatState.chats.filter(chat => !chat.isGroupChat);
    const groupChats = chatState.chats.filter(chat => chat.isGroupChat);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    /* ================= Send Message ================= */
    const sendMessage = () => {
        if (!selectedChat || !text.trim()) return;

        let receiverId = null;
        if (!selectedChat.isGroupChat) {
            receiverId = getChatDetails(selectedChat).otherUserId;
        }

        socket.emit("send-message", {
            chatId: selectedChat._id,
            sender: authState.data._id,
            content: text,
        });

        setText("");
    };

    /* ================= Typing ================= */
    const handleTyping = (e) => {
        setText(e.target.value);
        if (!socket || !selectedChat) return;

        socket.emit("typing:start", {
            sender: authState.data._id,
            chatId: selectedChat._id,
        });

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing:stop", {
                chatId: selectedChat._id,
                sender: authState.data._id,
            });
        }, 800);
    };

    /* ================= Render Helper ================= */
    const renderChatList = (chatList) => {
        return chatList.map((chat) => {
            const details = getChatDetails(chat);
            const isSelected = selectedChat?._id === chat._id;
            
            return (
                <div
                    key={chat._id}
                    onClick={() => handleSelectChat(chat)}
                    className={`
                        group relative px-2 py-1.5 mb-0.5 rounded cursor-pointer flex items-center gap-3
                        transition-all duration-150
                        ${isSelected 
                            ? "bg-[#404249] text-white" 
                            : "text-[#949ba4] hover:bg-[#35363c] hover:text-[#dbdee1]"}
                    `}
                >
                    <div className="relative flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full ${details.isGroup ? 'bg-[#4e5058]' : 'bg-[#5865f2]'} flex items-center justify-center text-white font-semibold text-sm`}>
                            {details.isGroup ? <Hash className="w-4 h-4" /> : details.avatar}
                        </div>
                        {!details.isGroup && (
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${details.isOnline ? 'bg-[#23a559]' : 'bg-[#80848e]'}`} />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{details.name}</span>
                        </div>
                    </div>

                    {chat.unreadCount > 0 && (
                        <div className="flex-shrink-0 bg-[#f23f43] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {chat.unreadCount}
                        </div>
                    )}
                </div>
            );
        });
    };

    /* ================= UI ================= */
    return (
        <div className="h-screen flex bg-[#313338] text-gray-100 overflow-hidden font-sans">
            {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
            
            {showSidebar && (
                <div 
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Navigation Bar */}
            <div className="hidden md:flex flex-col w-[72px] bg-[#1e1f22] py-3 gap-2 items-center border-r border-black/20">
                <div className="w-12 h-12 bg-[#5865f2] hover:bg-[#4752c4] rounded-[16px] hover:rounded-[12px] transition-all duration-200 flex items-center justify-center cursor-pointer group relative">
                    <Users className="w-6 h-6 text-white" />
                </div>
                <div className="w-8 h-[2px] bg-[#35363c] rounded-full" />
            </div>

            {/* Sidebar */}
            <div
                className={`
                    fixed lg:relative inset-y-0 left-0 z-50
                    w-60
                    bg-[#2b2d31]
                    shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    flex flex-col
                `}
            >
                {/* Sidebar Header */}
                <div className="h-12 px-4 flex items-center justify-between border-b border-black/20 shadow-md hover:bg-[#35363c] cursor-pointer transition-colors">
                    <h1 className="font-bold text-[15px] text-white">Conversations</h1>
                    <X className="w-4 h-4 text-[#b5bac1] hover:text-white cursor-pointer lg:hidden" onClick={() => setShowSidebar(false)} />
                </div>

                {/* Search */}
                <div className="px-2 pt-4 pb-2">
                    <button className="w-full bg-[#1e1f22] hover:bg-[#0c0d0e] text-[#949ba4] text-sm px-2 py-1.5 rounded flex items-center gap-2 transition-colors">
                        <Search className="w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Find or start a conversation"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent outline-none flex-1 placeholder:text-[#949ba4]"
                        />
                    </button>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                    {chatState.chats?.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-[#949ba4]">
                            No conversations found
                        </div>
                    ) : (
                        <>
                            {/* Direct Messages Section */}
                            <div className="flex items-center justify-between px-2 py-2 mt-2">
                                <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider">Direct Messages</span>
                            </div>
                            {renderChatList(directMessages)}

                            {/* Group Chats Section */}
                            <div className="flex items-center justify-between px-2 py-2 mt-4">
                                <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider">Playgrounds</span>
                                <div 
                                    onClick={() => setShowCreateGroup(true)}
                                    className="w-4 h-4 text-[#949ba4] hover:text-white cursor-pointer"
                                    title="Create Group Chat"
                                >
                                    <Plus className="w-4 h-4" />
                                </div>
                            </div>
                            {renderChatList(groupChats)}
                        </>
                    )}
                </div>

                {/* User Footer */}
                <div className="h-[52px] px-2 bg-[#232428] flex items-center gap-2">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[#f23f43] flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
                            {authState.data?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23a559] rounded-full border-2 border-[#232428]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{authState.data?.username || 'User'}</div>
                        <div className="text-xs text-[#949ba4]">Online</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-8 h-8 flex items-center justify-center hover:bg-[#35363c] rounded cursor-pointer transition-colors">
                            <Mic className="w-4 h-4 text-[#b5bac1]" />
                        </div>
                        <Link to={'/settings'} className="w-8 h-8 flex items-center justify-center hover:bg-[#35363c] rounded cursor-pointer transition-colors">
                            <Settings className="w-4 h-4 text-[#b5bac1]" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
                {/* Chat Header */}
                <div className="h-12 px-4 flex items-center justify-between border-b border-black/20 shadow-sm bg-[#313338]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="lg:hidden p-1 hover:bg-[#35363c] rounded transition-colors"
                        >
                            <Menu className="w-5 h-5 text-[#b5bac1]" />
                        </button>

                        {selectedChat ? (
                            <>
                                {selectedChat.isGroupChat ? (
                                     <Hash className="w-5 h-5 text-[#80848e]" />
                                ) : (
                                     <Users className="w-5 h-5 text-[#80848e]" />
                                )}
                                <span className="font-bold text-white text-[15px]">
                                    {getChatDetails(selectedChat).name}
                                </span>
                            </>
                        ) : (
                            <>
                                <Users className="w-5 h-5 text-[#80848e]" />
                                <span className="font-bold text-white text-[15px]">Friends</span>
                            </>
                        )}
                    </div>
                    {/* Header Icons */}
                    {selectedChat && (
                        <div className="flex items-center gap-4">
                            <Phone className="w-5 h-5 text-[#b5bac1] hover:text-[#dbdee1] cursor-pointer" />
                            <Video className="w-5 h-5 text-[#b5bac1] hover:text-[#dbdee1] cursor-pointer" />
                            <Pin className="w-5 h-5 text-[#b5bac1] hover:text-[#dbdee1] cursor-pointer" />
                            <div className="w-px h-6 bg-[#3f4147]" />
                            <Search className="w-5 h-5 text-[#b5bac1] hover:text-[#dbdee1] cursor-pointer" />
                        </div>
                    )}
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {!selectedChat ? (
                        <div className="flex flex-col items-center justify-center h-full px-4">
                            <div className="text-center max-w-md">
                                <div className="w-20 h-20 mx-auto mb-4 bg-[#43444b] rounded-full flex items-center justify-center">
                                    <Users className="w-10 h-10 text-[#b5bac1]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">No one's around to play with Red</h2>
                                <p className="text-[#b5bac1] text-sm">Select a conversation from the sidebar to start chatting</p>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-4 space-y-1">
                            {/* Chat Intro Section */}
                            <div className="flex flex-col items-center py-8">
                                <div className={`w-20 h-20 rounded-full ${selectedChat.isGroupChat ? 'bg-[#4e5058]' : 'bg-[#5865f2]'} flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg`}>
                                    {selectedChat.isGroupChat ? <Hash className="w-10 h-10" /> : getChatDetails(selectedChat).avatar}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    {getChatDetails(selectedChat).name}
                                </h2>
                                <p className="text-[#b5bac1] text-sm mb-4">
                                    {selectedChat.isGroupChat 
                                        ? `Welcome to the playground.`
                                        : `Welcome to the one-to-one messaging.`
                                    }
                                </p>
                            </div>

                            {messages?.map((msg, idx) => {
                                const isMe = msg.sender._id === authState.data._id;
                                const showAvatar = idx === 0 || messages[idx - 1]?.sender._id !== msg.sender._id;
                                
                                return (
                                    <MessageBubble 
                                        key={msg._id}
                                        message={msg}
                                        isMe={isMe}
                                        showHeader={showAvatar}
                                        onReact={onReact}
                                        currentUserId={authState.data._id}
                                    />
                                );
                            })}

                            {typingUser && (
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-[#b5bac1] rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                                        <div className="w-2 h-2 bg-[#b5bac1] rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                        <div className="w-2 h-2 bg-[#b5bac1] rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                                    </div>
                                    <span className="text-sm text-[#949ba4]">Someone is typing...</span>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* Message Input */}
                {selectedChat && (
                    <div className="px-4 pb-6">
                        <div className="bg-[#383a40] rounded-lg">
                            <div className="flex items-center px-4 py-3 gap-3">
                                <button className="w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity">
                                    <Gift className="w-5 h-5 text-[#b5bac1]" />
                                </button>
                                <input
                                    value={text}
                                    onChange={handleTyping}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder={`Message ${selectedChat.isGroupChat ? '#' + getChatDetails(selectedChat).name : '@' + getChatDetails(selectedChat).name}`}
                                    className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-[#6d6f78]"
                                />
                                <div className="flex items-center gap-2">
                                    <button className="w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity">
                                        <Smile className="w-5 h-5 text-[#b5bac1]" />
                                    </button>
                                    {text.trim() ? (
                                        <button
                                            onClick={sendMessage}
                                            className="w-8 h-8 bg-[#5865f2] hover:bg-[#4752c4] rounded flex items-center justify-center transition-colors"
                                        >
                                            <Send className="w-4 h-4 text-white" />
                                        </button>
                                    ) : (
                                        <button className="w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity">
                                            <Paperclip className="w-5 h-5 text-[#b5bac1]" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1b1e; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0f1011; }
            `}</style>
        </div>
    );
}