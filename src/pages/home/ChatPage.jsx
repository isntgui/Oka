import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";

export default function ChatPage() {
    const { conversationId } = useParams();

    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [userId, setUserId] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!conversationId) {
            setError(
                "ID da conversa não encontrado. Verifique o nome do parâmetro na rota.",
            );
            setLoading(false);
            return;
        }
        initChat();
    }, [conversationId]);

    useEffect(() => {
        if (!userId || !conversationId) return;

        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages((prev) => {
                        const exists = prev.some(
                            (m) => m.id === payload.new.id,
                        );
                        if (exists) return prev;
                        return [...prev, payload.new];
                    });
                },
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [conversationId, userId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function initChat() {
        setLoading(true);
        setError(null);

        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
            setError("Usuário não autenticado.");
            setLoading(false);
            return;
        }
        setUserId(user.id);

        // Busca a conversa incluindo o post para ter mais contexto
        const { data: conv, error: convError } = await supabase
            .from("conversations")
            .select("*, posts(title)")
            .eq("id", conversationId)
            .maybeSingle();

        if (convError || !conv) {
            setError("Conversa não encontrada.");
            setLoading(false);
            return;
        }

        // Descobre qual é o outro usuário
        const otherId =
            conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

        const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", otherId)
            .maybeSingle();

        setOtherUser(profile || { name: "Usuário", avatar_url: null });

        // Busca mensagens
        const { data: msgs, error: msgsError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (msgsError) {
            console.error("Erro ao buscar mensagens:", msgsError);
        }

        setMessages(msgs || []);
        setLoading(false);
    }

    async function sendMessage() {
        const text = newMessage.trim();
        if (!text || sending || !conversationId || !userId) return;

        setSending(true);
        setNewMessage("");

        const optimistic = {
            id: `temp-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: userId,
            message: text,
            created_at: new Date().toISOString(),
            _pending: true,
        };

        setMessages((prev) => [...prev, optimistic]);

        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                message: text,
            })
            .select()
            .maybeSingle();

        if (!error && data) {
            setMessages((prev) =>
                prev.map((m) => (m.id === optimistic.id ? data : m)),
            );

            // Atualiza last_message e updated_at na conversa
            await supabase
                .from("conversations")
                .update({
                    last_message: text,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", conversationId);
        } else {
            console.error("Erro ao enviar:", error);
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            setNewMessage(text);
        }

        setSending(false);
        inputRef.current?.focus();
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function formatTime(dateStr) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
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

    function shouldShowTime(msgs, index) {
        if (index === 0) return true;
        const prev = new Date(msgs[index - 1].created_at);
        const curr = new Date(msgs[index].created_at);
        return curr - prev > 5 * 60 * 1000;
    }

    if (error) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100dvh",
                    gap: 12,
                    padding: "1rem",
                }}
            >
                <p
                    style={{
                        color: "var(--text-danger)",
                        fontSize: 14,
                        textAlign: "center",
                    }}
                >
                    {error}
                </p>
                <button
                    onClick={() => navigate(-1)}
                    style={{ fontSize: 13, cursor: "pointer" }}
                >
                    ← Voltar
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100dvh",
                background: "var(--surface-0)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "0.75rem 1rem",
                    borderBottom: "0.5px solid var(--border)",
                    background: "var(--surface-1)",
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={() => navigate(-1)}
                    aria-label="Voltar"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        border: "none",
                        borderRadius: "var(--radius)",
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        fontSize: 20,
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--surface-0)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                    }
                >
                    ←
                </button>

                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: otherUser?.avatar_url
                            ? "transparent"
                            : "var(--bg-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-accent)",
                        flexShrink: 0,
                    }}
                >
                    {otherUser?.avatar_url ? (
                        <img
                            src={otherUser.avatar_url}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        getInitials(otherUser?.name || "")
                    )}
                </div>

                <span
                    style={{
                        fontWeight: 500,
                        fontSize: 15,
                        color: "var(--text-primary)",
                    }}
                >
                    {otherUser?.name || "Carregando..."}
                </span>
            </div>

            {/* Mensagens */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {loading && (
                    <div
                        style={{
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: 13,
                            padding: "2rem 0",
                        }}
                    >
                        Carregando mensagens...
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: 13,
                            padding: "2rem 0",
                        }}
                    >
                        Nenhuma mensagem. Diga oi!
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isMine = msg.sender_id === userId;
                    const showTime = shouldShowTime(messages, i);

                    return (
                        <div key={msg.id}>
                            {showTime && (
                                <div
                                    style={{
                                        textAlign: "center",
                                        fontSize: 11,
                                        color: "var(--text-muted)",
                                        margin: "0.75rem 0 0.5rem",
                                    }}
                                >
                                    {formatTime(msg.created_at)}
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: isMine
                                        ? "flex-end"
                                        : "flex-start",
                                    marginBottom: 2,
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: "72%",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: isMine
                                            ? "16px 16px 4px 16px"
                                            : "16px 16px 16px 4px",
                                        background: isMine
                                            ? "var(--fill-accent)"
                                            : "var(--surface-2)",
                                        color: isMine
                                            ? "var(--on-accent)"
                                            : "var(--text-primary)",
                                        fontSize: 14,
                                        lineHeight: 1.45,
                                        wordBreak: "break-word",
                                        opacity: msg._pending ? 0.6 : 1,
                                        border: isMine
                                            ? "none"
                                            : "0.5px solid var(--border)",
                                        transition: "opacity 0.2s",
                                    }}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
                style={{
                    padding: "0.75rem 1rem",
                    borderTop: "0.5px solid var(--border)",
                    background: "var(--surface-1)",
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-end",
                    flexShrink: 0,
                }}
            >
                <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Mensagem..."
                    rows={1}
                    style={{
                        flex: 1,
                        resize: "none",
                        border: "0.5px solid var(--border-strong)",
                        borderRadius: 20,
                        padding: "0.5rem 0.875rem",
                        fontSize: 14,
                        lineHeight: 1.5,
                        background: "var(--surface-2)",
                        color: "var(--text-primary)",
                        outline: "none",
                        fontFamily: "var(--font-sans)",
                        maxHeight: 120,
                        overflowY: "auto",
                    }}
                    onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onFocus={(e) =>
                        (e.target.style.borderColor = "var(--border-accent)")
                    }
                    onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border-strong)")
                    }
                />

                <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    aria-label="Enviar mensagem"
                    style={{
                        flexShrink: 0,
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        border: "none",
                        background:
                            newMessage.trim() && !sending
                                ? "var(--fill-accent)"
                                : "var(--fill-disabled)",
                        color:
                            newMessage.trim() && !sending
                                ? "var(--on-accent)"
                                : "var(--text-disabled)",
                        cursor:
                            newMessage.trim() && !sending
                                ? "pointer"
                                : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        transition: "background 0.15s",
                    }}
                >
                    ↑
                </button>
            </div>
        </div>
    );
}
