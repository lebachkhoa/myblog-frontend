import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:3000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, username, password }),
            })

            // const res = await fetch("https://api.backendtips.site/auth/register", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ email, username, password }),
            // })

            if (res.ok) {
                setMessage("User registered successfully");
                setTimeout(() => {
                    navigate("/");      // to Homepage
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
        // ===== div =====
        // min-h-screen: Chiều cao tối thiểu bằng toàn bộ chiều cao màn hình (100vh)
        // flex: Dùng Flexbox để căn giữa nội dung
        // items-center: Căn giữa theo trục dọc
        // justify-center: Căn giữa theo trục ngang
        // bg-gray-100: Nền màu xám rất nhạt

        // ===== form =====
        // bg-white: Nền màu trắng
        // p-6: Padding cả bốn phía 1.5rem
        // rounded: Bo góc mặc định (0.25rem)
        // shadow-md: Bóng đổ trung bình (tạo cảm giác nổi lên)
        // w-80: Chiều rộng 20rem (~320px)

        // ===== h2 =====
        // text-xl: Cỡ chữ lớn (~1.25rem)
        // font-bold: Chữ đậm
        // mb-4: Margin-bottom 1rem

        // ===== label =====
        // block: Biến label thành block element (xuống dòng)
        // mb-1: Margin-bottom 0.25rem

        // ===== input =====
        // w-full: Rộng 100% form cha
        // border: Viền mặc định (1px solid gray)
        // p-2: Padding 0.5rem
        // mb-4: Margin-bottom 1rem
        // rounded: Bo góc nhẹ

        // ===== button =====
        // w-full: Rộng 100%
        // bg-blue-500: Nền màu xanh vừa
        // text-white: Chữ màu trắng
        // p-2: Padding 0.5rem
        // rounded: Bo góc nhẹ
        // hover:bg-blue-600: Khi hover, nền đậm hơn

        // ===== p =====
        // text-sm: Cỡ chữ nhỏ
        // text-red-500: Màu đỏ (để hiển thị lỗi)
        // mt-2: Margin-top 0.5rem

        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
                <h2 className="text-xl font-bold mb-4">Register</h2>
                <label className="block mb-1">Email:</label>
                <input
                    type="text" value={email} onChange={(e) => { setEmail(e.target.value) }}
                    className="w-full border p-2 mb-4 rounded"
                />
                <label className="block mb-1">Username:</label>
                <input
                    type="text" value={username} onChange={(e) => { setUsername(e.target.value) }}
                    className="w-full border p-2 mb-4 rounded"
                />
                <label className="block mb-1">Username:</label>
                <input
                    type="text" value={password} onChange={(e) => { setPassword(e.target.value) }}
                    className="w-full border p-2 mb-4 rounded"
                />
                <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Register</button>
                <p className="text-sm text-red-500 mt-2" >{message}</p>
            </form>
        </div>
    );
}