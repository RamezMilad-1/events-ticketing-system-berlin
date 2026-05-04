const SIZES = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4',
};

const Loader = ({ size = 'md', label, fullScreen = false, className = '' }) => {
    const ring = (
        <div
            className={`animate-spin rounded-full border-slate-200 border-t-primary-600 ${SIZES[size] || SIZES.md} ${className}`}
            role="status"
            aria-label={label || 'Loading'}
        />
    );

    if (fullScreen) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-600">
                {ring}
                {label && <p className="text-sm font-medium">{label}</p>}
            </div>
        );
    }

    return ring;
};

export default Loader;
