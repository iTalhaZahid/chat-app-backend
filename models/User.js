import { create } from "domain";
import { Schema, model } from "mongoose";
import { type } from "os";

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
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default model("User", UserSchema);