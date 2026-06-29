type LogoProps = {
  size?: number;
  hasLogo?: boolean;
  src?: string | null;
  className?: string;
};

/**
 * Renders the configured logo image when one exists (decided on the server),
 * otherwise a self-contained SVG emblem that can never break.
 */
export default function Logo({
  size = 44,
  hasLogo = false,
  src = null,
  className = "",
}: LogoProps) {
  if (hasLogo && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Bakery logo"
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Bakery logo"
      style={{ width: size, height: size }}
    >
      <defs>
        <linearGradient id="logoRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0a0b0" />
          <stop offset="1" stopColor="#c2607a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#fff6f1" stroke="url(#logoRing)" strokeWidth="2.5" />
      <circle
        cx="50"
        cy="50"
        r="41"
        fill="none"
        stroke="#eccfca"
        strokeWidth="1"
        strokeDasharray="1.5 3.5"
      />
      <path
        d="M50 28c-1.6-3-7-3-7 1.4 0 3 4 5.6 7 8 3-2.4 7-5 7-8 0-4.4-5.4-4.4-7-1.4z"
        fill="#d98ca0"
      />
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="40"
        fontWeight="700"
        fill="#5a3220"
      >
        H
      </text>
    </svg>
  );
}
