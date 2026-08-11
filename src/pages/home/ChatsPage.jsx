import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Navbar from "../../components/navbar.jsx";

export default function ChatsPage() {
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChats();
    }, []);

    async function loadChats() {
        setLoading(true);

        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
            setLoading(false);
            return;
        }
        setUserId(user.id);

        const { data: convs, error } = await supabase
            .from("conversations")
            .select("*")
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar conversas:", error);
            setLoading(false);
            return;
        }

        // Para cada conversa, busca o perfil do outro usuário
        // last_message já existe na tabela conversations, então não precisa
        // buscar em messages (economiza N queries)
        const withDetails = await Promise.all(
            (convs || []).map(async (chat) => {
                const otherId =
                    chat.user1_id === user.id ? chat.user2_id : chat.user1_id;

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("name, avatar_url")
                    .eq("id", otherId)
                    .maybeSingle();

                return {
                    ...chat,
                    other_user: profile || {
                        name: "Usuário",
                        avatar_url: null,
                    },
                    // usa last_message da própria tabela conversations
                    // (atualizado pelo Chat ao enviar mensagem)
                    last_message: chat.last_message || "Sem mensagens",
                };
            }),
        );

        setChats(withDetails);
        setLoading(false);
    }

    function formatTime(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const oneDay = 86400000;

        if (diff < oneDay && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        if (diff < 7 * oneDay) {
            return date.toLocaleDateString("pt-BR", { weekday: "short" });
        }
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
        });
    }

    function getInitials(name = "") {
        return name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--surface-0)" }}>
            <Navbar />

            <div
                style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 2rem" }}
            >
                <div
                    style={{
                        padding: "1.25rem 1rem 0.75rem",
                        borderBottom: "0.5px solid var(--border)",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                        }}
                    >
                        Mensagens
                    </h1>
                </div>

                {loading && (
                    <div
                        style={{
                            padding: "3rem 1rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: 14,
                        }}
                    >
                        Carregando conversas...
                    </div>
                )}

                {!loading && chats.length === 0 && (
                    <div
                        style={{
                            padding: "3rem 1rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: 14,
                        }}
                    >
                        Nenhuma conversa ainda.
                    </div>
                )}

                {!loading &&
                    chats.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => navigate(`/chat/${chat.id}`)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                width: "100%",
                                padding: "0.875rem 1rem",
                                background: "transparent",
                                border: "none",
                                borderBottom: "0.5px solid var(--border)",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                    "var(--surface-1)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                    "transparent")
                            }
                        >
                            {/* Avatar */}
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: 46,
                                    height: 46,
                                    borderRadius: "50%",
                                    background: chat.other_user?.avatar_url
                                        ? "transparent"
                                        : "var(--bg-accent)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "hidden",
                                    fontSize: 15,
                                    fontWeight: 500,
                                    color: "var(--text-accent)",
                                }}
                            >
                                {chat.other_user?.avatar_url ? (
                                    <img
                                        src={chat.other_user.avatar_url}
                                        alt=""
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    getInitials(chat.other_user?.name || "")
                                )}
                            </div>

                            {/* Texto */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "baseline",
                                        marginBottom: 2,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            fontSize: 15,
                                            color: "var(--text-primary)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {chat.other_user?.name || "Usuário"}
                                    </span>
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            marginLeft: 8,
                                            fontSize: 12,
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        {formatTime(chat.updated_at)}
                                    </span>
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 13,
                                        color: "var(--text-secondary)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {chat.last_message}
                                </p>
                            </div>
                        </button>
                    ))}
            </div>
        </div>
    );
}
