import mongoose from "mongoose";
const { Schema, model } = mongoose;

const messageSchema = new Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: String,
        attachment: String,
    },
    { timestamps: true }
);


export default model("Message", messageSchema);