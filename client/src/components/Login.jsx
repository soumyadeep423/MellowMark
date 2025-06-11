import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; 


export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        setMessage(""); // Clear previous messages
        if (!username || !password) {
            setMessage("❌ All fields are required.");
            return;
        }

        try {
            const response = await fetch("https://mellowmark.onrender.com/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (data.success) {
                localStorage.setItem("token", data.token); // Store JWT token
                setMessage("✅ Login successful! Redirecting...");
                setTimeout(() => navigate("/editor"), 2000); // Redirect to the editor
            } else {
                setMessage(`❌ ${data.error}`);
            }
        } catch (error) {
            console.log(error)
            setMessage("❌ Error logging in.");
        }
    };

    return (
        <div style={pageContainer}>
            <div style={formContainer}>
                <img src={logo} alt="App Logo" style={logoStyle} />
                <h2>Login</h2>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
                <button onClick={handleLogin} style={buttonStyle}>Login</button>
                {message && <p style={messageStyle}>{message}</p>}
                <p>Don't have an account? <a href="/signup" style={linkStyle}>Signup here</a></p>
            </div>
        </div>
    );
}

// Styles
const logoStyle = { width: "100px"};
const pageContainer = { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", width: "100vw", backgroundColor: "#121212" };
const formContainer = { padding: "20px", borderRadius: "8px", boxShadow: "0px 4px 10px rgba(255, 255, 255, 0.2)", textAlign: "center", backgroundColor: "#1E1E1E", color: "#E0E0E0", width: "300px" };
const inputStyle = { width: "93%", padding: "10px", fontSize: "16px", borderRadius: "5px", border: "1px solid #555", backgroundColor: "#2E2E2E", color: "#E0E0E0", marginBottom: "10px" };
const buttonStyle = { width: "100%", padding: "10px", fontSize: "16px", backgroundColor: "#007BFF", color: "#fff", border: "none", cursor: "pointer", borderRadius: "5px" };
const messageStyle = { color: "#FFD700", textAlign: "center" };
const linkStyle = { color: "#007BFF", textDecoration: "none" };
