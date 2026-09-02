import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/navbar";
import "../../css/home/Profile.css";

export default function Profile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                navigate("/", { replace: true });
                return;
            }

            setUser(user);

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) throw error;

            setProfile(data);
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAvatarChange(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Selecione uma imagem.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5 MB.");
            return;
        }

        try {
            setUploading(true);

            const extension = file.name.split(".").pop();
            const filePath = `${user.id}/avatar.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file, {
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from("avatars").getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    avatar_url: publicUrl,
                })
                .eq("id", user.id);

            if (updateError) throw updateError;

            setProfile((prev) => ({
                ...prev,
                avatar_url: publicUrl,
            }));
        } catch (error) {
            console.error("Erro ao alterar foto:", error);
            alert("Não foi possível alterar a foto.");
        } finally {
            setUploading(false);

            // Permite selecionar a mesma imagem novamente
            event.target.value = "";
        }
    }

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="profile-page">
                    <div className="profile-card">
                        <p className="profile-loading">Carregando perfil...</p>
                    </div>
                </main>
            </>
        );
    }

    const avatar =
        profile?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture;

    const name =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        "Usuário";

    return (
        <>
            <Navbar />

            <main className="profile-page">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar">
                                {avatar ? (
                                    <img src={avatar} alt="Foto de perfil" />
                                ) : (
                                    user?.email?.charAt(0).toUpperCase()
                                )}
                            </div>

                            <button
                                className="change-avatar-button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? "Enviando..." : "Alterar foto"}
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                hidden
                            />
                        </div>

                        <div className="profile-user">
                            <h1>{name}</h1>
                            <p>{user?.email}</p>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h2>Informações pessoais</h2>

                        <div className="profile-info">
                            <span>Email</span>
                            <strong>{user?.email || "Não informado"}</strong>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h2>Endereço</h2>

                        <div className="profile-info">
                            <span>CEP</span>
                            <strong>{profile?.cep || "Não informado"}</strong>
                        </div>

                        <div className="profile-info">
                            <span>Endereço</span>
                            <strong>
                                {profile?.address || "Não informado"}
                            </strong>
                        </div>

                        <div className="profile-info">
                            <span>Número</span>
                            <strong>
                                {profile?.number || "Não informado"}
                            </strong>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button
                            className="profile-edit-button"
                            onClick={() => navigate("/complete-profile")}
                        >
                            Editar endereço
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
}
