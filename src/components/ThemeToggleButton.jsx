import { Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "/src/contexts/ThemeProvider";

export default function ThemeToggleButton() {
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
      className={`flex items-center gap-2 px-1 py-2 rounded-lg ${theme === "light" ? " text-foreground/80" : " text-secondary-foreground"} transition-all duration-300 ${isAnimating ? "scale-95" : "scale-100"}`}
    >
      <div className="relative w-5 h-5">
        <div
          className={`transition-all duration-500 ${
            theme === "light" ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
          } absolute`}
        >
          <Sun className="h-5 w-5" />
        </div>

        <div
          className={`transition-all duration-500 ${
            theme === "dark" ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          } absolute`}
        >
          <Moon className="h-5 w-5" />
        </div>
      </div>

      <span className="text-sm font-medium">
        {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      </span>
    </button>
  );
}
