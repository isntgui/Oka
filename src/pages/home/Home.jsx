import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Navbar from "../../components/navbar.jsx";
import "../../css/home/home.css";

export default function Home() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                navigate("/");
                return;
            }

            setUser(user);

            const { data: postsData } = await supabase
                .from("posts")
                .select(
                    `
                    *,
                    post_images (url)
                `,
                )
                .neq("owner_id", user.id)
                .order("created_at", { ascending: false });

            setPosts(postsData || []);
            setLoading(false);
        }

        load();
    }, [navigate]);

    if (loading) return <h2>Carregando...</h2>;

    function formatPrice(value) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Number(value));
    }

    return (
        <>
            <Navbar />

            <div className="home">
                <h1 className="home-title">Hospedagens disponíveis</h1>

                <div className="posts-grid">
                    {posts.map((post) => {
                        const image = post.post_images?.[0]?.url;

                        return (
                            <div
                                key={post.id}
                                className="post-card"
                                onClick={() => navigate(`/post/${post.id}`)}
                            >
                                <div className="post-image">
                                    <img
                                        src={
                                            image ||
                                            "https://via.placeholder.com/400x300"
                                        }
                                        alt={post.title}
                                    />

                                    <div className="post-overlay">
                                        <h3>{post.title}</h3>
                                    </div>
                                </div>

                                <div className="post-content">
                                    <p className="post-description">
                                        {post.description}
                                    </p>

                                    <div className="post-footer">
                                        <strong className="price">
                                            {formatPrice(post.price)}
                                            <span>/ noite</span>
                                        </strong>

                                        <span className="capacity">
                                            👥 {post.capacity} pessoas
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
