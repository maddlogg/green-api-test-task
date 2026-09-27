import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarWithInitialsProps {
  name: string;
  color: string;
  src?: string;
  className?: string;
}

export function AvatarWithInitials({
  name,
  color,
  src,
  className,
}: AvatarWithInitialsProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback
        style={{ backgroundColor: color }}
        className="text-white font-medium"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
