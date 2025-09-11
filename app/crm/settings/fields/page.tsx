'use client';

import { useState, useEffect } from 'react';
import { FieldDefinition, FieldDefinitionService } from '@/lib/field-definitions';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, Lock, Settings, 
  Type, Hash, Calendar, Clock, Mail, Phone, Globe,
  CheckSquare, List, Tag, FileText, ArrowUp, ArrowDown
} from 'lucide-react';

interface FieldFormData extends Omit<FieldDefinition, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export default function FieldsSettingsPage() {
  const [contactFields, setContactFields] = useState<FieldDefinition[]>([]);
  const [companyFields, setCompanyFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contact' | 'company'>('contact');
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);

  const [formData, setFormData] = useState<FieldFormData>({
    entity: 'contact',
    key: '',
    label: '',
    type: 'text',
    required: false,
    unique: false,
    group: 'Custom',
    order: 100,
    help_text: '',
    options: null,
    default_value: null,
    visible: true,
    editable: true,
    system: false,
    archived: false
  });

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const [contacts, companies] = await Promise.all([
        FieldDefinitionService.getFieldDefinitions('contact'),
        FieldDefinitionService.getFieldDefinitions('company')
      ]);
      setContactFields(contacts);
      setCompanyFields(companies);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
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

  const openForm = (field?: FieldDefinition) => {
    if (field) {
      setEditingField(field);
      setFormData({ ...field });
    } else {
      setEditingField(null);
      setFormData({
        entity: activeTab,
        key: '',
        label: '',
        type: 'text',
        required: false,
        unique: false,
        group: 'Custom',
        order: Math.max(...(activeTab === 'contact' ? contactFields : companyFields).map(f => f.order), 99) + 1,
        help_text: '',
        options: null,
        default_value: null,
        visible: true,
        editable: true,
        system: false,
        archived: false
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate key format (lowercase, underscore, alphanumeric)
      const keyRegex = /^[a-z][a-z0-9_]*$/;
      if (!keyRegex.test(formData.key)) {
        alert('Key must start with a letter and contain only lowercase letters, numbers, and underscores');
        return;
      }

      // Parse options for enum/multiselect fields
      let options = formData.options;
      if (formData.type === 'enum' || formData.type === 'multiselect') {
        if (typeof options === 'string') {
          try {
            const values = options.split(',').map(v => v.trim()).filter(v => v);
            options = { values };
          } catch {
            options = { values: [] };
          }
        }
      }

      const fieldData = {
        ...formData,
        options,
        entity: activeTab
      };

      if (editingField) {
        await FieldDefinitionService.updateFieldDefinition(editingField.id, fieldData);
      } else {
        await FieldDefinitionService.createFieldDefinition(fieldData);
      }

      await loadFields();
      closeForm();
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Error saving field. Please try again.');
    }
  };

  const handleArchive = async (field: FieldDefinition) => {
    if (field.system) {
      alert('System fields cannot be deleted.');
      return;
    }

    if (confirm(`Are you sure you want to archive the field "${field.label}"?`)) {
      try {
        await FieldDefinitionService.archiveFieldDefinition(field.id);
        await loadFields();
      } catch (error) {
        console.error('Error archiving field:', error);
        alert('Error archiving field. Please try again.');
      }
    }
  };

  const toggleVisibility = async (field: FieldDefinition) => {
    try {
      await FieldDefinitionService.updateFieldDefinition(field.id, {
        visible: !field.visible
      });
      await loadFields();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const moveField = async (field: FieldDefinition, direction: 'up' | 'down') => {
    const fields = activeTab === 'contact' ? contactFields : companyFields;
    const currentIndex = fields.findIndex(f => f.id === field.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const swapField = fields[currentIndex - 1];
      await FieldDefinitionService.updateFieldDefinition(field.id, { order: swapField.order });
      await FieldDefinitionService.updateFieldDefinition(swapField.id, { order: field.order });
    } else if (direction === 'down' && currentIndex < fields.length - 1) {
      const swapField = fields[currentIndex + 1];
      await FieldDefinitionService.updateFieldDefinition(field.id, { order: swapField.order });
      await FieldDefinitionService.updateFieldDefinition(swapField.id, { order: field.order });
    }
    
    await loadFields();
  };

  const currentFields = activeTab === 'contact' ? contactFields : companyFields;

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Field Definitions</h1>
              <p className="text-gray-600">Manage custom fields for contacts and companies</p>
            </div>
            <button
              onClick={() => openForm()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contact'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contact Fields ({contactFields.length})
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'company'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Company Fields ({companyFields.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Fields List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading fields...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentFields.map((field, index) => (
                <div key={field.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-400">
                        {getFieldIcon(field.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">{field.label}</h3>
                          {field.system && <Lock className="h-3 w-3 text-gray-400" />}
                          {field.required && <span className="text-red-500 text-xs">Required</span>}
                          {!field.visible && <EyeOff className="h-3 w-3 text-gray-400" />}
                        </div>
                        <p className="text-xs text-gray-500">
                          {field.key} • {field.type} • {field.group || 'No Group'}
                        </p>
                        {field.help_text && (
                          <p className="text-xs text-gray-400 mt-1">{field.help_text}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Move buttons */}
                      <button
                        onClick={() => moveField(field, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveField(field, 'down')}
                        disabled={index === currentFields.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      {/* Visibility toggle */}
                      <button
                        onClick={() => toggleVisibility(field)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title={field.visible ? 'Hide field' : 'Show field'}
                      >
                        {field.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => openForm(field)}
                        className="p-2 text-blue-600 hover:text-blue-700"
                        disabled={!field.editable}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {/* Delete button */}
                      {!field.system && (
                        <button
                          onClick={() => handleArchive(field)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {currentFields.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No custom fields defined yet.</p>
                  <p className="text-sm">Click "Add Field" to create your first custom field.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Field Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeForm}></div>
              
              <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingField ? 'Edit Field' : 'Add New Field'}
                    </h3>
                    <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Key (Internal Name)
                      </label>
                      <input
                        type="text"
                        value={formData.key}
                        onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="custom_field_name"
                        required
                        disabled={editingField?.system}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lowercase letters, numbers, underscores only
                      </p>
                    </div>

                    {/* Label */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Custom Field Name"
                        required
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={editingField?.system}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="url">URL</option>
                        <option value="date">Date</option>
                        <option value="datetime">Date & Time</option>
                        <option value="boolean">Yes/No</option>
                        <option value="enum">Dropdown</option>
                        <option value="multiselect">Multi-select</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>

                    {/* Group */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group/Section
                      </label>
                      <input
                        type="text"
                        value={formData.group || ''}
                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Custom"
                      />
                    </div>

                    {/* Options for enum/multiselect */}
                    {(formData.type === 'enum' || formData.type === 'multiselect') && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={typeof formData.options === 'object' && formData.options?.values ? 
                            formData.options.values.join(', ') : 
                            (formData.options as string) || ''
                          }
                          onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    {/* Help Text */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Help Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.help_text || ''}
                        onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Additional information about this field"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="md:col-span-2">
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.required}
                            onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={editingField?.system}
                          />
                          <span className="ml-2 text-sm text-gray-700">Required</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.visible}
                            onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Visible</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.editable}
                            onChange={(e) => setFormData({ ...formData, editable: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Editable</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingField ? 'Update Field' : 'Create Field'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}