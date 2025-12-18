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
  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  /* ---------------- Typing ---------------- */
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  const bottomRef = useRef(null);

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
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const res = await dispatch(fetchAllUsers());

        const filteredUsers = res.payload.users.filter(
          (u) => u._id !== authState.data._id
        );

        setUsers(filteredUsers);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  /* ================= Fetch Messages ================= */
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      const res = await dispatch(
        fetchMessagesByUserId(selectedUser._id)
      );
      setMessages(res.payload);
    };

    fetchMessages();
  }, [selectedUser]);

  /* ================= Socket Listeners ================= */
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      if (
        selectedUser &&
        (msg.sender === selectedUser._id ||
          msg.receiver === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("message", handleMessage);

    socket.on("typing:start", ({ sender }) => {
      if (sender === selectedUser?._id) {
        setTypingUser(sender);
      }
    });

    socket.on("typing:stop", ({ sender }) => {
      if (sender === selectedUser?._id) {
        setTypingUser(null);
      }
    });

    return () => {
      socket.off("message", handleMessage);
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [socket, selectedUser]);

  /* ================= Auto Scroll ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* ================= Send Message ================= */
  const sendMessage = () => {
    if (!selectedUser || !text.trim()) return;

    socket.emit("send-message", {
      sender: authState.data._id,
      receiver: selectedUser._id,
      content: text,
    });

    setText("");
  };

  /* ================= Typing Handler ================= */
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


  return (
    <div className="h-screen flex bg-gray-100">
      {/* ================= Sidebar ================= */}
      <div className="w-72 bg-white border-r flex flex-col">
        <div className="p-4 border-b font-semibold text-lg">Users</div>

        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setMessages([]);
              }}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${
                selectedUser?._id === user._id
                  ? "bg-blue-50"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {user.username[0].toUpperCase()}
              </div>

              <div>
                <p className="font-medium">{user.username}</p>
                {chatState.onlineUsers?.includes (user._id.toString()) && (
                  <p className="text-xs text-green-500">Online</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Chat Area ================= */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 bg-white border-b">
          {selectedUser ? (
            <>
              <p className="font-semibold">{selectedUser.username}</p>
              {typingUser && (
                <TypingIndicator username={selectedUser.username} />
              )}

            </>
          ) : (
            <p className="text-gray-400">Select a user to start chatting</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isMe={msg.sender === authState.data._id}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-white border-t flex gap-3">
          <input
            value={text}
            onChange={handleTyping}
            disabled={!selectedUser}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2"
          />
          <button
            onClick={sendMessage}
            disabled={!selectedUser}
            className="bg-blue-500 text-white px-5 py-2 rounded-full"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
