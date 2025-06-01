import { useEffect, useState } from "react"

export default function PostList() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch("http://localhost:3000/posts", {
            method: "GET",
            credentials: "include"
        })
            .then((res) => res.json())
            .then((data) => setPosts(data))
            .catch((err) => {
                console.error(err);
            });
    }, []);

    // useEffect(() => {
    //     fetch("http://api.backendtips.site/posts", {
    //         method: "GET",
    //         credentials: "include"
    //     })
    //         .then((res) => res.json())
    //         .then((data) => setPosts(data))
    //         .catch((err) => {
    //             console.error(err);
    //         });
    // }, []);

    if (!posts || posts.length === 0) return (<p className="p-4">Post not found</p>);
    return (
        <div className="mx-auto">
            {
                posts.map((post) => (
                    <div key={post.id} className="p-4 shadow">
                        <h2 className="text-xl font-semibold">{post.title}</h2>
                        <p className="text-sm text-gray-500">
                            Posted day: {new Date(post.created_at).toLocaleString()}
                        </p>
                        <p className="mt-2 line-clamp-3">
                            {post.content.slice(0, 150)}...
                        </p>
                        <a href={`/posts/${post.id}`} className="text-blue-600 hover:underline">Continous reading →</a>
                    </div>
                ))
            }
        </div>
    );
}