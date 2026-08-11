import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrCreateConversation } from "../../lib/chat";
import { supabase } from "../../lib/supabase.js";
import Navbar from "../../components/navbar.jsx";

export default function PostPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPost() {
            setLoading(true);

            const { data: postData, error: postError } = await supabase
                .from("posts")
                .select("*")
                .eq("id", id)
                .single();

            if (postError) {
                console.error(postError);
                setLoading(false);
                return;
            }

            const { data: imagesData } = await supabase
                .from("post_images")
                .select("url")
                .eq("post_id", id);

            setPost({
                ...postData,
                post_images: imagesData || [],
            });

            setLoading(false);
        }

        loadPost();
    }, [id]);

    function formatPrice(value) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Number(value));
    }

    async function handleOpenChat() {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        if (!user || !post) return;

        const conversationId = await getOrCreateConversation(post, user.id);

        if (conversationId) {
            navigate(`/chat/${conversationId}`);
        }
    }

    if (loading) return <h2>Carregando...</h2>;

    if (!post) return <h2>Post não encontrado</h2>;

    return (
        <>
            <Navbar />

            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                {/* GALERIA */}
                {post.post_images.length > 0 ? (
                    post.post_images.map((img, index) => (
                        <img
                            key={index}
                            src={img.url}
                            alt="Casa"
                            style={{
                                width: "100%",
                                marginBottom: 10,
                                borderRadius: 10,
                                objectFit: "cover",
                            }}
                        />
                    ))
                ) : (
                    <p>Sem imagens disponíveis</p>
                )}

                <h1>{post.title}</h1>
                <p>{post.description}</p>

                <h3>{formatPrice(post.price)} / noite</h3>
                <p>👥 até {post.capacity} pessoas</p>

                {/* CHAT BUTTON REAL */}
                <button
                    onClick={handleOpenChat}
                    style={{
                        marginTop: 20,
                        padding: 12,
                        width: "100%",
                        background: "#111",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                    }}
                >
                    Conversar com o dono
                </button>
            </div>
        </>
    );
}
