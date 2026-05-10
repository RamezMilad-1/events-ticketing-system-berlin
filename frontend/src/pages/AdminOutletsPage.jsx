import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, MapPin, Pencil, Trash2, Search, Power, X } from 'lucide-react';
import { outletService } from '../services/api';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const PAYMENT_OPTIONS = [
    { key: 'cash', label: 'Cash' },
    { key: 'visa', label: 'Visa' },
    { key: 'mastercard', label: 'Mastercard' },
    { key: 'apple_pay', label: 'Apple Pay' },
    { key: 'google_pay', label: 'Google Pay' },
    { key: 'sepa', label: 'SEPA' },
];

const blankForm = {
    name: '',
    address: '',
    city: 'Berlin',
    country: 'Germany',
    phone: '',
    email: '',
    workingHours: '',
    paymentMethods: ['cash', 'visa', 'mastercard'],
    image: '',
    active: true,
};

const AdminOutletsPage = () => {
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState(null); // null = new, otherwise outlet object
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await outletService.list();
                setOutlets(res.data?.data || []);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load outlets');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return outlets;
        return outlets.filter(
            (o) =>
                o.name?.toLowerCase().includes(q) ||
                o.address?.toLowerCase().includes(q) ||
                o.city?.toLowerCase().includes(q)
        );
    }, [outlets, searchQuery]);

    const handleNew = () => {
        setEditing(null);
        setEditorOpen(true);
    };

    const handleEdit = (outlet) => {
        setEditing(outlet);
        setEditorOpen(true);
    };

    const handleSaved = (saved, isNew) => {
        if (isNew) {
            setOutlets((prev) => [saved, ...prev]);
        } else {
            setOutlets((prev) => prev.map((o) => (o._id === saved._id ? saved : o)));
        }
        setEditorOpen(false);
        setEditing(null);
    };

    const toggleActive = async (outlet) => {
        try {
            const res = await outletService.update(outlet._id, { active: !outlet.active });
            const updated = res.data?.data || { ...outlet, active: !outlet.active };
            setOutlets((prev) => prev.map((o) => (o._id === outlet._id ? updated : o)));
            toast.success(updated.active ? 'Outlet is now visible to customers' : 'Outlet hidden from customers');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update outlet');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleteLoading(true);
        try {
            await outletService.remove(deleteConfirm);
            setOutlets((prev) => prev.filter((o) => o._id !== deleteConfirm));
            toast.success('Outlet deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete outlet');
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(null);
        }
    };

    if (loading) return <Loader fullScreen label="Loading outlets…" />;

    return (
        <div className="min-h-screen bg-surface-200/40 pb-12">
            <div className="container-page py-8">
                <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-navy-600 flex items-center gap-2">
                            <MapPin size={28} className="text-primary-500" /> Outlets management
                        </h1>
                        <p className="text-slate-600 mt-1 max-w-2xl">
                            Outlets are eventHub's physical box-office locations where customers can buy tickets in person and pay cash. Add a new outlet, edit details like opening hours, or hide one temporarily without deleting it.
                        </p>
                    </div>
                    <button type="button" onClick={handleNew} className="btn btn-primary">
                        <Plus size={16} /> Add new outlet
                    </button>
                </header>

                <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
                        <h2 className="text-lg font-semibold text-slate-800">{outlets.length} outlets</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, address, city…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10 py-2 text-sm w-72"
                            />
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="p-10">
                            <EmptyState
                                icon="📍"
                                title={outlets.length === 0 ? 'No outlets yet' : 'No outlets match your search'}
                                description={
                                    outlets.length === 0
                                        ? 'Click "Add new outlet" to create your first box-office location.'
                                        : 'Try a different keyword.'
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">City</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filtered.map((o) => (
                                        <tr key={o._id} className="hover:bg-slate-50/60">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{o.name}</div>
                                                <div className="text-xs text-slate-500">{o.phone || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">{o.address}</td>
                                            <td className="px-6 py-4 text-sm text-slate-700">{o.city}</td>
                                            <td className="px-6 py-4">
                                                {o.active ? (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-100">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-slate-100 text-slate-600 border-slate-200">
                                                        Hidden
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button type="button" onClick={() => toggleActive(o)} className="btn btn-outline btn-sm" title={o.active ? 'Hide from customers' : 'Show to customers'}>
                                                        <Power size={14} /> {o.active ? 'Hide' : 'Show'}
                                                    </button>
                                                    <button type="button" onClick={() => handleEdit(o)} className="btn btn-outline btn-sm">
                                                        <Pencil size={14} /> Edit
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteConfirm(o._id)} className="btn btn-outline btn-sm text-rose-600 hover:bg-rose-50 border-rose-200">
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {editorOpen && (
                <OutletEditor
                    outlet={editing}
                    onClose={() => {
                        setEditorOpen(false);
                        setEditing(null);
                    }}
                    onSaved={handleSaved}
                />
            )}

            <ConfirmDialog
                open={Boolean(deleteConfirm)}
                title="Delete this outlet?"
                description="This permanently removes the outlet from the public Outlets page. If you only want to hide it temporarily, use the Hide button instead."
                confirmLabel="Delete outlet"
                variant="danger"
                loading={deleteLoading}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </div>
    );
};

const OutletEditor = ({ outlet, onClose, onSaved }) => {
    const isNew = !outlet;
    const [form, setForm] = useState(() => (outlet ? { ...blankForm, ...outlet } : { ...blankForm }));
    const [saving, setSaving] = useState(false);

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const togglePayment = (key) => {
        setForm((prev) => {
            const has = prev.paymentMethods?.includes(key);
            const next = has
                ? prev.paymentMethods.filter((p) => p !== key)
                : [...(prev.paymentMethods || []), key];
            return { ...prev, paymentMethods: next };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;

        if (!form.name.trim() || !form.address.trim()) {
            toast.error('Name and address are required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                address: form.address.trim(),
                city: form.city.trim() || 'Berlin',
                country: form.country.trim() || 'Germany',
                phone: form.phone.trim(),
                email: form.email.trim(),
                workingHours: form.workingHours.trim(),
                paymentMethods: form.paymentMethods,
                image: form.image.trim(),
                active: !!form.active,
            };
            const res = isNew
                ? await outletService.create(payload)
                : await outletService.update(outlet._id, payload);
            const saved = res.data?.data || res.data;
            toast.success(isNew ? 'Outlet created' : 'Outlet updated');
            onSaved(saved, isNew);
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (Array.isArray(errors) && errors.length) {
                toast.error(errors.join(', '));
            } else {
                toast.error(err.response?.data?.message || 'Failed to save outlet');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl my-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-navy-600">{isNew ? 'Add a new outlet' : 'Edit outlet'}</h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Name *">
                            <input type="text" required maxLength={120} className="input" value={form.name} onChange={(e) => setField('name', e.target.value)} />
                        </Field>
                        <Field label="Phone">
                            <input type="tel" className="input" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+49 30 1234 5678" />
                        </Field>
                    </div>

                    <Field label="Address *">
                        <input type="text" required className="input" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Friedrichstraße 200" />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="City">
                            <input type="text" className="input" value={form.city} onChange={(e) => setField('city', e.target.value)} />
                        </Field>
                        <Field label="Country">
                            <input type="text" className="input" value={form.country} onChange={(e) => setField('country', e.target.value)} />
                        </Field>
                    </div>

                    <Field label="Working hours" hint="e.g. Mon–Sat 10:00 – 21:00">
                        <input type="text" className="input" value={form.workingHours} onChange={(e) => setField('workingHours', e.target.value)} />
                    </Field>

                    <Field label="Email (optional)">
                        <input type="email" className="input" value={form.email} onChange={(e) => setField('email', e.target.value)} />
                    </Field>

                    <Field label="Image URL (optional)" hint="A photo of the outlet — shown on the public Outlets page">
                        <input type="url" className="input" value={form.image} onChange={(e) => setField('image', e.target.value)} placeholder="https://…" />
                    </Field>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Accepted payment methods</label>
                        <div className="flex flex-wrap gap-2">
                            {PAYMENT_OPTIONS.map((p) => {
                                const active = form.paymentMethods?.includes(p.key);
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => togglePayment(p.key)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                                            active
                                                ? 'bg-primary-50 text-primary-700 border-primary-200'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={!!form.active} onChange={(e) => setField('active', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                        Active — show this outlet on the public Outlets page
                    </label>
                </form>

                <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                    <button type="button" onClick={onClose} className="btn btn-outline" disabled={saving}>
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit} className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : isNew ? 'Create outlet' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, hint, children }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
        {children}
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
);

export default AdminOutletsPage;
