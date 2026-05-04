/**
 * EarlyHub bird mark — navy outline with a coral wing swoosh and beak.
 * The full lockup ("EarlyHub" wordmark) splits "Early" navy / "Hub" coral.
 */

export const LogoMark = ({ size = 32, className = '' }) => (
    <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        {/* Bird body outline (navy) */}
        <path
            d="M22 50 L13 56 L13 47 C13 31 22 14 36 13 C49 12 54 22 54 32 C54 45 45 53 33 53 C28 53 24 52 22 50 Z"
            fill="#ffffff"
            stroke="#1e2c5e"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Beak (coral) */}
        <path d="M52 20 L60 18 L54 25 Z" fill="#f25445" />
        {/* Eye (navy) */}
        <circle cx="44" cy="22" r="1.7" fill="#1e2c5e" />
        {/* Inner wing swoosh — looks like a stylised "p" (coral) */}
        <path
            d="M30 47 L30 30 C30 25 33 22 38 22 C42.5 22 45 25.5 45 29.5 C45 33.5 42.2 36.5 37.5 36.5 L30 36.5"
            fill="none"
            stroke="#f25445"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const Logo = ({ size = 32, withWordmark = true, className = '' }) => (
    <span className={`inline-flex items-center gap-2 ${className}`}>
        <LogoMark size={size} />
        {withWordmark && (
            <span
                className="font-bold tracking-tight text-navy-600 leading-none"
                style={{ fontSize: Math.round(size * 0.7) }}
            >
                Early<span className="text-primary-500">Hub</span>
            </span>
        )}
    </span>
);

export default Logo;
