import { cn } from "../../lib/utils";
import "./AvatarList.css";

export interface AvatarData {
  name: string;
  position: string;
  image: string;
}

const DEFAULT_DATA: AvatarData[] = [
  {
    name: "Nishant",
    position: "Frontend Developer",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Pulkit",
    position: "ML Engineer",
    image:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Nandi Prasad",
    position: "Backend Developer",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Pranav",
    position: "PPT & Report",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
  },
];

export interface AvatarListProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  items?: AvatarData[];
}

export default function AvatarList({
  size = "sm",
  className = "",
  items,
}: AvatarListProps) {
  const avatars = items ?? DEFAULT_DATA;
  const sizePx = size === "lg" ? 38 : size === "md" ? 32 : 28;

  return (
    <div className={cn("avatar-list-container flex", className)}>
      {avatars.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className={cn(
            "avatar-item-wrapper group/avatar relative flex items-center",
            index > 0 && "-ml-2.5"
          )}
        >
          <div className="avatar-img-box relative overflow-hidden rounded-full bg-white">
            <img
              src={item.image}
              alt={item.name}
              style={{ width: sizePx, height: sizePx }}
              className="rounded-full object-cover"
              loading="lazy"
            />
          </div>
          <div
            className={cn(
              "avatar-tooltip",
              index === 0 && "avatar-tooltip-first",
              index === 1 && "avatar-tooltip-second"
            )}
          >
            <div className="avatar-tooltip-name">{item.name}</div>
            <div className="avatar-tooltip-role">{item.position}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
