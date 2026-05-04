import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { eventService } from '../services/api';
import DynamicCustomFields from "../components/DynamicCustomFields";
import { categoryOptions, getDefaultCustomFields } from "../utils/categoryFields";

const CreateEvent = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [customFields, setCustomFields] = useState({});
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        location: "",
        category: "",
        image: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Update custom fields when category changes
        if (name === 'category') {
            setCustomFields(getDefaultCustomFields(value));
        }

        if (name === 'image') {
            setImagePreview(value);
        }
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, image: reader.result }));
            setImagePreview(reader.result);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const eventData = {
                ...formData,
                custom_fields: { ...customFields },
            };

            // Promote ticket_types from custom_fields to top-level ticketTypes (matches backend contract)
            if (Array.isArray(customFields.ticket_types) && customFields.ticket_types.length > 0) {
                eventData.ticketTypes = customFields.ticket_types.map((tt) => ({
                    type: tt.type,
                    price: Number(tt.price) || 0,
                    quantity: Number(tt.quantity) || 0,
                    remaining: Number(tt.quantity) || 0,
                }));
                const { ticket_types, ...rest } = eventData.custom_fields;
                eventData.custom_fields = rest;
            }

            // Convert number fields in custom_fields to numbers
            if (eventData.custom_fields) {
                const { categoryFields } = await import('../utils/categoryFields');
                const fields = categoryFields[formData.category] || {};
                Object.keys(eventData.custom_fields).forEach((key) => {
                    if (fields[key] && fields[key].type === 'number') {
                        eventData.custom_fields[key] = Number(eventData.custom_fields[key]);
                    }
                });
            }

            await eventService.createEvent(eventData);
            toast.success('Event created — pending admin approval.');
            navigate('/my-events');
        } catch (err) {
            console.error('Create error:', err);
            const msg = err.response?.data?.message || 'Failed to create event';
            setError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-surface-200/40 min-h-screen pb-12">
        <div className="container-page py-8 max-w-3xl">
            <h1 className="text-3xl font-bold text-navy-600 mb-1">Create new event</h1>
            <p className="text-sm text-slate-500 mb-6">Your event will go through admin review before it's published.</p>
            {error && <div className="rounded-lg p-3 mb-4 bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}
            <form onSubmit={handleSubmit} className="card">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="input mt-1"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className="input mt-1"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="input mt-1"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="input mt-1"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="input mt-1"
                            required
                        >
                            <option value="">Select a category</option>
                            {categoryOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Event Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:border file:border-slate-300 file:rounded-md file:bg-white file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Image URL (Optional)</label>
                            <input
                                type="url"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="https://example.com/event-photo.jpg"
                                className="input mt-1"
                            />
                        </div>
                        {imagePreview && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                                <img src={imagePreview} alt="Event preview" className="w-full h-48 object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Dynamic Custom Fields */}
                    {formData.category && formData.category !== 'other' && (
                        <div className="border-t pt-6">
                            <DynamicCustomFields
                                category={formData.category}
                                customFields={customFields}
                                onCustomFieldsChange={setCustomFields}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate('/my-events')}
                            className="btn btn-outline btn-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary btn-sm"
                        >
                            {submitting ? 'Creating…' : 'Create event'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
        </div>
    );
};

export default CreateEvent; 