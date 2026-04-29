import { useTheme } from "../contexts/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { useState } from "react";

export default function ThemeToggleButtonLandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center w-10 h-10 rounded-full 
        ${
          theme === "light"
            ? "bg-primary/10 text-primary"
            : "bg-secondary text-secondary-foreground"
        } 
        shadow-md transition-all duration-300 cursor-pointer
        ${isAnimating ? "scale-90" : "scale-100"}`}
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      <div
        className={`transition-transform duration-500 ease-in-out ${
          theme === "light" ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
        } absolute`}
      >
        <Sun
          className={`h-5 w-5 ${
            theme === "light" ? "text-primary" : "text-secondary"
          }`}
        />
      </div>
      <div
        className={`transition-transform duration-500 ease-in-out ${
          theme === "dark" ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
        } absolute`}
      >
        <Moon
          className={`h-5 w-5 ${
            theme === "light" ? "text-secondary" : "text-primary"
          }`}
        />
      </div>
    </button>
  );
}
