interface PrestoQLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export function PrestoQLogo({ className = "", variant = "light" }: PrestoQLogoProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square background */}
      <rect
        x="20"
        y="20"
        width="160"
        height="160"
        rx="40"
        fill={variant === "light" ? "#000000" : "#FFFFFF"}
      />
      
      {/* Large circle */}
      <circle
        cx="95"
        cy="90"
        r="45"
        fill={variant === "light" ? "#FFFFFF" : "#000000"}
      />
      
      {/* Small circle (dot) */}
      <circle
        cx="145"
        cy="140"
        r="18"
        fill={variant === "light" ? "#FFFFFF" : "#000000"}
      />
    </svg>
  );
}
