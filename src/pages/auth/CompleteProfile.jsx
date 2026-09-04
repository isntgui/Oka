import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import "../../css/auth/CompleteProfile.css";

export default function CompleteProfile() {
    const navigate = useNavigate();

    const [cep, setCep] = useState("");
    const [address, setAddress] = useState("");
    const [number, setNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [cepError, setCepError] = useState("");

    const abortControllerRef = useRef(null);

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

    function handleCepChange(value) {
        const cleaned = value.replace(/\D/g, "");
        const formatted = cleaned.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);

        setCep(formatted);
    }

    return (
        <div className="complete-profile-container">
            <div className="complete-profile-card">
                <h1>Complete seu perfil</h1>

                <p className="complete-profile-subtitle">
                    Precisamos dessas informações para continuar
                </p>

                <div className="complete-profile-input-group">
                    <label>CEP</label>

                    <input
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                    />

                    {loadingCep && (
                        <small className="cep-status">
                            Buscando endereço...
                        </small>
                    )}

                    {cepError && (
                        <small className="cep-error">{cepError}</small>
                    )}
                </div>

                <div className="complete-profile-input-group">
                    <label>Endereço</label>

                    <input
                        type="text"
                        placeholder="Endereço"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>

                <div className="complete-profile-input-group">
                    <label>Número</label>

                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Número"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                    />
                </div>

                <button
                    className="complete-profile-button"
                    onClick={handleSubmit}
                    disabled={loading || loadingCep}
                >
                    {loading ? "Salvando..." : "Salvar"}
                </button>
            </div>
        </div>
    );
}
