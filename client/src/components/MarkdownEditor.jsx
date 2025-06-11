import { useState, useEffect } from "react";
import Showdown from "showdown";
import { useNavigate } from "react-router-dom";


export default function MarkdownEditor() {
    const [title, setTitle] = useState(""); // File name
    const [markdown, setMarkdown] = useState(""); // Markdown text
    const [message, setMessage] = useState(""); // Success/Error messages
    const [file, setFile] = useState(null); // Uploaded file
    const [files, setFiles] = useState([]); // List of user's files
    const [showDropdown, setShowDropdown] = useState(false); 
    const navigate = useNavigate();
    const [repoURL, setRepoURL] = useState(""); // GitHub repo link


    const converter = new Showdown.Converter({ tables: true });

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.backgroundColor = "#121212";
        document.body.style.color = "#E0E0E0";
        fetchUserFiles();
    }, []);

        // Fetch User's Saved Files
    const fetchUserFiles = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch("https://mellowmark.onrender.com/files", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
            });

            const data = await response.json();
            if (data.success) {
                setFiles(data.files);
            } else {
                setMessage("❌ Error fetching files.");
            }
        } catch (error) {
            console.log(error);
            setMessage("❌ Error fetching files.");
        }
    };

    // Handle Text Changes
    const handleTextChange = (e) => {
        setMarkdown(e.target.value);
    };

    // Save Markdown to MongoDB (Now includes JWT token)
    const saveMarkdown = async () => {
        if (!title) {
            setMessage("❌ Please enter a file name.");
            return;
        }

        const token = localStorage.getItem("token"); // Get JWT token
        if (!token) {
            setMessage("❌ Unauthorized. Please log in again.");
            return;
        }

        try {
            const response = await fetch("https://mellowmark.onrender.com/save", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // Attach token
                },
                body: JSON.stringify({ title, text: markdown }),
            });

            const data = await response.json();
            if (data.success) setMessage("✅ Markdown saved successfully!");
            else setMessage("❌ Failed to save document.");
        } catch (error) {
            console.log(error)
            setMessage("❌ Error saving file.");
        }
    };

    // Load Markdown from MongoDB
    const loadMarkdown = async (fileTitle) => {
        setTitle(fileTitle); // Set file title
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`https://mellowmark.onrender.com/load/${fileTitle}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
            });

            const data = await response.json();
            if (data.content) {
                setMarkdown(data.content);
                setMessage("✅ File loaded successfully!");
                setShowDropdown(false); // Close dropdown after selecting a file
            } else {
                setMessage("❌ File not found.");
            }
        } catch (error) {
            console.log(error);
            setMessage("❌ Error loading file.");
        }
    };


    // Handle File Upload
    const handleFileUpload = async () => {
        if (!file) {
            setMessage("❌ Please select a file.");
            return;
        }
    
        const token = localStorage.getItem("token"); // Get JWT token
        if (!token) {
            setMessage("❌ Unauthorized. Please log in again.");
            return;
        }
    
        const formData = new FormData();
        formData.append("file", file);
    
        try {
            const response = await fetch("https://mellowmark.onrender.com/upload", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }, // Attach token
                body: formData,
            });
    
            const data = await response.json();
            if (data.success) {
                setTitle(data.title);
                setMarkdown(data.content);
                setMessage("✅ File uploaded and loaded successfully!");
            } else {
                setMessage("❌ Upload failed.");
            }
        } catch (error) {
            console.log(error);
            setMessage("❌ Error uploading file.");
        }
    };
    

    const handleLogout = () => {
        localStorage.removeItem("token"); // Remove JWT token
        navigate("/login"); // Redirect to login page
    };

    const generateReadmeFromRepo = async () => {
        const token = localStorage.getItem("token");
        if (!repoURL) {
            setMessage("❌ Please enter a GitHub repo URL.");
            return;
        }

        try {
            const response = await fetch("https://mellowmark.onrender.com/generate-readme", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ url: repoURL })
            });

            const data = await response.json();
            if (data.success) {
                setTitle("Generated-README.md");
                setMarkdown(data.readme);
                setMessage("✅ README generated and saved!");
            } else {
                setMessage("❌ Failed to generate README.");
            }
        } catch (error) {
            console.log(error);
            setMessage("❌ Error generating README.");
        }
    };


    return (
        <div style={editorContainer}>
            <h1 style={headerStyle}>Mellow Mark.</h1>

            {/* Toolbar with File Name Input, Buttons & File Upload */}
            <div style={toolbarStyle}>
                {/* File Name Input */}
                <input
                    type="text"
                    placeholder="File name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                />
                
                {/* GitHub Repo Input and Generate Button */}
                <input
                    type="text"
                    placeholder="GitHub repo URL"
                    value={repoURL}
                    onChange={(e) => setRepoURL(e.target.value)}
                    style={{ width: "220px", padding: "8px", fontSize: "14px", borderRadius: "5px" }}
                />
                <button onClick={generateReadmeFromRepo} style={buttonStyle}>Generate README</button>

                {/* Save & Load Buttons */}
                <button onClick={saveMarkdown} style={buttonStyle}>Save</button>
                <button onClick={loadMarkdown} style={buttonStyle}>Load</button>

                {/* Styled File Input (Hidden) */}
                <label style={fileInputStyle}>
                    Choose File
                    <input type="file" accept=".md" onChange={(e) => setFile(e.target.files[0])} style={{ display: "none" }} />
                </label>

                {/* Upload & Load Button */}
                <button onClick={handleFileUpload} style={buttonStyle}>Upload & Load</button>

                {/* File Dropdown */}
                <div style={{ position: "relative" }}>
                    <button onClick={() => setShowDropdown(!showDropdown)} style={buttonStyle}>
                        Your Files ▼
                    </button>
                    {showDropdown && (
                        <div style={dropdownStyle}>
                            {files.length > 0 ? (
                                files.map((file) => (
                                    <div key={file.title} style={dropdownItemStyle} onClick={() => loadMarkdown(file.title)}>
                                        {file.title}
                                    </div>
                                ))
                            ) : (
                                <div style={dropdownItemStyle}>No files saved</div>
                            )}
                        </div>
                    )}
                </div>

                <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
            </div>

            {/* Message Box */}
            {message && <div style={messageStyle}>{message}</div>}

            {/* Editor Container */}
            <div style={editorWrapper}>
                {/* Markdown Input */}
                <textarea value={markdown} onChange={handleTextChange} style={textAreaStyle} placeholder="Enter Your Text Here......" />

                {/* Markdown Preview */}
                <div style={previewStyle} dangerouslySetInnerHTML={{ __html: converter.makeHtml(markdown) }} />
            </div>

            {/* Custom Table Styles */}
            <style>
                {`
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th, td {
                        border: 1px solid #666;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #333;
                        color: white;
                    }
                    tr:nth-child(even) {
                        background-color: #222;
                    }
                `}
            </style>
        </div>
    );
}

// Styles
const editorContainer = { height: "100vh", display: "flex", flexDirection: "column" };
const headerStyle = { fontFamily: "'Roboto Mono', monospace", textAlign: "center", padding: "10px", margin: "0", backgroundColor: "#0c0c0c", borderBottom: "1px solid #333" };
const toolbarStyle = { display: "flex", alignItems: "center", gap: "10px", padding: "10px", backgroundColor: "0e0e0e" };
const inputStyle = { width: "120px", padding: "8px", fontSize: "14px", textAlign: "center" };
const buttonStyle = { padding: "8px 12px", fontSize: "14px", backgroundColor: "#007BFF", color: "#fff", border: "none", cursor: "pointer", borderRadius: "5px" };
const fileInputStyle = { padding: "8px 12px", fontSize: "14px", backgroundColor: "#007BFF", color: "#fff", border: "none", cursor: "pointer", borderRadius: "5px", display: "inline-block" };
const messageStyle = { textAlign: "center", padding: "5px", color: "#FFD700" };
const editorWrapper = { display: "flex", height: "calc(100vh - 150px)", width: "99vw" };
const textAreaStyle = { 
    width: "50%", height: "100%", padding: "10px", fontSize: "16px", 
    backgroundColor: "#0e0e0e", color: "#E0E0E0", border: "1px solid white", 
    outline: "none", resize: "none", borderRadius: "5px" 
};

const previewStyle = { 
    width: "50%", height: "100%", padding: "10px", border: "1px solid white", 
    borderRadius: "5px", overflow: "auto", backgroundColor: "#1d1d1d", color: "#E0E0E0" 
};
// Logout Button Styles
const logoutButtonStyle = {
    padding: "10px 12px",
    fontSize: "14px",
    backgroundColor: "#FF4136",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    marginLeft: "auto",
};
const dropdownStyle = { position: "absolute", top: "35px", left: "0", width: "150px", backgroundColor: "#1E1E1E", border: "1px solid #333", borderRadius: "5px", boxShadow: "0px 4px 10px rgba(255, 255, 255, 0.2)", zIndex: 10 };
const dropdownItemStyle = { padding: "8px", cursor: "pointer", borderBottom: "1px solid #444", color: "#E0E0E0" };
