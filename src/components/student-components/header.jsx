/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  ClipboardList,
  MessageSquare,
  User,
  LogOut,
  House,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggleButton from "@/components/ThemeToggleButton";

import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
import { useChatStore } from "@/stores/chatStore";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

import AvatarDemo from "../avatarDemo";

export function Header({ currentPage, setCurrentPage }) {
  const { logout, user } = useAuthStore();
  const profile = useUserStore((s) => s.profile);

  const inboxUnread = useChatStore((s) => s.inboxUnread);
  const subscribeInboxUnread = useChatStore((s) => s.subscribeInboxUnread);
  const refreshInboxUnread = useChatStore((s) => s.refreshInboxUnread);

  const [profileImgUrl, setProfileImgUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeInboxUnread();
    refreshInboxUnread();
    return () => unsub?.();
  }, [subscribeInboxUnread, refreshInboxUnread]);

  useEffect(() => {
    const path = profile?.profileImageURL;

    if (!path) {
      setProfileImgUrl("");
      return;
    }

    const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
    setProfileImgUrl(data?.publicUrl || "");
  }, [profile?.profileImageURL]);

  const onLogoutClick = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const goProfile = () => {
    navigate("/profile");
  };

  const avatarSrc = profileImgUrl || user?.avatar || "";

  const menuItems = [
    { id: "home", label: "Home", icon: House },
    { id: "survey", label: "Survey", icon: ClipboardList },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/student-portal")}
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center overflow-hidden">
            <AvatarDemo />
          </div>

          {/* optional: hide text on extra small screens */}
          <span className="text-lg font-bold text-foreground">BISU-DRS</span>
        </div>

        {/* Navigation + Profile (always visible) */}
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`relative flex items-center gap-2 px-3 sm:px-4 h-9 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  aria-label={item.label}
                  title={item.label}
                >
                  <span className="relative inline-flex items-center">
                    <Icon className="w-4 h-4 shrink-0" />

                    {item.id === "chat" && inboxUnread > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center leading-none">
                        {inboxUnread > 99 ? "99+" : inboxUnread}
                      </span>
                    )}
                  </span>

                  {/* ✅ hide only text on small screens */}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-11 h-11 overflow-hidden p-0"
                aria-label="Open profile menu"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setProfileImgUrl("")}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-50">
              <DropdownMenuItem>
                <ThemeToggleButton />
              </DropdownMenuItem>

              <DropdownMenuItem onClick={goProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onLogoutClick}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
