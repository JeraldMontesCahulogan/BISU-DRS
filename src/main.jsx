import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      {/* <Toaster position="top-right" toastOptions={{ duration: 5000 }} richColors /> */}
      <Toaster position="top-right" />
    </ThemeProvider>
  </StrictMode>,
);
