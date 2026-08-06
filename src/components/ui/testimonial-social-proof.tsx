 
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATARS = [
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop",
  "https://randomuser.me/api/portraits/men/75.jpg",
];

type TestimonialSocialProofProps = {
  className?: string;
  rating?: number;
  userCount?: string;
};

export function TestimonialSocialProof({
  className,
  rating = 4.9,
  userCount = "50,000+",
}: TestimonialSocialProofProps) {
  return (
    <div className={cn("flex items-center divide-x divide-gray-300", className)}>
      <div className="flex -space-x-3 pr-3">
        {AVATARS.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              "h-10 w-10 rounded-full border-2 border-white object-cover transition hover:-translate-y-1 sm:h-12 sm:w-12",
              index === 0 && "z-[1]",
              index === 1 && "z-[2]",
              index === 2 && "z-[3]",
              index === 3 && "z-[4]"
            )}
          />
        ))}
      </div>
      <div className="pl-3">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className="h-4 w-4 fill-yellow-400 text-yellow-400"
              aria-hidden
            />
          ))}
          <p className="ml-2 font-medium text-gray-600">{rating.toFixed(1)}</p>
        </div>
        <p className="text-sm text-gray-500">
          Trusted by <span className="font-medium text-gray-800">{userCount}</span> customers
        </p>
      </div>
    </div>
  );
}
