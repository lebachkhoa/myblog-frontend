import BlogLayout from "../components/BlogLayout";
import PostList from "../components/PostList";

export default function HomePage() {
    return (
        <BlogLayout>
            <PostList />
        </BlogLayout>
    );
}