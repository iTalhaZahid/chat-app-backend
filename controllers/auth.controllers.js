import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token.js";


export const registerUser = async (req, res) => {
    // Registration logic will go here

    const { email, password, name, avatar } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" });
            return;
        }
        //create new user
        user = new User({
            email,
            password,
            name,
            avatar: avatar || ""
        });

        //hash the password before saving to database
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        //save the user to database
        await user.save();

        //gen token (JWT) logic will go here
        const token = generateToken(user);

        res.status(201).json({ success: true, token });

    } catch (error) {
        console.log('error:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const loginUser = async (req, res) => {
    // Registration logic will go here

    const { email, password } = req.body;
    try {
        //find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }
        //compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }

        //gen token (JWT) logic will go here
        const token = generateToken(user);
        res.status(200).json({ success: true, token });


    } catch (error) {
        console.log('error:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}