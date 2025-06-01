import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://localhost:3000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include"
            })

            // const res = await fetch("https://api.backendtips.site/auth/login", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ username, password }),
            //     credentials: "include"
            // })

            // await res.json();

            if (res.ok) {
                setMessage("Login successfully");
                setTimeout(() => {
                    navigate("/");          // to Homepage
                }, 1000);
            } else {
                const error = await res.json();
                setMessage(error.message);
            }
        } catch {
            setMessage("Error conect to server");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded shadow-md w-80"
            >
                <h2 className="text-xl font-bold mb-4">Login</h2>
                <label className="block mb-1">Email:</label>
                <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border p-2 mb-4 rounded"
                />
                <label className="block mb-1">Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border p-2 mb-4 rounded"
                />
                <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Login
                </button>
                <p className="text-sm text-red-500 mt-2">{message}</p>
            </form>
        </div>

    );
}