import { create } from "domain";
import { Schema,model } from "mongoose";

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: ""
    },
    name: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default model("User", UserSchema);