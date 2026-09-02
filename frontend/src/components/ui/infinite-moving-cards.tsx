import { cn } from "@/lib/utils";
import "./infinite-moving-cards.css";

export interface TestimonialItem {
  quote: string;
  name: string;
  title: string;
}

interface InfiniteMovingCardsProps {
  items: TestimonialItem[];
  className?: string;
  speed?: "fast" | "normal" | "slow";
}

export function InfiniteMovingCards({
  items,
  className = "",
  speed = "normal",
}: InfiniteMovingCardsProps) {
  // Duplicate array so marquee scrolls continuously and seamlessly
  const duplicatedItems = [...items, ...items];

  const durationStyle =
    speed === "fast" ? "30s" : speed === "slow" ? "75s" : "50s";

  return (
    <div className={cn("moving-cards-container", className)}>
      <div
        className="moving-cards-track"
        style={{ animationDuration: durationStyle }}
      >
        {duplicatedItems.map((item, idx) => (
          <div key={`${item.name}-${idx}`} className="moving-card">
            <blockquote className="moving-card-quote">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <div className="moving-card-footer">
              <span className="moving-card-name">{item.name}</span>
              <span className="moving-card-title">{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InfiniteMovingCards;
