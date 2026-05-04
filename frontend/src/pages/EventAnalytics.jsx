import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import { userService } from '../services/api';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { formatPrice } from '../utils/format';

const COLORS = ['#f25445', '#1e2c5e', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const STATUS_BADGE = {
    approved: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    declined: 'bg-rose-100 text-rose-700',
};

const formatCurrency = (val) => formatPrice(val);

const EventAnalytics = () => {
    const [events, setEvents] = useState([]);
    const [totals, setTotals] = useState({ events: 0, totalTickets: 0, ticketsSold: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await userService.getMyEventAnalytics();
                setEvents(Array.isArray(data?.events) ? data.events : []);
                setTotals(data?.totals || { events: 0, totalTickets: 0, ticketsSold: 0, revenue: 0 });
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <Loader fullScreen label="Crunching numbers..." />;

    if (events.length === 0) {
        return (
            <div className="container mx-auto max-w-3xl px-4 py-10">
                <EmptyState
                    icon="📊"
                    title="No analytics yet"
                    description="Once you create events and start selling tickets, charts and metrics will appear here."
                />
            </div>
        );
    }

    const pieData = [
        { name: 'Sold', value: totals.ticketsSold },
        { name: 'Available', value: Math.max(0, totals.totalTickets - totals.ticketsSold) },
    ];

    return (
        <div className="bg-surface-200/40 min-h-screen pb-12">
        <div className="container-page py-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-navy-600">Event analytics</h1>
                <p className="text-slate-600 mt-1">Track ticket sales and revenue across your events.</p>
            </header>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Events" value={totals.events} accent="text-primary-600" />
                <StatCard label="Total tickets" value={totals.totalTickets} accent="text-navy-600" />
                <StatCard label="Tickets sold" value={totals.ticketsSold} accent="text-amber-600" />
                <StatCard label="Revenue" value={formatCurrency(totals.revenue)} accent="text-emerald-600" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">% Booked per event</h2>
                    <div className="h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={events} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
                                <YAxis domain={[0, 100]} unit="%" />
                                <Tooltip formatter={(value) => `${value}%`} />
                                <Legend />
                                <Bar dataKey="percentageBooked" name="% Booked" fill="#f25445" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Overall ticket distribution</h2>
                    <div className="h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={130}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ name, percent }) =>
                                        `${name} (${(percent * 100).toFixed(0)}%)`
                                    }
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detail table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <h2 className="text-lg font-bold text-slate-900 p-6 border-b border-slate-200">Detailed statistics</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Sold
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    % Booked
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {events.map((event) => (
                                <tr key={event._id}>
                                    <td className="px-6 py-4 font-medium text-slate-900">{event.title}</td>
                                    <td className="px-6 py-4 text-slate-700">{event.totalTickets}</td>
                                    <td className="px-6 py-4 text-slate-700">{event.ticketsSold}</td>
                                    <td className="px-6 py-4 text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 rounded-full bg-slate-200 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary-500"
                                                    style={{ width: `${Math.min(100, event.percentageBooked)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm">{event.percentageBooked}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{formatCurrency(event.revenue)}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                                STATUS_BADGE[event.status] || ''
                                            }`}
                                        >
                                            {event.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </div>
    );
};

const StatCard = ({ label, value, accent }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">{label}</h3>
        <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </div>
);

export default EventAnalytics;
