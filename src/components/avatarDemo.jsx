import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AvatarDemo() {
  return (
    <div className="flex flex-row flex-wrap items-center gap-12">
      <Avatar className="w-12 h-12 rounded-lg">
        <AvatarImage src="/logo.png" alt="logo" />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
    </div>
  );
}

export default AvatarDemo;
