import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "../../css/auth/Login.css";

export default function SignUp() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSignUp(e) {
        e.preventDefault();

        setError("");

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        alert("Conta criada com sucesso!");

        navigate("/");
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Criar conta</h1>
                <p className="subtitle">Cadastre-se para continuar</p>

                <form onSubmit={handleSignUp}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Digite o seu Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            placeholder="Digite a sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Confirmar senha</label>
                        <input
                            type="password"
                            placeholder="Digite a senha novamente"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? "Criando conta..." : "Criar conta"}
                    </button>
                </form>

                <div className="signup-container">
                    <span>Já possui uma conta?</span>

                    <button
                        className="signup-btn"
                        onClick={() => navigate("/")}
                    >
                        Entrar
                    </button>
                </div>
            </div>
        </div>
    );
}
