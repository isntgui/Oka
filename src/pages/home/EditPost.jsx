import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Navbar from "../../components/navbar.jsx";

export default function EditPost() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [capacity, setCapacity] = useState("");

    const [image, setImage] = useState(null);

    useEffect(() => {
        async function loadPost() {
            setLoading(true);

            const { data: post } = await supabase
                .from("posts")
                .select(
                    `
                    *,
                    post_images (url)
                `,
                )
                .eq("id", id)
                .single();

            if (!post) {
                navigate("/my-posts");
                return;
            }

            setTitle(post.title);
            setDescription(post.description);
            setPrice(post.price);
            setCapacity(post.capacity);
            setImage(post.post_images?.[0]?.url || null);

            setLoading(false);
        }

        loadPost();
    }, [id, navigate]);

    async function handleUpdate() {
        if (!title || !description || !price || !capacity) {
            alert("Preencha todos os campos!");
            return;
        }

        setSaving(true);

        const { error } = await supabase
            .from("posts")
            .update({
                title,
                description,
                price: Number(price),
                capacity: Number(capacity),
            })
            .eq("id", id);

        setSaving(false);

        if (error) {
            console.error(error);
            alert("Erro ao atualizar post");
            return;
        }

        alert("Post atualizado com sucesso!");
        navigate("/my-posts");
    }

    if (loading) return <h2>Carregando...</h2>;

    return (
        <>
            <Navbar />

            <div style={{ maxWidth: 500, margin: "0 auto" }}>
                <h1>Editar anúncio</h1>

                {/* IMAGE PREVIEW */}
                {image && (
                    <img
                        src={image}
                        alt="preview"
                        style={{
                            width: "100%",
                            height: 200,
                            objectFit: "cover",
                            borderRadius: 10,
                            marginBottom: 10,
                        }}
                    />
                )}

                <input
                    placeholder="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                    placeholder="Descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                />

                <input
                    type="number"
                    placeholder="Preço"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Capacidade"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                />

                <button onClick={handleUpdate} disabled={saving}>
                    {saving ? "Salvando..." : "Atualizar"}
                </button>
            </div>
        </>
    );
}
