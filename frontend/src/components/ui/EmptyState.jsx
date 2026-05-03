const EmptyState = ({
    icon = '📭',
    title = 'Nothing here yet',
    description = '',
    action,
    className = '',
}) => (
    <div className={`rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center ${className}`}>
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
        {description && <p className="text-slate-600 max-w-md mx-auto">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
    </div>
);

export default EmptyState;
