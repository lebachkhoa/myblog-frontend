import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white shadow mb-6">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">My Blog</h1>
        <nav>
          <Link to="/" className="px-3 text-gray-700 hover:text-blue-600">Home</Link>
          <Link to="/login" className="px-3 text-gray-700 hover:text-blue-600">Login</Link>
          <Link to="/register" className="px-3 text-gray-700 hover:text-blue-600">Register</Link>
        </nav>
      </div>
    </header>
  );
}
