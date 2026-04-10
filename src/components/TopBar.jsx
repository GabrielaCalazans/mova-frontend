import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModalOverlay, ModalContent, MenuItem, HeaderIcons } from "../styles/authStyle";
import { House, Menu, User, Clock, HeadphonesIcon, Settings, LogOut } from "lucide-react";

function TopBar() {
    const navigate = useNavigate();
    const [menuVisible, setMenuVisible] = useState(false);

    const menuItems = [
        { label: "Perfil", icon: <User size={18} />, route: "/perfil" },
        { label: "Histórico", icon: <Clock size={18} />, route: "/historico" },
        { label: "Suporte", icon: <HeadphonesIcon size={18} />, route: "/suporte" },
        { label: "Configurações", icon: <Settings size={18} />, route: "/configuracoes" },
    ];

    return (
        <>
            <HeaderIcons>
                <Menu
                    size={28}
                    strokeWidth={1.5}
                    color="#003366"
                    onClick={() => setMenuVisible(true)}
                    style={{ cursor: "pointer" }}
                />
                <House
                    size={28}
                    strokeWidth={1.5}
                    color="#003366"
                    onClick={() => navigate("/login")}
                    style={{ cursor: "pointer" }}
                />
            </HeaderIcons>

            {menuVisible && (
                <ModalOverlay onClick={() => setMenuVisible(false)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        {menuItems.map(({ label, icon, route }) => (
                            <MenuItem
                                key={route}
                                onClick={() => { setMenuVisible(false); navigate(route); }}
                                style={{ display: "flex", alignItems: "center", gap: "10px" }}
                            >
                                {icon}
                                {label}
                            </MenuItem>
                        ))}

                        <MenuItem
                            onClick={() => { setMenuVisible(false); navigate("/login"); }}
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