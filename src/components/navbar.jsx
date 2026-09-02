import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

import addAdIcon from "../assets/add_ad.svg";
import chatIcon from "../assets/chat.svg";
import logoutIcon from "../assets/logout.svg";
import adIcon from "../assets/ad.svg";
import homeIcon from "../assets/home.svg";
import profileIcon from "../assets/profile.svg";

import "../css/components/Navbar.css";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [menuOpen, setMenuOpen] = useState(false);

    async function handleLogout() {
        await supabase.auth.signOut();
        setMenuOpen(false);
        navigate("/", { replace: true });
    }

    function handleNavigate(path) {
        setMenuOpen(false);
        navigate(path);
    }

    // Fecha o menu ao mudar de página
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Impede o scroll da página enquanto o menu estiver aberto
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    <h2
                        className="navbar-logo"
                        onClick={() => handleNavigate("/home")}
                    >
                        Oka
                    </h2>

                    {/* Menu desktop */}
                    <div className="navbar-menu">
                        <button
                            className={
                                location.pathname === "/home" ? "active" : ""
                            }
                            onClick={() => handleNavigate("/home")}
                        >
                            <img src={homeIcon} alt="" />
                            <span>Início</span>
                        </button>

                        <button
                            className={
                                location.pathname === "/my-posts"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => handleNavigate("/my-posts")}
                        >
                            <img src={adIcon} alt="" />
                            <span>Meus anúncios</span>
                        </button>

                        <button
                            className={
                                location.pathname === "/chats" ? "active" : ""
                            }
                            onClick={() => handleNavigate("/chats")}
                        >
                            <img src={chatIcon} alt="" />
                            <span>Chats</span>
                        </button>

                        <button
                            className="create-btn"
                            onClick={() => handleNavigate("/create-post")}
                        >
                            <img src={addAdIcon} alt="" />
                            <span>Criar anúncio</span>
                        </button>

                        {/* Perfil */}
                        <button
                            className={
                                location.pathname === "/profile" ? "active" : ""
                            }
                            onClick={() => handleNavigate("/profile")}
                        >
                            <img src={profileIcon} alt="" />
                            <span>Perfil</span>
                        </button>

                        {/* Sair */}
                        <button className="logout-btn" onClick={handleLogout}>
                            <img src={logoutIcon} alt="" />
                            <span>Sair</span>
                        </button>
                    </div>

                    {/* Botão hamburguer */}
                    <button
                        className={`hamburger ${menuOpen ? "open" : ""}`}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                        aria-expanded={menuOpen}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>

            {/* Overlay */}
            <div
                className={`menu-overlay ${menuOpen ? "show" : ""}`}
                onClick={() => setMenuOpen(false)}
            />

            {/* Menu mobile */}
            <aside className={`mobile-menu ${menuOpen ? "open" : ""}`}>
                <div className="mobile-menu-header">
                    <span>Menu</span>
                </div>

                <div className="mobile-menu-items">
                    <button
                        className={
                            location.pathname === "/home" ? "active" : ""
                        }
                        onClick={() => handleNavigate("/home")}
                    >
                        <img src={homeIcon} alt="" />
                        <span>Início</span>
                    </button>

                    <button
                        className={
                            location.pathname === "/my-posts" ? "active" : ""
                        }
                        onClick={() => handleNavigate("/my-posts")}
                    >
                        <img src={adIcon} alt="" />
                        <span>Meus anúncios</span>
                    </button>

                    <button
                        className={
                            location.pathname === "/chats" ? "active" : ""
                        }
                        onClick={() => handleNavigate("/chats")}
                    >
                        <img src={chatIcon} alt="" />
                        <span>Chats</span>
                    </button>

                    <button
                        className="create-btn"
                        onClick={() => handleNavigate("/create-post")}
                    >
                        <img src={addAdIcon} alt="" />
                        <span>Criar anúncio</span>
                    </button>

                    <div className="mobile-menu-divider" />

                    <button
                        className={
                            location.pathname === "/profile" ? "active" : ""
                        }
                        onClick={() => handleNavigate("/profile")}
                    >
                        <img src={profileIcon} alt="" />
                        <span>Perfil</span>
                    </button>

                    <button className="mobile-logout" onClick={handleLogout}>
                        <img src={logoutIcon} alt="" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
