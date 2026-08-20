import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModalOverlay, ModalContent, MenuItem, HeaderIcons } from "../styles/authStyle";
<<<<<<< HEAD
import { Menu, User, Clock, HeadphonesIcon, Settings, LogOut, Sun, Moon } from "lucide-react";
import { clearAuthSession } from "../services/authSession";
import { useTheme } from "../context/ThemeContext";
import movaLogo from "../assets/mova_logo.png";

function TopBar({ showLogo = false, iconColor }) {
    const navigate = useNavigate();
    const { temaEscuro, toggleTemaEscuro } = useTheme();
    const [menuVisible, setMenuVisible] = useState(false);
    const resolvedIconColor = iconColor || "var(--color-primary)";
=======
import { House, Menu, User, Clock, HeadphonesIcon, Settings, LogOut } from "lucide-react";
import { resolveAuthRoute } from "../services/authIdentity";
import { clearAuthSession, getAuthSession } from "../services/authSession";

function resolveHomeRoute() {
    const session = getAuthSession();
    return resolveAuthRoute(session?.user);
}

function TopBar() {
    const navigate = useNavigate();
    const [menuVisible, setMenuVisible] = useState(false);
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244

    function handleKeyAction(event, action) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            action();
        }
    }

    const menuItems = [
        { label: "Minha Conta", icon: <User size={18} />, route: "/conta" },
        { label: "Histórico", icon: <Clock size={18} />, route: "/historico" },
        { label: "Suporte", icon: <HeadphonesIcon size={18} />, route: "/suporte" },
        { label: "Configurações", icon: <Settings size={18} />, route: "/configuracoes" },
    ];

    return (
        <>
            <HeaderIcons>
                <Menu
                    aria-label="Abrir menu"
                    role="button"
                    tabIndex={0}
                    size={28}
                    strokeWidth={1.5}
<<<<<<< HEAD
                    color={resolvedIconColor}
=======
                    color="#003366"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
                    onClick={() => setMenuVisible(true)}
                    onKeyDown={(event) => handleKeyAction(event, () => setMenuVisible(true))}
                    style={{ cursor: "pointer" }}
                />
<<<<<<< HEAD

                {showLogo && (
                    <img
                        src={movaLogo}
                        alt="Mova Logo"
                        style={{ width: "70px", cursor: "default" }}
                    />
                )}

                {/* Espaco reservado do lado direito para manter a logo centralizada
                    (a navegacao para o inicio agora fica no menu inferior, sempre visivel). */}
                {showLogo && <span aria-hidden="true" style={{ width: 28, display: "inline-block" }} />}
=======
                <House
                    aria-label="Ir para tela inicial"
                    role="button"
                    tabIndex={0}
                    size={28}
                    strokeWidth={1.5}
                    color="#003366"
                    onClick={() => navigate(resolveHomeRoute())}
                    onKeyDown={(event) => handleKeyAction(event, () => navigate(resolveHomeRoute()))}
                    style={{ cursor: "pointer" }}
                />
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
            </HeaderIcons>

            {menuVisible && (
                <ModalOverlay onClick={() => setMenuVisible(false)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        {menuItems.map(({ label, icon, route }) => (
                            <MenuItem
                                key={route}
                                role="button"
                                tabIndex={0}
                                onClick={() => { setMenuVisible(false); navigate(route); }}
                                onKeyDown={(event) => handleKeyAction(event, () => { setMenuVisible(false); navigate(route); })}
                                style={{ display: "flex", alignItems: "center", gap: "10px" }}
                            >
                                {icon}
                                {label}
                            </MenuItem>
                        ))}

                        <MenuItem
<<<<<<< HEAD
                            role="switch"
                            aria-checked={temaEscuro}
                            aria-label={temaEscuro ? "Desativar tema escuro" : "Ativar tema escuro"}
                            tabIndex={0}
                            onClick={toggleTemaEscuro}
                            onKeyDown={(event) => handleKeyAction(event, toggleTemaEscuro)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}
                        >
                            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {temaEscuro ? <Moon size={18} /> : <Sun size={18} />}
                                {temaEscuro ? "Tema Escuro" : "Tema Claro"}
                            </span>
                            <span
                                aria-hidden="true"
                                style={{
                                    width: 34,
                                    height: 18,
                                    borderRadius: 999,
                                    background: temaEscuro ? "var(--color-brand-fill)" : "#c8c8c8",
                                    position: "relative",
                                    flexShrink: 0,
                                    transition: "background 150ms",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        top: 2,
                                        left: temaEscuro ? 18 : 2,
                                        width: 14,
                                        height: 14,
                                        borderRadius: "50%",
                                        background: "#fff",
                                        transition: "left 150ms",
                                    }}
                                />
                            </span>
                        </MenuItem>

                        <MenuItem
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                setMenuVisible(false);
                                clearAuthSession();
                                navigate("/login", { replace: true });
                            }}
                            onKeyDown={(event) => handleKeyAction(event, () => {
                                setMenuVisible(false);
                                clearAuthSession();
                                navigate("/login", { replace: true });
                            })}
                            style={{ display: "flex", alignItems: "center", gap: "10px", color: "#c0392b", fontWeight: "700" }}
                        >
                            <LogOut size={18} color="#c0392b" />
                            Sair
                        </MenuItem>
                    </ModalContent>
                </ModalOverlay>
            )}
        </>
    );
}

export default TopBar;