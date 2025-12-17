import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAllUsers } from '../redux/slices/auth.slice'

import { initSocket } from "../redux/slices/socket.slice";
import { fetchMessagesByUserId } from "../redux/slices/chat.slice";

export default function Chat() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const socket = useSelector((state) => state.socket.socket);
  const authState = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
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
        const res = await dispatch (fetchAllUsers ());
        const filteredUsers = res.payload.users.filter(
            (user) => user._id !== authState.data._id
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

  /* ================= Fetch Messages on User Select ================= */
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await dispatch (fetchMessagesByUserId (selectedUser?._id));
        setMessages(res.payload);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  /* ================= Socket Listener ================= */
  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", (msg) => {
      // Only append if message belongs to active chat
      if (
        selectedUser &&
        (msg.sender === selectedUser._id ||
          msg.receiver === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receive-message");
  }, [socket, selectedUser]);

  /* ================= Auto Scroll ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= Send Message ================= */
  const sendMessage = () => {
    if (!selectedUser || !text.trim()) return;

    const newMessage = {
      content: text,
      sender: authState.data._id,
      receiver: selectedUser._id,
    };

    socket.emit("send-message", newMessage);

    // Optimistic UI
    // setMessages((prev) => [...prev, newMessage]);
    setText("");
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* ================= Sidebar ================= */}
      <div className="w-72 bg-white border-r flex flex-col">
        <div className="p-4 border-b font-semibold text-lg">Users</div>

        <div className="flex-1 overflow-y-auto">
          {usersLoading && (
            <p className="text-sm text-gray-400 p-4">Loading users...</p>
          )}

          {!usersLoading && users.length === 0 && (
            <p className="text-sm text-gray-400 p-4">No users found</p>
          )}

          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setMessages([]);
              }}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer
                ${
                  selectedUser?._id === user._id
                    ? "bg-blue-50"
                    : "hover:bg-gray-100"
                }`}
            >
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user.username[0].toUpperCase()}
              </div>

              <div className="truncate">
                <p className="font-medium truncate">{user.username}</p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Chat Area ================= */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b shadow flex items-center">
          {selectedUser ? (
            <>
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="font-semibold">{selectedUser.username}</p>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </>
          ) : (
            <p className="text-gray-400">
              Select a user to start chatting
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!selectedUser ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              👈 Click on a user to view messages
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.sender === authState.data._id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow
                      ${
                        msg.sender === authState.data._id
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none"
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              selectedUser
                ? "Type a message..."
                : "Select a user to chat"
            }
            disabled={!selectedUser}
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={!selectedUser}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-5 py-2 rounded-full text-sm font-medium transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
