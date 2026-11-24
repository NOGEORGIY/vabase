export function LogoMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vabase-mark" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2f5cff" />
          <stop offset="1" stopColor="#1739e8" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="url(#vabase-mark)" />
      <circle cx="12.5" cy="13" r="4.2" stroke="white" strokeWidth="2.3" />
      <path d="M15.4 16 20 20.6" stroke="white" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="17.7" cy="29.2" r="4.3" fill="white" />
      <circle cx="30.3" cy="29.2" r="4.3" fill="white" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <LogoMark />
      <span className="brand-word">vabase</span>
    </span>
  );
}
