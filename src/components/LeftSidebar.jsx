export default function LeftSidebar() {
    return (
        <aside className="w-64 shrink-0 p-4">
            <ul className="space-y-3 text-sm p-4">
                <li><a href="#" className="text-blue-600 hover:underline">🏷 Tags</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">🕑 Recent Posts</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">📂 Categories</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">👤 About Me</a></li>
            </ul>
        </aside>
    );
}