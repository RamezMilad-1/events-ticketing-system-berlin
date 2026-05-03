import React from 'react';
import { categoryFields } from '../utils/categoryFields';

const DynamicCustomFields = ({ category, customFields, onCustomFieldsChange, errors = {} }) => {
    const fields = categoryFields[category] || {};

    const handleFieldChange = (fieldName, value) => {
        onCustomFieldsChange({
            ...customFields,
            [fieldName]: value
        });
    };

    const handleArrayAdd = (fieldName) => {
        const currentArray = customFields[fieldName] || [];
        handleFieldChange(fieldName, [...currentArray, '']);
    };

    const handleArrayRemove = (fieldName, index) => {
        const currentArray = customFields[fieldName] || [];
        const newArray = currentArray.filter((_, i) => i !== index);
        handleFieldChange(fieldName, newArray);
    };

    const handleArrayItemChange = (fieldName, index, value) => {
        const currentArray = customFields[fieldName] || [];
        const newArray = [...currentArray];
        newArray[index] = value;
        handleFieldChange(fieldName, newArray);
    };

    const handleObjectArrayAdd = (fieldName, fields) => {
        const currentArray = customFields[fieldName] || [];
        const newItem = {};
        fields.forEach(field => {
            newItem[field.name] = field.type === 'boolean' ? false : '';
        });
        handleFieldChange(fieldName, [...currentArray, newItem]);
    };

    const handleObjectArrayRemove = (fieldName, index) => {
        const currentArray = customFields[fieldName] || [];
        const newArray = currentArray.filter((_, i) => i !== index);
        handleFieldChange(fieldName, newArray);
    };

    const handleObjectArrayItemChange = (fieldName, index, fieldName2, value) => {
        const currentArray = customFields[fieldName] || [];
        const newArray = [...currentArray];
        newArray[index] = { ...newArray[index], [fieldName2]: value };
        handleFieldChange(fieldName, newArray);
    };

    const renderField = (fieldName, fieldConfig) => {
        const value = customFields[fieldName];
        const fieldError = errors[fieldName];

        switch (fieldConfig.type) {
            case 'text':
                return (
                    <div key={fieldName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                            placeholder={fieldConfig.placeholder}
                            required={fieldConfig.required}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {fieldError && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
                    </div>
                );

            case 'number':
                return (
                    <div key={fieldName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="number"
                            value={value || ''}
                            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                            placeholder={fieldConfig.placeholder}
                            required={fieldConfig.required}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {fieldError && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
                    </div>
                );

            case 'boolean':
                return (
                    <div key={fieldName}>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={value || false}
                                onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                {fieldConfig.label}
                                {fieldConfig.required && <span className="text-red-500">*</span>}
                            </span>
                        </label>
                        {fieldError && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
                    </div>
                );

            case 'select':
                return (
                    <div key={fieldName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                            value={value || ''}
                            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                            required={fieldConfig.required}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select {fieldConfig.label.toLowerCase()}</option>
                            {fieldConfig.options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {fieldError && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
                    </div>
                );

            case 'array':
                if (fieldConfig.itemType === 'object') {
                    // Handle object arrays (like lineup_schedule, agenda)
                    return (
                        <div key={fieldName}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {fieldConfig.label}
                                {fieldConfig.required && <span className="text-red-500">*</span>}
                            </label>
                            {(value || []).map((item, index) => (
                                <div key={index} className="border rounded-lg p-4 mb-2 bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">Item {index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleObjectArrayRemove(fieldName, index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                            {fieldConfig.fields.map(field => {
                                                const fieldValue = item[field.name] || '';
                                                const fieldOptions = field.optionsKey ? (customFields[field.optionsKey] || []) : (field.options || []);

                                                return (
                                                    <div key={field.name} className="mb-2">
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            {field.label}
                                                            {field.required && <span className="text-red-500">*</span>}
                                                        </label>
                                                        {field.type === 'select' ? (
                                                            <select
                                                                value={fieldValue}
                                                                onChange={(e) => handleObjectArrayItemChange(fieldName, index, field.name, e.target.value)}
                                                                required={field.required}
                                                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                            >
                                                                <option value="">Select {field.label.toLowerCase()}</option>
                                                                {fieldOptions.map((option, optIndex) => (
                                                                    <option key={optIndex} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                value={fieldValue}
                                                                onChange={(e) => handleObjectArrayItemChange(fieldName, index, field.name, e.target.value)}
                                                                required={field.required}
                                                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleObjectArrayAdd(fieldName, fieldConfig.fields)}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Add {fieldConfig.label.slice(0, -1)}
                            </button>
                            {fieldError && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
                        </div>
                    );
                } else {
                    // Handle simple arrays
                    return (
                        <div key={fieldName}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {fieldConfig.label}
                                {fieldConfig.required && <span className="text-red-500">*</span>}
                            </label>
                            {(value || []).map((item, index) => (
                                <div key={index} className="flex items-center mb-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleArrayItemChange(fieldName, index, e.target.value)}
                                        placeholder={fieldConfig.placeholder}
                                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleArrayRemove(fieldName, index)}
                                        className="ml-2 px-3 py-2 text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleArrayAdd(fieldName)}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Add {fieldConfig.label.slice(0, -1)}
                            </button>
                            {fieldError && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
                        </div>
                    );
                }

            default:
                return null;
        }
    };

    if (Object.keys(fields).length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                {category.charAt(0).toUpperCase() + category.slice(1)} Details
            </h3>
            {Object.entries(fields).map(([fieldName, fieldConfig]) =>
                renderField(fieldName, fieldConfig)
            )}
        </div>
    );
};

export default DynamicCustomFields;