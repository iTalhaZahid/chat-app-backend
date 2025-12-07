import mongoose from "mongoose";
const { Schema, model } = mongoose;

const messageSchema = new Schema(
    {
        conversationID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        senderID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            attachment: String,
        }
    },
    { timestamps: true }
);


export default model("Message", messageSchema);