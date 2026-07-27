type LocationMapProps = {
  variant?: "dark" | "light";
};

const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.386248624827!2d78.46720187527508!3d17.44121770125202!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb912f465d4da3%3A0xa8aef9da0a0d6dd0!2sKSR%20Shipping%20Services%20-%20A%20courier%20service.!5e0!3m2!1sen!2sin!4v1784878124306!5m2!1sen!2sin";

export function LocationMap({ variant = "dark" }: LocationMapProps) {
  const containerClass =
    variant === "light"
      ? "bg-white border-gray-200 shadow-[0_4px_20px_rgba(234,88,12,0.08)] h-[220px] sm:h-[260px]"
      : "bg-gray-800 border-gray-700 h-[200px]";

  return (
    <div className={`w-full rounded-xl overflow-hidden border relative ${containerClass}`}>
      <iframe
        src={MAP_EMBED_URL}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-full w-full"
        title="KSR Shipping Services location on Google Maps"
      />
    </div>
  );
}
