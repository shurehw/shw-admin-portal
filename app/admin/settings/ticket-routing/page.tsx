'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  Mail, Plus, Save, Trash2, AlertCircle, 
  CheckCircle, Settings, ArrowRight, Users,
  Inbox, Filter, Tag, Zap, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TicketRoute {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    type: 'email' | 'subject' | 'body' | 'domain';
    operator: 'contains' | 'equals' | 'starts_with' | 'ends_with';
    value: string;
  }[];
  actions: {
    type: 'assign_to' | 'set_priority' | 'add_tag' | 'set_category';
    value: string;
  }[];
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function TicketRoutingPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<TicketRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TicketRoute | null>(null);
  
  // Form state for new/edit route
  const [formData, setFormData] = useState({
    name: '',
    enabled: true,
    conditions: [{ type: 'email', operator: 'contains', value: '' }],
    actions: [{ type: 'assign_to', value: '' }],
    priority: 1,
  });

  // Mock data for demonstration
  const mockRoutes: TicketRoute[] = [
    {
      id: '1',
      name: 'Support Team - cs@shurehw.com',
      enabled: true,
      conditions: [
        { type: 'email', operator: 'equals', value: 'cs@shurehw.com' }
      ],
      actions: [
        { type: 'assign_to', value: 'support_team' },
        { type: 'set_priority', value: 'medium' },
        { type: 'add_tag', value: 'email-support' }
      ],
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Urgent Keywords',
      enabled: true,
      conditions: [
        { type: 'subject', operator: 'contains', value: 'urgent' }
      ],
      actions: [
        { type: 'set_priority', value: 'high' },
        { type: 'assign_to', value: 'senior_support' }
      ],
      priority: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Sales Inquiries',
      enabled: true,
      conditions: [
        { type: 'body', operator: 'contains', value: 'quote' },
        { type: 'body', operator: 'contains', value: 'pricing' }
      ],
      actions: [
        { type: 'assign_to', value: 'sales_team' },
        { type: 'set_category', value: 'sales' },
        { type: 'add_tag', value: 'lead' }
      ],
      priority: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ticket-routing');
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.length > 0 ? data : mockRoutes);
      } else {
        // Use mock data if API fails
        setRoutes(mockRoutes);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      setRoutes(mockRoutes);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = editingRoute 
        ? `/api/admin/ticket-routing/${editingRoute.id}`
        : '/api/admin/ticket-routing';
      
      const method = editingRoute ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Route ${editingRoute ? 'updated' : 'created'} successfully!`);
        setShowAddModal(false);
        setEditingRoute(null);
        resetForm();
        loadRoutes();
      } else {
        alert('Failed to save route');
      }
    } catch (error) {
      alert('Error saving route');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this routing rule?')) return;
    
    try {
      const response = await fetch(`/api/admin/ticket-routing/${routeId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setRoutes(routes.filter(r => r.id !== routeId));
        alert('Route deleted successfully');
      } else {
        alert('Failed to delete route');
      }
    } catch (error) {
      alert('Error deleting route');
    }
  };

  const handleToggleEnabled = async (routeId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/ticket-routing/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      
      if (response.ok) {
        setRoutes(routes.map(r => 
          r.id === routeId ? { ...r, enabled } : r
        ));
      }
    } catch (error) {
      console.error('Error toggling route:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      enabled: true,
      conditions: [{ type: 'email', operator: 'contains', value: '' }],
      actions: [{ type: 'assign_to', value: '' }],
      priority: 1,
    });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { type: 'email', operator: 'contains', value: '' }]
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'assign_to', value: '' }]
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="h-6 w-6" />
            Ticket Email Routing
          </h1>
          <p className="text-gray-600 mt-2">
            Configure rules to automatically assign tickets based on email content
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How Email Routing Works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Rules are processed in priority order (lower number = higher priority)</li>
                <li>First matching rule wins - subsequent rules are not evaluated</li>
                <li>Multiple conditions in a rule use AND logic</li>
                <li>All actions in the matching rule are applied</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Routing Rules */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Routing Rules</h2>
            <button
              onClick={() => {
                resetForm();
                setEditingRoute(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </button>
          </div>

          {routes.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No routing rules configured</h3>
              <p className="text-gray-500 mb-6">
                Create rules to automatically route incoming email tickets
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create your first rule
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {routes.sort((a, b) => a.priority - b.priority).map((route) => (
                <div key={route.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{route.name}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          Priority: {route.priority}
                        </span>
                        {route.enabled ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            Disabled
                          </span>
                        )}
                      </div>

                      {/* Conditions */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">When:</p>
                        <div className="space-y-1">
                          {route.conditions.map((condition, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              {idx > 0 && <span className="text-gray-400">AND</span>}
                              <span className="font-medium capitalize">{condition.type}</span>
                              <span>{condition.operator.replace('_', ' ')}</span>
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                {condition.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Then:</p>
                        <div className="flex flex-wrap gap-2">
                          {route.actions.map((action, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                              {action.type === 'assign_to' && <Users className="h-3 w-3" />}
                              {action.type === 'set_priority' && <Zap className="h-3 w-3" />}
                              {action.type === 'add_tag' && <Tag className="h-3 w-3" />}
                              <span>{action.type.replace('_', ' ')}: {action.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={route.enabled}
                          onChange={(e) => handleToggleEnabled(route.id, e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <button
                        onClick={() => {
                          setEditingRoute(route);
                          setFormData({
                            name: route.name,
                            enabled: route.enabled,
                            conditions: route.conditions as any,
                            actions: route.actions as any,
                            priority: route.priority,
                          });
                          setShowAddModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingRoute ? 'Edit Routing Rule' : 'Add Routing Rule'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Support Team Emails"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority (Lower = Higher Priority)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    min="1"
                  />
                </div>

                {/* Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions (All must match)
                  </label>
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={condition.type}
                        onChange={(e) => {
                          const newConditions = [...formData.conditions];
                          newConditions[index].type = e.target.value as any;
                          setFormData({ ...formData, conditions: newConditions });
                        }}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="email">To Email</option>
                        <option value="subject">Subject</option>
                        <option value="body">Body</option>
                        <option value="domain">From Domain</option>
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => {
                          const newConditions = [...formData.conditions];
                          newConditions[index].operator = e.target.value as any;
                          setFormData({ ...formData, conditions: newConditions });
                        }}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="contains">Contains</option>
                        <option value="equals">Equals</option>
                        <option value="starts_with">Starts With</option>
                        <option value="ends_with">Ends With</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [...formData.conditions];
                          newConditions[index].value = e.target.value;
                          setFormData({ ...formData, conditions: newConditions });
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Value"
                      />
                      {formData.conditions.length > 1 && (
                        <button
                          onClick={() => removeCondition(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addCondition}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Condition
                  </button>
                </div>

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actions
                  </label>
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={action.type}
                        onChange={(e) => {
                          const newActions = [...formData.actions];
                          newActions[index].type = e.target.value as any;
                          setFormData({ ...formData, actions: newActions });
                        }}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="assign_to">Assign To</option>
                        <option value="set_priority">Set Priority</option>
                        <option value="add_tag">Add Tag</option>
                        <option value="set_category">Set Category</option>
                      </select>
                      {action.type === 'assign_to' && (
                        <select
                          value={action.value}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[index].value = e.target.value;
                            setFormData({ ...formData, actions: newActions });
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Team</option>
                          <option value="support_team">Support Team</option>
                          <option value="sales_team">Sales Team</option>
                          <option value="senior_support">Senior Support</option>
                          <option value="customer_service">Customer Service</option>
                        </select>
                      )}
                      {action.type === 'set_priority' && (
                        <select
                          value={action.value}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[index].value = e.target.value;
                            setFormData({ ...formData, actions: newActions });
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      )}
                      {(action.type === 'add_tag' || action.type === 'set_category') && (
                        <input
                          type="text"
                          value={action.value}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[index].value = e.target.value;
                            setFormData({ ...formData, actions: newActions });
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder={action.type === 'add_tag' ? 'Tag name' : 'Category name'}
                        />
                      )}
                      {formData.actions.length > 1 && (
                        <button
                          onClick={() => removeAction(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addAction}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Action
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="text-sm text-gray-700">
                    Enable this rule immediately
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoute(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingRoute ? 'Update Rule' : 'Create Rule'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}