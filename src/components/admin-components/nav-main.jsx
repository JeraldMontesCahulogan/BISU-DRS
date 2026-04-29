// nav-main.jsx
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

function NewIndicator({ collapsed = false, isActive = false }) {
  return (
    <span
      className={[
        collapsed
          ? "absolute -top-1 -right-1"
          : "ml-auto relative flex items-center gap-2",
      ].join(" ")}
    >
      <span
        className={[
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          "bg-primary",
          "ring-2 ring-background",
          isActive
            ? "shadow-[0_0_0_2px_hsl(var(--primary)/0.12)]"
            : "shadow-[0_0_0_3px_hsl(var(--primary)/0.16)]",
        ].join(" ")}
        aria-hidden="true"
      />
      {!collapsed && (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-none bg-primary/10 text-primary border border-primary/20">
          New
        </span>
      )}
    </span>
  );
}

export function NavMain({ items, onSelect }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-base font-semibold">
        Platform
      </SidebarGroupLabel>

      <SidebarMenu className="mt-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = !!item.isActive;

          const indicator = item.hasIndicator ? (
            <NewIndicator collapsed={collapsed} isActive={isActive} />
          ) : null;

          const button = (
            <Button
              variant={isActive ? "default" : "ghost"}
              onClick={() => onSelect?.(item.id)}
              className={[
                "w-full h-10 flex items-center relative",
                collapsed
                  ? "justify-center px-0"
                  : "justify-start gap-3 px-3 pr-3",

                // ✅ HARD-KILL any box-shadow from global CSS + focus-visible
                "[box-shadow:none]",
                "data-[state=open]:[box-shadow:none]",
                "data-[state=closed]:[box-shadow:none]",
                "hover:[box-shadow:none]",
                "focus:[box-shadow:none]",
                "focus-visible:[box-shadow:none]",

                // optional: also avoid outline/ring visuals if any
                "outline-none focus-visible:outline-none",
              ].join(" ")}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {!collapsed && <span className="truncate">{item.title}</span>}
              {indicator}
            </Button>
          );

          return (
            <Collapsible key={item.id} asChild defaultOpen={isActive}>
              {/* ✅ ALSO kill shadow on the Collapsible root (this receives data-state="open") */}
              <SidebarMenuItem
                className={[
                  "[box-shadow:none]",
                  "data-[state=open]:[box-shadow:none]",
                  "data-[state=closed]:[box-shadow:none]",
                ].join(" ")}
              >
                <CollapsibleTrigger asChild>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    button
                  )}
                </CollapsibleTrigger>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
