'use client';

import { useState, useEffect } from 'react';
import { FieldDefinition, FieldGroup, FieldDefinitionService } from '@/lib/field-definitions';
import { 
  Calendar, Clock, Hash, Type, Mail, Phone, Globe, 
  CheckSquare, List, Tag, FileText, AlertCircle, 
  HelpCircle, Eye, EyeOff, Lock
} from 'lucide-react';

interface DynamicFormProps {
  entity: 'contact' | 'company';
  data?: any;
  onChange: (data: any) => void;
  errors?: { [key: string]: string };
  showSystemFields?: boolean;
  readonly?: boolean;
}

interface FormFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  readonly?: boolean;
}

function FormField({ field, value, onChange, error, readonly }: FormFieldProps) {
  const getFieldIcon = () => {
    switch (field.type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'url': return <Globe className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'datetime': return <Clock className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'boolean': return <CheckSquare className="h-4 w-4" />;
      case 'enum': return <List className="h-4 w-4" />;
      case 'multiselect': return <Tag className="h-4 w-4" />;
      case 'json': return <FileText className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const renderInput = () => {
    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-300'
    } ${readonly ? 'bg-gray-50 cursor-not-allowed' : ''}`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            placeholder={field.help_text}
            disabled={readonly}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className={baseClasses}
            placeholder={field.help_text}
            disabled={readonly}
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={readonly}
            />
            <span className="text-sm text-gray-600">{field.help_text || 'Enable this option'}</span>
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            disabled={readonly}
            required={field.required}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            disabled={readonly}
            required={field.required}
          />
        );

      case 'enum':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            disabled={readonly}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.values?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.values?.map((option: string) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={readonly}
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch {
                onChange(e.target.value);
              }
            }}
            className={`${baseClasses} h-24 font-mono text-sm`}
            placeholder={field.help_text || 'Enter valid JSON'}
            disabled={readonly}
          />
        );

      default:
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} h-20`}
            placeholder={field.help_text}
            disabled={readonly}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="text-gray-400">
          {getFieldIcon()}
        </div>
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {field.system && <Lock className="h-3 w-3 text-gray-400 ml-1" />}
        </label>
        {field.help_text && (
          <div className="group relative">
            <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
              {field.help_text}
            </div>
          </div>
        )}
      </div>
      
      {renderInput()}
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function DynamicForm({ 
  entity, 
  data = {}, 
  onChange, 
  errors = {}, 
  showSystemFields = true,
  readonly = false 
}: DynamicFormProps) {
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadFieldDefinitions();
  }, [entity]);

  const loadFieldDefinitions = async () => {
    try {
      setLoading(true);
      const groups = await FieldDefinitionService.getGroupedFieldDefinitions(entity);
      setFieldGroups(groups);
    } catch (error) {
      console.error('Error loading field definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    // Update both the standard field and props
    const updatedData = { ...data };
    
    // Check if this is a system field (exists in the main entity schema)
    const systemFields = entity === 'contact' 
      ? ['email', 'first_name', 'last_name', 'job_title', 'phone', 'mobile_phone', 'lifecycle_stage', 'lead_status', 'next_step', 'next_step_due', 'preferred_channel', 'time_zone', 'tags']
      : ['name', 'domain', 'phone', 'address', 'city', 'state', 'zip', 'country', 'industry', 'lifecycle_stage', 'account_tier', 'territory', 'price_list', 'payment_terms', 'credit_limit', 'credit_status'];

    if (systemFields.includes(fieldKey)) {
      updatedData[fieldKey] = value;
    } else {
      // Custom field - store in props
      updatedData.props = { ...updatedData.props, [fieldKey]: value };
    }

    onChange(updatedData);
  };

  const getFieldValue = (fieldKey: string) => {
    // First check direct property, then props
    if (data[fieldKey] !== undefined) {
      return data[fieldKey];
    }
    return data.props?.[fieldKey];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const visibleGroups = showSystemFields 
    ? fieldGroups 
    : fieldGroups.filter(group => group.fields.some(field => !field.system));

  return (
    <div className="space-y-8">
      {/* Show/Hide Advanced Toggle */}
      {fieldGroups.some(group => group.fields.some(field => !field.system)) && (
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {entity === 'contact' ? 'Contact Information' : 'Company Information'}
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Fields</span>
          </button>
        </div>
      )}

      {visibleGroups.map(group => {
        const visibleFields = group.fields.filter(field => {
          if (!field.visible) return false;
          if (!showSystemFields && field.system) return false;
          if (!showAdvanced && !field.system && group.name !== 'General') return false;
          return true;
        });

        if (visibleFields.length === 0) return null;

        return (
          <div key={group.name} className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {group.name}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleFields.map(field => (
                <div 
                  key={field.key} 
                  className={field.type === 'json' || field.type === 'multiselect' ? 'md:col-span-2' : ''}
                >
                  <FormField
                    field={field}
                    value={getFieldValue(field.key)}
                    onChange={(value) => handleFieldChange(field.key, value)}
                    error={errors[field.key]}
                    readonly={readonly || (!field.editable)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {visibleGroups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No form fields configured for {entity}s yet.</p>
        </div>
      )}
    </div>
  );
}