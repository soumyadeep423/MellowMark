const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const router = express.Router();

// MongoDB User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// Signup Route
router.post(
    "/signup",
    [
        body("username").notEmpty().withMessage("Username is required"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        try {
            let user = await User.findOne({ username });
            if (user) {
                return res.status(400).json({ error: "Username already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            user = new User({ username, password: hashedPassword });

            await user.save();
            res.json({ success: true, message: "User registered successfully!" });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    }
);

// Login Route
router.post(
    "/login",
    [
        body("username").notEmpty().withMessage("Username is required"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        try {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(400).json({ error: "Invalid username or password" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid username or password" });
            }

            const token = jwt.sign({ userId: user._id }, "secretKey", { expiresIn: "1h" });

            res.json({ success: true, token });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    }
);

// Middleware to Protect Routes
const authenticateUser = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Received Authorization Header:", authHeader); // Debugging

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No or invalid token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token after "Bearer"
    try {
        const decoded = jwt.verify(token, "secretKey"); // Verify JWT
        req.userId = decoded.userId; // Attach user ID to request
        next();
    } catch (error) {
        console.error("JWT Verification Failed:", error);
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

module.exports = { router, authenticateUser };
