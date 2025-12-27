const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        isGroupChat: {
            type: Boolean,
            default: false,
        },

        // ✅ ONLY for group chats
        chatName: {
            type: String,
            trim: true,
            required: function () {
                return this.isGroupChat === true;
            },
        },

        // Optional but recommended for groups
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: function () {
                return this.isGroupChat === true;
            },
        },

        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },

        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

/* ---------- INDEXES ---------- */
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
