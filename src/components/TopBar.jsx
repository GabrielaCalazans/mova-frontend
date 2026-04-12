import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModalOverlay, ModalContent, MenuItem, HeaderIcons } from "../styles/authStyle";
import { House, Menu, User, Clock, HeadphonesIcon, Settings, LogOut } from "lucide-react";
import { clearAuthSession, getAuthSession } from "../services/authSession";

function resolveHomeRoute() {
    const session = getAuthSession();
    const user = session?.user;
    const isLocador = user?.profileType === "locador" || user?.empresa || user?.cnpj;
    return isLocador ? "/conta" : "/tipos-carros";
}

function TopBar() {
    const navigate = useNavigate();
    const [menuVisible, setMenuVisible] = useState(false);

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
                    color="#003366"
                    onClick={() => setMenuVisible(true)}
                    onKeyDown={(event) => handleKeyAction(event, () => setMenuVisible(true))}
                    style={{ cursor: "pointer" }}
                />
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