import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DynamicCustomFields from "../components/DynamicCustomFields";
import { categoryOptions, getDefaultCustomFields } from "../utils/categoryFields";

const EditEvent = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchEventDetails();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/v1/events/${eventId}`, {
                withCredentials: true
            });
            const event = response.data;

            // Prepare custom fields, including ticket types if they exist
            let customFieldsData = event.custom_fields || {};
            if (event.ticketTypes && Array.isArray(event.ticketTypes)) {
                customFieldsData = {
                    ...customFieldsData,
                    ticket_types: event.ticketTypes.map(ticket => ({
                        type: ticket.type,
                        price: ticket.price.toString(),
                        quantity: ticket.quantity.toString()
                    }))
                };
            }

            setFormData({
                title: event.title,
                description: event.description,
                date: new Date(event.date).toISOString().split('T')[0],
                location: event.location,
                category: event.category,
                image: event.image || ""
            });
            setCustomFields(customFieldsData);
            setImagePreview(event.image || "");
            setLoading(false);
        } catch (err) {
            setError("Failed to fetch event details");
            setLoading(false);
        }
    };

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
        try {
            const eventData = {
                ...formData,
                custom_fields: customFields
            };

            // Extract ticketTypes from custom_fields if present
            if (customFields.ticket_types && Array.isArray(customFields.ticket_types)) {
                eventData.ticketTypes = customFields.ticket_types.map(ticket => ({
                    type: ticket.type,
                    price: Number(ticket.price),
                    quantity: Number(ticket.quantity),
                    remaining: Number(ticket.quantity) // Reset remaining to full quantity on edit
                }));
                // Remove ticket_types from custom_fields since it's now a top-level field
                const { ticket_types, ...otherFields } = customFields;
                eventData.custom_fields = otherFields;
            }

            // Convert number fields in custom_fields to numbers
            if (eventData.custom_fields) {
                const categoryFields = (await import('../utils/categoryFields')).categoryFields;
                const fields = categoryFields[formData.category] || {};
                Object.keys(eventData.custom_fields).forEach(key => {
                    if (fields[key] && fields[key].type === 'number') {
                        eventData.custom_fields[key] = Number(eventData.custom_fields[key]);
                    }
                });
            }

            await axios.put(`http://localhost:3000/api/v1/events/${eventId}`, eventData, {
                withCredentials: true
            });

            navigate('/my-events');
        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.message || "Failed to update event");
        }
    };

    if (loading) return <div className="text-center p-4">Loading...</div>;
    if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                            <label className="block text-sm font-medium text-gray-700">Event Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:border file:border-slate-300 file:rounded-md file:bg-white file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
                            <input
                                type="url"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="https://example.com/event-photo.jpg"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        {imagePreview && (
                            <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
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

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/my-events')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Update Event
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditEvent; 