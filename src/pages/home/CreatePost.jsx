import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Navbar from "../../components/navbar.jsx";
import "../../css/home/CreatePost.css";

export default function CreatePost() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [capacity, setCapacity] = useState("");

    const [images, setImages] = useState([]);

    useEffect(() => {
        async function checkProfile() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                navigate("/");
                return;
            }

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            const isComplete =
                profileData?.cep && profileData?.address && profileData?.number;

            if (!isComplete) {
                navigate("/complete-profile");
                return;
            }

            setLoading(false);
        }

        checkProfile();
    }, [navigate]);

    function handleImageChange(e) {
        setImages([...e.target.files]);
    }

    async function uploadImages(postId) {
        const urls = [];

        for (const file of images) {
            const extension = file.name.split(".").pop();

            const name = file.name
                .replace(/\.[^/.]+$/, "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9-_ ]/g, "")
                .replace(/\s+/g, "-");

            const fileName = `${Date.now()}-${name}.${extension}`;

            const { error } = await supabase.storage
                .from("posts_images")
                .upload(fileName, file);

            if (error) {
                console.error(error);
                continue;
            }

            const { data } = supabase.storage
                .from("posts_images")
                .getPublicUrl(fileName);

            urls.push(data.publicUrl);

            await supabase.from("post_images").insert({
                post_id: postId,
                url: data.publicUrl,
            });
        }

        return urls;
    }

    async function handleSubmit() {
        if (!title || !description || !price || !capacity) {
            alert("Preencha todos os campos!");
            return;
        }

        setSaving(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            // 1. cria post
            const { data: post, error } = await supabase
                .from("posts")
                .insert({
                    owner_id: user.id,
                    title,
                    description,
                    price: Number(price),
                    capacity: Number(capacity),
                })
                .select()
                .single();

            if (error) throw error;

            // 2. upload imagens
            if (images.length > 0) {
                await uploadImages(post.id);
            }

            alert("Anúncio criado com sucesso!");
            navigate("/home");
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <h2>Verificando permissões...</h2>;
    }

    return (
        <>
            <Navbar />

            <main className="create-page">
                <div className="create-card">
                    <h1>Criar anúncio</h1>
                    <p className="subtitle">
                        Preencha as informações da hospedagem.
                    </p>

                    <div className="form-group">
                        <label>Título</label>
                        <input
                            placeholder="Ex.: Casa na praia"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Descrição</label>
                        <textarea
                            placeholder="Descreva sua hospedagem..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Preço por noite</label>
                            <input
                                type="number"
                                placeholder="R$ 0,00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Capacidade</label>
                            <input
                                type="number"
                                placeholder="4 pessoas"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Fotos</label>

                        <input
                            className="file-input"
                            type="file"
                            multiple
                            onChange={handleImageChange}
                        />

                        {images.length > 0 && (
                            <span className="images-count">
                                📷 {images.length} imagem(ns) selecionada(s)
                            </span>
                        )}
                    </div>

                    <button
                        className="publish-btn"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? "Publicando..." : "Publicar anúncio"}
                    </button>
                </div>
            </main>
        </>
    );
}
