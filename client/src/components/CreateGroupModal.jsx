import { useState, useMemo } from "react";
import { X, Search, Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createGroupChat } from "../redux/slices/chat.slice";

export default function CreateGroupModal({ onClose }) {
    const authState = useSelector ((state) => state.auth);

    const dispatch = useDispatch();

    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const allUsers = authState.users;
    // 👆 BETTER: keep users in auth slice or users slice

    /* ================= Filter Users ================= */
    const availableUsers = useMemo(() => {
        return allUsers
            .filter((u) => u._id !== authState.data._id)
            .filter((u) =>
                u.username.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [allUsers, searchQuery, authState.data._id]);

    /* ================= Toggle User ================= */
    const handleToggleUser = (user) => {
        setSelectedUsers((prev) => {
            const exists = prev.some((u) => u._id === user._id);
            return exists
                ? prev.filter((u) => u._id !== user._id)
                : [...prev, user];
        });
    };

    /* ================= Submit ================= */
    const handleSubmit = async () => {
        if (!groupName || selectedUsers.length < 2) return;

        const userIds = [
            authState.data._id,
            ...selectedUsers.map((u) => u._id),
        ];

        await dispatch(
            createGroupChat({
                name: groupName.trim(),
                users: userIds,
            })
        );

        onClose();
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md bg-[#313338] rounded-lg shadow-2xl border border-black/20 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-[#1e1f22] flex justify-between">
                    <h2 className="text-white font-bold">Create a Playground</h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4 overflow-y-auto">
                    <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Playground name"
                        className="w-full bg-[#1e1f22] text-white p-2 rounded"
                    />

                    <div className="bg-[#1e1f22] rounded p-2 flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users"
                            className="bg-transparent text-white outline-none flex-1"
                        />
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {availableUsers.map((user) => {
                            const isSelected = selectedUsers.some(
                                (u) => u._id === user._id
                            );

                            return (
                                <div
                                    key={user._id}
                                    onClick={() => handleToggleUser(user)}
                                    className={`p-2 flex justify-between items-center rounded cursor-pointer ${
                                        isSelected
                                            ? "bg-[#404249]"
                                            : "hover:bg-[#35363c]"
                                    }`}
                                >
                                    <span className="text-white">
                                        {user.username}
                                    </span>
                                    {isSelected && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 flex justify-end">
                    <button
                        disabled={!groupName || selectedUsers.length < 2}
                        onClick={handleSubmit}
                        className="bg-indigo-600 px-4 py-2 rounded text-white disabled:opacity-50"
                    >
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
}
