// nav-user.jsx
/* eslint-disable react-hooks/set-state-in-effect */
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

export function NavUser({ user, profile, onSelectPage }) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [profileImgUrl, setProfileImgUrl] = useState("");

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

  const name = useMemo(() => {
    const full =
      `${profile?.firstname || ""} ${profile?.lastname || ""}`.trim();
    return full || user?.name || "User";
  }, [profile?.firstname, profile?.lastname, user?.name]);

  const avatarSrc = profileImgUrl || user?.avatar || "";
  const letter = (name || "U").charAt(0).toUpperCase();

  const goProfile = () => {
    onSelectPage?.("profile");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarSrc} alt={name} />
                <AvatarFallback className="rounded-lg">{letter}</AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {profile?.firstname} {profile?.lastname}
                </span>
                <span className="truncate text-xs">{profile?.email}</span>
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem
              className="p-2 rounded-lg cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                goProfile();
              }}
            >
              <div className="flex items-center gap-2 text-left text-sm w-full">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarSrc} alt={name} />
                  <AvatarFallback className="rounded-lg">
                    {letter}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {profile?.firstname} {profile?.lastname}
                  </span>
                  <span className="truncate text-xs">{profile?.email}</span>
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <ThemeToggleButton />
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onLogoutClick}>
              <LogOut />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
