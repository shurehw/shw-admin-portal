'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Settings, Clock, Users, Mail, MessageSquare, 
  Edit, Trash2, Save, X, ArrowUp, ArrowDown, Zap
} from 'lucide-react';

interface TicketStatus {
  id: string;
  name: string;
  orderIndex: number;
  isDefault: boolean;
  isClosed: boolean;
  color?: string;
}

interface SlaPolicy {
  id: string;
  name: string;
  priority: string;
  firstResponseMinutes: number;
  resolveMinutes: number;
  businessHoursId?: string;
}

interface Macro {
  id: string;
  name: string;
  description?: string;
  team?: string;
  actions: any[];
}

export default function TicketSettings() {
  const [activeTab, setActiveTab] = useState<'statuses' | 'sla' | 'macros' | 'routing' | 'integrations'>('statuses');
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [slasPolicies, setSlasPolicies] = useState<SlaPolicy[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewStatusModal, setShowNewStatusModal] = useState(false);
  const [showNewSlaModal, setShowNewSlaModal] = useState(false);
  const [showNewMacroModal, setShowNewMacroModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setStatuses([
        { id: '1', name: 'New', orderIndex: 0, isDefault: true, isClosed: false, color: '#8B5CF6' },
        { id: '2', name: 'Acknowledged', orderIndex: 1, isDefault: false, isClosed: false, color: '#3B82F6' },
        { id: '3', name: 'In Progress', orderIndex: 2, isDefault: false, isClosed: false, color: '#F59E0B' },
        { id: '4', name: 'Waiting on Customer', orderIndex: 3, isDefault: false, isClosed: false, color: '#F97316' },
        { id: '5', name: 'Resolved', orderIndex: 4, isDefault: false, isClosed: true, color: '#10B981' },
        { id: '6', name: 'Closed', orderIndex: 5, isDefault: false, isClosed: true, color: '#6B7280' }
      ]);

      setSlasPolicies([
        { id: '1', name: 'Urgent Priority', priority: 'urgent', firstResponseMinutes: 15, resolveMinutes: 120 },
        { id: '2', name: 'High Priority', priority: 'high', firstResponseMinutes: 60, resolveMinutes: 480 },
        { id: '3', name: 'Normal Priority', priority: 'normal', firstResponseMinutes: 240, resolveMinutes: 1440 },
        { id: '4', name: 'Low Priority', priority: 'low', firstResponseMinutes: 480, resolveMinutes: 2880 }
      ]);

      setMacros([
        {
          id: '1',
          name: 'Request Photos',
          description: 'Ask customer to provide photos of the issue',
          team: 'support',
          actions: [
            { type: 'set_status', value: 'waiting_customer' },
            { type: 'send_template', value: 'request_photos' }
          ]
        },
        {
          id: '2',
          name: 'Escalate to Manager',
          description: 'Escalate ticket to team manager',
          actions: [
            { type: 'set_priority', value: 'high' },
            { type: 'assign_team', value: 'management' },
            { type: 'add_note', value: 'Escalated to management for review' }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'statuses', label: 'Statuses', icon: Settings },
    { id: 'sla', label: 'SLA Policies', icon: Clock },
    { id: 'macros', label: 'Macros', icon: Zap },
    { id: 'routing', label: 'Routing Rules', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Mail }
  ] as const;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const renderStatusesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Ticket Statuses</h3>
        <button
          onClick={() => setShowNewStatusModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Status
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Drag to reorder statuses. The order determines how they appear in dropdowns and workflow.
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {statuses.map((status) => (
            <div key={status.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex flex-col space-y-1 mr-4">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <div>
                    <h4 className="font-medium text-gray-900">{status.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {status.isDefault && <span className="text-blue-600">Default</span>}
                      {status.isClosed && <span className="text-green-600">Closed State</span>}
                      <span>Order: {status.orderIndex}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSlaTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">SLA Policies</h3>
        <button
          onClick={() => setShowNewSlaModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add SLA Policy
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Define response and resolution time targets for different priority levels.
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {slasPolicies.map((sla) => (
            <div key={sla.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{sla.name}</h4>
                <div className="flex items-center space-x-6 text-sm text-gray-500 mt-1">
                  <span className="capitalize font-medium text-gray-700">{sla.priority} Priority</span>
                  <span>First Response: {formatDuration(sla.firstResponseMinutes)}</span>
                  <span>Resolution: {formatDuration(sla.resolveMinutes)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMacrosTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Macros</h3>
        <button
          onClick={() => setShowNewMacroModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Macro
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Create reusable actions to quickly perform common tasks on tickets.
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {macros.map((macro) => (
            <div key={macro.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{macro.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{macro.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {macro.team && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {macro.team}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{macro.actions.length} actions</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRoutingTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Routing Rules</h3>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No routing rules configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create rules to automatically assign tickets based on criteria like type, customer, or content.
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Create your first rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">Email</h4>
              <p className="text-sm text-gray-500">Send and receive tickets via email</p>
            </div>
          </div>
          <div className="mt-4">
            <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
              Configure
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">SMS / WhatsApp</h4>
              <p className="text-sm text-gray-500">Handle tickets via messaging</p>
            </div>
          </div>
          <div className="mt-4">
            <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'statuses' && renderStatusesTab()}
        {activeTab === 'sla' && renderSlaTab()}
        {activeTab === 'macros' && renderMacrosTab()}
        {activeTab === 'routing' && renderRoutingTab()}
        {activeTab === 'integrations' && renderIntegrationsTab()}
      </div>
    </div>
  );
}