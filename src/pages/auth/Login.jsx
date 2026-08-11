import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, loginGoogle } from "../../lib/supabase";
import "../../css/auth/Login.css";

export default function App() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        async function checkSession() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                navigate("/home");
            }
        }

        checkSession();
    }, [navigate]);

    async function handleLogin() {
        navigate("/home");
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Bem-vindo</h1>
                <p className="subtitle">Entre para continuar</p>

                <div className="input-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Digite o seu Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Senha</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite a sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    className="show-password"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? "Ocultar senha" : "Mostrar senha"}
                </button>

                <button className="login-btn" onClick={handleLogin}>
                    Entrar
                </button>

                <div className="divider">
                    <span>ou</span>
                </div>

                <button className="google-btn" onClick={loginGoogle}>
                    Entrar com Google
                </button>
            </div>
        </div>
    );
}
