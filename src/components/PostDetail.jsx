import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PostDetail() {
    const { id } = useParams();     // get id from URL
    const [post, setPost] = useState("");

    useEffect(() => {
        fetch(`http://localhost:3000/posts/${id}`, {
            method: "GET",
            credentials: "include"
        })
            .then((res) => res.json())
            .then((data) => setPost(data))
            .catch((err) => {
                console.error(err);
            });
    }, [id]);

    if (!post) return (<p className="p-4">Post not found</p>)
    return (
        <div className="mx-auto">
            <div key={id} className="p-4 shadow">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-sm text-gray-500">
                    posted day: {new Date(post.created_at).toLocaleString()}
                </p>
                <p className="mt-2 line-clamp-3">
                    {post.content}
                </p>
            </div>
        </div>
    );
}