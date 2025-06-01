import Header from "./Header"
import Footer from "./Footer"
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar"

// { children } là nội dung bên trong layout (được truyền từ ngoài vào).
// min-h-screen: Chiều cao tối thiểu là 100% chiều cao màn hình.
// flex flex-col: Dùng Flexbox, chia dọc (column): Header, rồi content, rồi Footer.
// flex: Chia theo chiều ngang (mặc định của Flexbox).
// flex-1: Phần này chiếm toàn bộ không gian dọc còn lại (trừ header và footer).

export default function BlogLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 max-w-screen w-full mx-auto">
                <LeftSidebar />
                <main className="flex-1 p-4">
                    {children}
                </main>
                <RightSidebar />
            </div>
            <Footer />
        </div>
    );
}