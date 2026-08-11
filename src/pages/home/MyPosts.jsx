import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Navbar from "../../components/navbar.jsx";

export default function MyPosts() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
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

            const { data } = await supabase
                .from("posts")
                .select(
                    `
                    *,
                    post_images (url)
                `,
                )
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false });

            setPosts(data || []);
            setLoading(false);
        }

        load();
    }, [navigate]);

    async function handleDelete(id) {
        const confirm = window.confirm("Deseja deletar este anúncio?");
        if (!confirm) return;

        await supabase.from("posts").delete().eq("id", id);

        setPosts((prev) => prev.filter((p) => p.id !== id));
    }

    function formatPrice(value) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Number(value));
    }

    if (loading) return <h2>Carregando...</h2>;

    return (
        <>
            <Navbar />

            <h1>Meus anúncios</h1>

            {posts.length === 0 ? (
                <p>Você ainda não criou anúncios.</p>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: 20,
                    }}
                >
                    {posts.map((post) => {
                        const image = post.post_images?.[0]?.url;

                        return (
                            <div
                                key={post.id}
                                style={{
                                    borderRadius: 16,
                                    overflow: "hidden",
                                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                                    background: "#fff",
                                }}
                            >
                                {/* IMAGE */}
                                <img
                                    src={
                                        image ||
                                        "https://via.placeholder.com/400x300"
                                    }
                                    style={{
                                        width: "100%",
                                        height: 160,
                                        objectFit: "cover",
                                    }}
                                />

                                {/* INFO */}
                                <div style={{ padding: 12 }}>
                                    <h3>{post.title}</h3>

                                    <p style={{ fontSize: 14 }}>
                                        {post.description}
                                    </p>

                                    <strong>
                                        {formatPrice(post.price)} / noite
                                    </strong>

                                    <p>👥 até {post.capacity} pessoa(s)</p>

                                    {/* ACTIONS */}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            marginTop: 10,
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/edit-post/${post.id}`,
                                                )
                                            }
                                        >
                                            Editar
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(post.id)
                                            }
                                            style={{
                                                background: "red",
                                                color: "white",
                                            }}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
