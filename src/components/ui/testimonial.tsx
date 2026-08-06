 
import { cn } from "@/lib/utils";

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  imageUrl: string;
};

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "KSR made shipping my business parcels across India incredibly reliable. Always on time, always tracked.",
    name: "Rahul Sharma",
    role: "Business Owner",
    imageUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=600",
  },
  {
    quote:
      "Sent medicines to my family abroad with zero hassle. They handled customs and kept me updated throughout.",
    name: "Priya Reddy",
    role: "International Shipper",
    imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=600",
  },
  {
    quote:
      "Best courier service in Hyderabad. Friendly team, fair pricing, and my fragile items arrived perfectly.",
    name: "Ananya Mehta",
    role: "Regular Customer",
    imageUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=600&h=600&auto=format&fit=crop",
  },
];

type TestimonialCardsProps = {
  testimonials?: TestimonialItem[];
  className?: string;
  cardClassName?: string;
  compact?: boolean;
};

export function TestimonialCards({
  testimonials = DEFAULT_TESTIMONIALS,
  className,
  cardClassName,
  compact = false,
}: TestimonialCardsProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-6", className)}>
      {testimonials.map((testimonial) => (
        <article
          key={testimonial.name}
          className={cn(
            "max-w-80 rounded-2xl bg-black text-white",
            compact && "max-w-[220px] text-sm",
            cardClassName
          )}
        >
          <div className="relative -mt-px overflow-hidden rounded-2xl">
            <img
              src={testimonial.imageUrl}
              alt={testimonial.name}
              className={cn(
                "h-[270px] w-full rounded-2xl object-cover object-top transition-all duration-300 hover:scale-105",
                compact && "h-[160px]"
              )}
            />
            <div
              className={cn(
                "pointer-events-none absolute bottom-0 z-10 h-60 w-full bg-gradient-to-t from-black to-transparent",
                compact && "h-24"
              )}
            />
          </div>
          <div className={cn("px-4 pb-4", compact && "px-3 pb-3")}>
            <p className={cn("border-b border-gray-600 pb-5 font-medium", compact && "pb-3 text-xs leading-relaxed line-clamp-3")}>
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <p className={cn("mt-4", compact && "mt-2 text-xs")}>&mdash; {testimonial.name}</p>
            <p className="bg-gradient-to-r from-[#8B5CF6] via-[#E0724A] to-[#9938CA] bg-clip-text text-sm font-medium text-transparent">
              {testimonial.role}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
