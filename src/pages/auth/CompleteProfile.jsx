import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";

export default function CompleteProfile() {
    const navigate = useNavigate();

    const [cep, setCep] = useState("");
    const [address, setAddress] = useState("");
    const [number, setNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [cepError, setCepError] = useState("");

    const abortControllerRef = useRef(null);

    // 🔥 debounce CEP (UX profissional)
    useEffect(() => {
        const cleaned = cep.replace(/\D/g, "");

        if (cleaned.length !== 8) {
            setAddress("");
            setCepError("");
            return;
        }

        const timer = setTimeout(() => {
            fetchCEP(cleaned);
        }, 700);

        return () => clearTimeout(timer);
    }, [cep]);

    async function fetchCEP(cleaned) {
        try {
            setLoadingCep(true);
            setCepError("");

            // cancela request anterior (evita race condition)
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

            const res = await fetch(
                `https://viacep.com.br/ws/${cleaned}/json/`,
                { signal: abortControllerRef.current.signal },
            );

            const data = await res.json();

            if (data.erro) {
                setCepError("CEP não encontrado");
                setAddress("");
                return;
            }

            setAddress(
                `${data.logradouro}, ${data.bairro}, ${data.localidade}`,
            );
        } catch (err) {
            if (err.name !== "AbortError") {
                setCepError("Erro ao buscar CEP");
            }
        } finally {
            setLoadingCep(false);
        }
    }

    async function handleSubmit() {
        if (!cep || !address || !number) {
            alert("Preencha todos os campos!");
            return;
        }

        setLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("profiles")
                .update({
                    cep,
                    address,
                    number,
                })
                .eq("id", user.id);

            if (error) throw error;

            navigate("/home");
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }

    // máscara simples de CEP
    function handleCepChange(value) {
        const cleaned = value.replace(/\D/g, "");
        const formatted = cleaned.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);

        setCep(formatted);
    }

    return (
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
            <h1>Complete seu perfil</h1>
            <p>Precisamos dessas informações para continuar</p>

            {/* CEP */}
            <div style={{ marginBottom: 10 }}>
                <input
                    placeholder="CEP"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                />

                {loadingCep && <small>Buscando endereço...</small>}

                {cepError && <small style={{ color: "red" }}>{cepError}</small>}
            </div>

            {/* Endereço (auto ou editável) */}
            <input
                placeholder="Endereço"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
            />

            {/* Número */}
            <input
                placeholder="Número"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
            />

            <button onClick={handleSubmit} disabled={loading || loadingCep}>
                {loading ? "Salvando..." : "Salvar"}
            </button>
        </div>
    );
}
