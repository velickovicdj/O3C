import React, { useState } from "react";
import { ReactComponent as LinkIcon } from "../assets/icons/link.svg";
import logo from "../assets/logo.png";

export default function Navbar(){
    const [isDarkThemeActive, setDarkThemeActive] = React.useState(localStorage.getItem("dark") ?? false);
    const [isMenuOpen, setMenuOpen] = useState(false);

	const switchTheme = () => {
		if (isDarkThemeActive){
			setDarkThemeActive(false);
			document.body.classList.remove("dark");
			localStorage.removeItem("dark");
		} else {
			setDarkThemeActive(true);
			document.body.classList.add("dark");
			localStorage.setItem("dark", true);
		}
	}
    return(
        <nav>
            <a href={window.location.href}>
                <div className="logo">
                    <img src={logo} alt="O3C Logo" draggable={false} />
                    <h1>O3C</h1>
                </div>
            </a>
            <div className={`burger-menu${isMenuOpen ? " open" : ""}`} onClick={() => setMenuOpen(!isMenuOpen)}>
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
            </div>
            <ul {...isMenuOpen && { className: "open" }}>
                <li onClick={switchTheme}>
                    {isDarkThemeActive ? "Switch to light mode" : "Switch to dark mode"}
                </li>
                <li>
                    <a href="https://github.com/velickovicdj/O3C">GitHub <LinkIcon /></a>
                </li>
            </ul>
        </nav>
    );
}