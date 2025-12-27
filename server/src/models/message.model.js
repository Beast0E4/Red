const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
    {
        emoji: {
            type: String, 
            required: true,
        },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    reactions: [reactionSchema]
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/* ---------- INDEXES ---------- */
messageSchema.index({ chat: 1, createdAt: 1 });
// messageSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model("Message", messageSchema);
