const EmptyState = ({
    icon = '📭',
    title = 'Nothing here yet',
    description = '',
    action,
    className = '',
}) => (
    <div className={`rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center ${className}`}>
        <div className="text-5xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold text-navy-600 mb-1.5">{title}</h3>
        {description && <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
    </div>
);

export default EmptyState;
