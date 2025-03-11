var express = require("express");
var mongoose = require("mongoose");
var cors = require("cors");
var multer = require("multer");
var fs = require("fs");
var path = require("path");
var app = express();


app.use(cors());
app.use(express.json());
const { router: authRoutes, authenticateUser } = require("./auth");
app.use("/auth", authRoutes);

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017");

// MongoDB Document Schema (Per User)
const DocumentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    content: String,
    createdAt: { type: Date, default: Date.now },
});

const Document = mongoose.model("Document", DocumentSchema);

// Multer Storage (For File Uploads)
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
var upload = multer({ storage: storage });

// Create 'uploads' folder if it doesn't exist
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

//  Fix File Upload Endpoint
app.post("/upload", authenticateUser, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = path.join(__dirname, "uploads", req.file.filename);
        const fileContent = fs.readFileSync(filePath, "utf8");

        // Save to MongoDB with userId
        await new Document({
            userId: req.userId,  // Attach user ID from the token
            title: req.file.filename,
            content: fileContent
        }).save();

        res.json({ success: true, title: req.file.filename, content: fileContent });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Error uploading file" });
    }
});

// Save Markdown to Database (User-Specific)
app.post("/save", authenticateUser, async (req, res) => {
    try {
        const { title, text } = req.body;
        const existingDoc = await Document.findOne({ userId: req.userId, title });

        if (existingDoc) {
            existingDoc.content = text;
            await existingDoc.save();
        } else {
            await new Document({ userId: req.userId, title, content: text }).save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error saving file" });
    }
});

// Load Markdown from Database (User-Specific)
app.get("/load/:title", authenticateUser, async (req, res) => {
    try {
        const doc = await Document.findOne({ userId: req.userId, title: req.params.title });
        if (doc) {
            res.json({ content: doc.content });
        } else {
            res.status(404).json({ error: "File not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error loading file" });
    }
});

// Get List of User's Saved Files
app.get("/files", authenticateUser, async (req, res) => {
    try {
        const files = await Document.find({ userId: req.userId }).select("title createdAt");
        res.json({ success: true, files });
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ error: "Error fetching files" });
    }
});


// Start Server
var port = 8000;
app.listen(port, () => {
    console.log(`Server running ...`);
});
