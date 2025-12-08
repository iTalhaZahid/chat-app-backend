import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ConversationSchema = new Schema({

    type:{
        type: String,
        enum: ['direct', 'group'],
        required: true
    },
    name:String,
    participants:[{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    lastMessage:{
        type: Schema.Types.ObjectId,
        ref: "Message",
    },

    createdBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    avatar:{
        type: String,
        default: "",
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
    updatedAt:{
        type: Date,
        default: Date.now,
    }
});


// Middleware to update 'updatedAt' before saving
ConversationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    // next();
});

export default  model("Conversation", ConversationSchema);