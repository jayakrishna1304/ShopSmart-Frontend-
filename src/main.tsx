import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { BrowserRouter } from "react-router-dom";

import { ThemeProvider } from "./Components/modecontext/modes";
import { LanguageProvider } from "./Components/language/LanguageContext";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <LanguageProvider>
                    <App />
                </LanguageProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>
);