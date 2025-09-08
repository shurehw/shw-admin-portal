'use client';

import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { 
  Zap, Plus, Play, Pause, Edit2, Trash2, Copy, 
  Settings, Filter, Search, ChevronRight, AlertCircle,
  CheckCircle2, Clock, TrendingUp, Users, Mail,
  Phone, Calendar, DollarSign, FileText, MessageSquare,
  Target, User, Building2, Tag, Hash, ToggleLeft,
  ToggleRight, ArrowRight, GitBranch, Layers,
  Activity, BarChart3, Bell, Send, MousePointer,
  Eye, Link2, Download, Upload, RefreshCw, Info
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: 'lead' | 'contact' | 'deal' | 'task' | 'email' | 'general';
  status: 'active' | 'inactive' | 'draft';
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastRun?: any;
    averageTime?: number;
  };
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

interface WorkflowTrigger {
  type: string;
  config: any;
  description?: string;
}

interface WorkflowCondition {
  id: string;
  type: 'if' | 'if-else' | 'switch';
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface WorkflowAction {
  id: string;
  type: string;
  config: any;
  delay?: {
    amount: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  description?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  workflow: Partial<Workflow>;
}

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);

  // Workflow builder state
  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    category: 'general' as Workflow['category'],
    trigger: null as WorkflowTrigger | null,
    conditions: [] as WorkflowCondition[],
    actions: [] as WorkflowAction[]
  });

  const templates: WorkflowTemplate[] = [
    {
      id: '1',
      name: 'Lead Nurture Sequence',
      description: 'Automatically nurture new leads with email sequences',
      category: 'lead',
      icon: Mail,
      color: 'blue',
      workflow: {
        name: 'Lead Nurture Sequence',
        category: 'lead',
        trigger: {
          type: 'contact_created',
          config: { source: 'website' },
          description: 'When a new lead is created from website'
        },
        actions: [
          {
            id: '1',
            type: 'send_email',
            config: { 
              templateId: 'welcome',
              subject: 'Welcome to {{company_name}}'
            },
            description: 'Send welcome email'
          },
          {
            id: '2',
            type: 'wait',
            delay: { amount: 3, unit: 'days' },
            config: {},
            description: 'Wait 3 days'
          },
          {
            id: '3',
            type: 'send_email',
            config: { 
              templateId: 'follow_up_1',
              subject: 'How can we help you?'
            },
            description: 'Send first follow-up'
          }
        ]
      }
    },
    {
      id: '2',
      name: 'Deal Stage Automation',
      description: 'Move deals through stages based on activity',
      category: 'deal',
      icon: DollarSign,
      color: 'green',
      workflow: {
        name: 'Deal Stage Automation',
        category: 'deal',
        trigger: {
          type: 'deal_updated',
          config: { field: 'stage' },
          description: 'When deal stage changes'
        },
        conditions: [
          {
            id: '1',
            type: 'if',
            field: 'stage',
            operator: 'equals',
            value: 'proposal'
          }
        ],
        actions: [
          {
            id: '1',
            type: 'create_task',
            config: { 
              title: 'Send proposal to {{contact_name}}',
              dueIn: { amount: 2, unit: 'days' }
            },
            description: 'Create proposal task'
          },
          {
            id: '2',
            type: 'send_notification',
            config: { 
              to: 'deal_owner',
              message: 'Proposal stage reached for {{deal_name}}'
            },
            description: 'Notify deal owner'
          }
        ]
      }
    },
    {
      id: '3',
      name: 'Task Auto-Assignment',
      description: 'Automatically assign tasks based on criteria',
      category: 'task',
      icon: CheckCircle2,
      color: 'purple',
      workflow: {
        name: 'Task Auto-Assignment',
        category: 'task',
        trigger: {
          type: 'task_created',
          config: {},
          description: 'When a new task is created'
        },
        conditions: [
          {
            id: '1',
            type: 'if',
            field: 'priority',
            operator: 'equals',
            value: 'high'
          }
        ],
        actions: [
          {
            id: '1',
            type: 'assign_to',
            config: { 
              assignTo: 'team_lead',
              notifyAssignee: true
            },
            description: 'Assign to team lead'
          },
          {
            id: '2',
            type: 'add_tag',
            config: { tag: 'urgent' },
            description: 'Add urgent tag'
          }
        ]
      }
    },
    {
      id: '4',
      name: 'Email Engagement Tracking',
      description: 'Track and respond to email engagement',
      category: 'email',
      icon: MousePointer,
      color: 'indigo',
      workflow: {
        name: 'Email Engagement Tracking',
        category: 'email',
        trigger: {
          type: 'email_opened',
          config: { minOpens: 2 },
          description: 'When email opened 2+ times'
        },
        actions: [
          {
            id: '1',
            type: 'update_score',
            config: { 
              scoreChange: 10,
              reason: 'High email engagement'
            },
            description: 'Increase lead score'
          },
          {
            id: '2',
            type: 'create_activity',
            config: { 
              type: 'email_engagement',
              note: 'Contact showed high interest in email'
            },
            description: 'Log activity'
          }
        ]
      }
    },
    {
      id: '5',
      name: 'Meeting No-Show Follow-up',
      description: 'Automatically follow up on missed meetings',
      category: 'general',
      icon: Calendar,
      color: 'red',
      workflow: {
        name: 'Meeting No-Show Follow-up',
        category: 'general',
        trigger: {
          type: 'meeting_missed',
          config: {},
          description: 'When meeting marked as no-show'
        },
        actions: [
          {
            id: '1',
            type: 'send_email',
            config: { 
              templateId: 'meeting_missed',
              subject: 'Sorry we missed you'
            },
            description: 'Send apology email'
          },
          {
            id: '2',
            type: 'create_task',
            config: { 
              title: 'Reschedule meeting with {{contact_name}}',
              priority: 'high'
            },
            description: 'Create reschedule task'
          }
        ]
      }
    },
    {
      id: '6',
      name: 'Lead Scoring Automation',
      description: 'Score leads based on behavior and attributes',
      category: 'lead',
      icon: TrendingUp,
      color: 'yellow',
      workflow: {
        name: 'Lead Scoring Automation',
        category: 'lead',
        trigger: {
          type: 'contact_activity',
          config: { activityType: 'any' },
          description: 'On any contact activity'
        },
        conditions: [
          {
            id: '1',
            type: 'if',
            field: 'activity_type',
            operator: 'equals',
            value: 'website_visit'
          }
        ],
        actions: [
          {
            id: '1',
            type: 'update_score',
            config: { 
              scoreChange: 5,
              maxScore: 100
            },
            description: 'Add 5 points'
          },
          {
            id: '2',
            type: 'check_threshold',
            config: { 
              threshold: 80,
              action: 'notify_sales'
            },
            description: 'Check if MQL'
          }
        ]
      }
    }
  ];

  const triggerTypes = [
    { value: 'contact_created', label: 'Contact Created', icon: User },
    { value: 'contact_updated', label: 'Contact Updated', icon: User },
    { value: 'deal_created', label: 'Deal Created', icon: DollarSign },
    { value: 'deal_updated', label: 'Deal Stage Changed', icon: DollarSign },
    { value: 'task_created', label: 'Task Created', icon: CheckCircle2 },
    { value: 'task_completed', label: 'Task Completed', icon: CheckCircle2 },
    { value: 'email_sent', label: 'Email Sent', icon: Send },
    { value: 'email_opened', label: 'Email Opened', icon: Eye },
    { value: 'email_clicked', label: 'Email Link Clicked', icon: MousePointer },
    { value: 'form_submitted', label: 'Form Submitted', icon: FileText },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled', icon: Calendar },
    { value: 'meeting_missed', label: 'Meeting No-Show', icon: AlertCircle },
    { value: 'score_threshold', label: 'Score Threshold Reached', icon: TrendingUp },
    { value: 'time_based', label: 'Time-based Trigger', icon: Clock },
    { value: 'webhook', label: 'Webhook Received', icon: Link2 }
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', icon: Mail },
    { value: 'create_task', label: 'Create Task', icon: CheckCircle2 },
    { value: 'update_field', label: 'Update Field', icon: Edit2 },
    { value: 'assign_to', label: 'Assign To User', icon: User },
    { value: 'add_tag', label: 'Add Tag', icon: Tag },
    { value: 'remove_tag', label: 'Remove Tag', icon: Tag },
    { value: 'update_score', label: 'Update Score', icon: TrendingUp },
    { value: 'move_stage', label: 'Move Deal Stage', icon: Target },
    { value: 'create_activity', label: 'Log Activity', icon: Activity },
    { value: 'send_notification', label: 'Send Notification', icon: Bell },
    { value: 'webhook', label: 'Send Webhook', icon: Link2 },
    { value: 'wait', label: 'Wait/Delay', icon: Clock },
    { value: 'branch', label: 'Conditional Branch', icon: GitBranch },
    { value: 'send_sms', label: 'Send SMS', icon: MessageSquare },
    { value: 'create_deal', label: 'Create Deal', icon: DollarSign }
  ];

  useEffect(() => {
    loadWorkflows();
    setupRealtimeUpdates();
  }, []);

  useEffect(() => {
    filterWorkflows();
  }, [workflows, filterCategory, filterStatus, searchTerm]);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const workflowsQuery = query(
        collection(db, 'workflows'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(workflowsQuery);
      const workflowsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workflow[];
      
      // Add sample workflows if none exist
      if (workflowsData.length === 0) {
        const sampleWorkflows = await createSampleWorkflows();
        setWorkflows(sampleWorkflows);
      } else {
        setWorkflows(workflowsData);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSampleWorkflows = async () => {
    const sampleWorkflows: Workflow[] = [
      {
        id: '1',
        name: 'Welcome Email Sequence',
        description: 'Send welcome emails to new contacts',
        category: 'email',
        status: 'active',
        trigger: {
          type: 'contact_created',
          config: {},
          description: 'When contact is created'
        },
        conditions: [],
        actions: [
          {
            id: '1',
            type: 'send_email',
            config: { template: 'welcome' },
            description: 'Send welcome email'
          }
        ],
        stats: {
          totalRuns: 156,
          successfulRuns: 154,
          failedRuns: 2,
          lastRun: new Date(),
          averageTime: 2.3
        },
        createdBy: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Deal Won Celebration',
        description: 'Notify team when deal is won',
        category: 'deal',
        status: 'active',
        trigger: {
          type: 'deal_updated',
          config: { stage: 'closed-won' },
          description: 'When deal is won'
        },
        conditions: [],
        actions: [
          {
            id: '1',
            type: 'send_notification',
            config: { to: 'team' },
            description: 'Notify team'
          }
        ],
        stats: {
          totalRuns: 45,
          successfulRuns: 45,
          failedRuns: 0,
          lastRun: new Date(),
          averageTime: 1.2
        },
        createdBy: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Save to database
    for (const workflow of sampleWorkflows) {
      await addDoc(collection(db, 'workflows'), workflow);
    }

    return sampleWorkflows;
  };

  const setupRealtimeUpdates = () => {
    const workflowsQuery = query(collection(db, 'workflows'));
    
    const unsubscribe = onSnapshot(workflowsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          // Update workflow stats in real-time
          const updatedWorkflow = {
            id: change.doc.id,
            ...change.doc.data()
          } as Workflow;
          
          setWorkflows(prev => 
            prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w)
          );
        }
      });
    });

    return unsubscribe;
  };

  const filterWorkflows = () => {
    let filtered = [...workflows];

    if (filterCategory !== 'all') {
      filtered = filtered.filter(w => w.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(w => w.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredWorkflows(filtered);
  };

  const handleCreateWorkflow = async () => {
    try {
      const newWorkflow: Partial<Workflow> = {
        ...workflowData,
        status: 'draft',
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0
        },
        createdBy: 'Current User',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'workflows'), newWorkflow);
      
      const createdWorkflow = {
        ...newWorkflow,
        id: docRef.id
      } as Workflow;
      
      setWorkflows([...workflows, createdWorkflow]);
      setShowCreateModal(false);
      setShowWorkflowBuilder(false);
      resetWorkflowData();
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow');
    }
  };

  const handleUpdateWorkflowStatus = async (workflowId: string, status: 'active' | 'inactive') => {
    try {
      await updateDoc(doc(db, 'workflows', workflowId), {
        status,
        updatedAt: Timestamp.now()
      });
      
      setWorkflows(workflows.map(w => 
        w.id === workflowId ? { ...w, status } : w
      ));
    } catch (error) {
      console.error('Error updating workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      await deleteDoc(doc(db, 'workflows', workflowId));
      setWorkflows(workflows.filter(w => w.id !== workflowId));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const handleDuplicateWorkflow = async (workflow: Workflow) => {
    try {
      const duplicatedWorkflow = {
        ...workflow,
        name: `${workflow.name} (Copy)`,
        status: 'draft' as const,
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      delete (duplicatedWorkflow as any).id;
      
      const docRef = await addDoc(collection(db, 'workflows'), duplicatedWorkflow);
      
      setWorkflows([...workflows, { ...duplicatedWorkflow, id: docRef.id }]);
    } catch (error) {
      console.error('Error duplicating workflow:', error);
    }
  };

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setWorkflowData({
      name: template.workflow.name || '',
      description: template.workflow.description || '',
      category: template.workflow.category || 'general',
      trigger: template.workflow.trigger || null,
      conditions: template.workflow.conditions || [],
      actions: template.workflow.actions || []
    });
    setShowWorkflowBuilder(true);
  };

  const resetWorkflowData = () => {
    setWorkflowData({
      name: '',
      description: '',
      category: 'general',
      trigger: null,
      conditions: [],
      actions: []
    });
    setSelectedTemplate(null);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      lead: Users,
      contact: User,
      deal: DollarSign,
      task: CheckCircle2,
      email: Mail,
      general: Zap
    };
    return icons[category] || Zap;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      lead: 'bg-blue-100 text-blue-700',
      contact: 'bg-purple-100 text-purple-700',
      deal: 'bg-green-100 text-green-700',
      task: 'bg-yellow-100 text-yellow-700',
      email: 'bg-red-100 text-red-700',
      general: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading automations...</div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflow Automation</h1>
            <p className="text-gray-600 mt-1">
              Automate repetitive tasks and streamline your processes
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Workflows</p>
                <p className="text-2xl font-semibold">
                  {workflows.filter(w => w.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="text-2xl font-semibold">
                  {workflows.reduce((sum, w) => sum + w.stats.totalRuns, 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold">
                  {workflows.length > 0 
                    ? Math.round(
                        (workflows.reduce((sum, w) => sum + w.stats.successfulRuns, 0) /
                        workflows.reduce((sum, w) => sum + w.stats.totalRuns || 1, 1)) * 100
                      )
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Execution Time</p>
                <p className="text-2xl font-semibold">
                  {workflows.length > 0
                    ? (workflows.reduce((sum, w) => sum + (w.stats.averageTime || 0), 0) / workflows.length).toFixed(1)
                    : 0}s
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-64"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Categories</option>
                <option value="lead">Lead</option>
                <option value="contact">Contact</option>
                <option value="deal">Deal</option>
                <option value="task">Task</option>
                <option value="email">Email</option>
                <option value="general">General</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Workflows */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow) => {
              const CategoryIcon = getCategoryIcon(workflow.category);
              return (
                <div key={workflow.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${getCategoryColor(workflow.category)}`}>
                          <CategoryIcon className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleUpdateWorkflowStatus(
                            workflow.id,
                            workflow.status === 'active' ? 'inactive' : 'active'
                          )}
                          className="p-1"
                        >
                          {workflow.status === 'active' ? (
                            <ToggleRight className="h-8 w-8 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Zap className="h-4 w-4 mr-2" />
                        Trigger: {workflow.trigger.type.replace(/_/g, ' ')}
                      </div>
                      {workflow.conditions.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Filter className="h-4 w-4 mr-2" />
                          {workflow.conditions.length} condition(s)
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Layers className="h-4 w-4 mr-2" />
                        {workflow.actions.length} action(s)
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Runs: {workflow.stats.totalRuns}</span>
                        <span>Success: {Math.round((workflow.stats.successfulRuns / (workflow.stats.totalRuns || 1)) * 100)}%</span>
                        <span>
                          {workflow.stats.lastRun 
                            ? `Last: ${new Date(workflow.stats.lastRun).toLocaleDateString()}`
                            : 'Never run'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingWorkflow(workflow);
                            setShowWorkflowBuilder(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDuplicateWorkflow(workflow)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Copy className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="p-2 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">Workflow</th>
                  <th className="text-left p-4 font-medium text-gray-900">Category</th>
                  <th className="text-left p-4 font-medium text-gray-900">Trigger</th>
                  <th className="text-left p-4 font-medium text-gray-900">Status</th>
                  <th className="text-left p-4 font-medium text-gray-900">Runs</th>
                  <th className="text-left p-4 font-medium text-gray-900">Success Rate</th>
                  <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredWorkflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{workflow.name}</p>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded ${getCategoryColor(workflow.category)}`}>
                        {workflow.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {workflow.trigger.type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleUpdateWorkflowStatus(
                          workflow.id,
                          workflow.status === 'active' ? 'inactive' : 'active'
                        )}
                      >
                        {workflow.status === 'active' ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-500">
                            <Pause className="h-4 w-4 mr-1" />
                            Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {workflow.stats.totalRuns}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {Math.round((workflow.stats.successfulRuns / (workflow.stats.totalRuns || 1)) * 100)}%
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingWorkflow(workflow);
                            setShowWorkflowBuilder(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDuplicateWorkflow(workflow)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredWorkflows.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No workflows found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Workflow
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && !showWorkflowBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Create Workflow</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Choose a Template</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className="p-4 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start">
                          <div className={`p-2 bg-${template.color}-100 rounded-lg mr-3`}>
                            <Icon className={`h-5 w-5 text-${template.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center">
                  <p className="text-gray-600 mb-4">Or</p>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setShowWorkflowBuilder(true);
                    }}
                    className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Start from Scratch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Builder */}
        {showWorkflowBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    {editingWorkflow ? 'Edit Workflow' : 'Build Workflow'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowWorkflowBuilder(false);
                      setShowCreateModal(false);
                      setEditingWorkflow(null);
                      resetWorkflowData();
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 border-r p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workflow Name
                      </label>
                      <input
                        type="text"
                        value={workflowData.name}
                        onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter workflow name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={workflowData.description}
                        onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        rows={3}
                        placeholder="Describe what this workflow does"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={workflowData.category}
                        onChange={(e) => setWorkflowData({ ...workflowData, category: e.target.value as any })}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="general">General</option>
                        <option value="lead">Lead</option>
                        <option value="contact">Contact</option>
                        <option value="deal">Deal</option>
                        <option value="task">Task</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                  <div className="max-w-3xl mx-auto space-y-6">
                    {/* Trigger */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Trigger</h3>
                      </div>
                      
                      {workflowData.trigger ? (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">
                            {triggerTypes.find(t => t.value === workflowData.trigger?.type)?.label}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {workflowData.trigger.description}
                          </p>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => {
                            const triggerType = triggerTypes.find(t => t.value === e.target.value);
                            if (triggerType) {
                              setWorkflowData({
                                ...workflowData,
                                trigger: {
                                  type: triggerType.value,
                                  config: {},
                                  description: `When ${triggerType.label.toLowerCase()}`
                                }
                              });
                            }
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">Select a trigger</option>
                          {triggerTypes.map(trigger => (
                            <option key={trigger.value} value={trigger.value}>
                              {trigger.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Conditions */}
                    {workflowData.trigger && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                              <Filter className="h-5 w-5 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Conditions (Optional)</h3>
                          </div>
                          <button className="text-sm text-blue-600 hover:text-blue-700">
                            + Add Condition
                          </button>
                        </div>
                        
                        {workflowData.conditions.length > 0 ? (
                          <div className="space-y-2">
                            {workflowData.conditions.map(condition => (
                              <div key={condition.id} className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                  If {condition.field} {condition.operator} {condition.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No conditions added</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {workflowData.trigger && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                              <Layers className="h-5 w-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Actions</h3>
                          </div>
                          <select
                            onChange={(e) => {
                              const actionType = actionTypes.find(a => a.value === e.target.value);
                              if (actionType) {
                                const newAction: WorkflowAction = {
                                  id: Date.now().toString(),
                                  type: actionType.value,
                                  config: {},
                                  description: actionType.label
                                };
                                setWorkflowData({
                                  ...workflowData,
                                  actions: [...workflowData.actions, newAction]
                                });
                              }
                            }}
                            className="px-3 py-1 border rounded text-sm"
                            value=""
                          >
                            <option value="">+ Add Action</option>
                            {actionTypes.map(action => (
                              <option key={action.value} value={action.value}>
                                {action.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {workflowData.actions.length > 0 ? (
                          <div className="space-y-3">
                            {workflowData.actions.map((action, index) => {
                              const actionType = actionTypes.find(a => a.value === action.type);
                              const Icon = actionType?.icon || Layers;
                              return (
                                <div key={action.id} className="flex items-start">
                                  <div className="flex flex-col items-center mr-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                      <Icon className="h-4 w-4 text-gray-600" />
                                    </div>
                                    {index < workflowData.actions.length - 1 && (
                                      <div className="w-0.5 h-8 bg-gray-300 mt-2" />
                                    )}
                                  </div>
                                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium text-gray-900">
                                        {action.description}
                                      </p>
                                      <button
                                        onClick={() => {
                                          setWorkflowData({
                                            ...workflowData,
                                            actions: workflowData.actions.filter(a => a.id !== action.id)
                                          });
                                        }}
                                        className="p-1 hover:bg-gray-200 rounded"
                                      >
                                        <X className="h-4 w-4 text-gray-500" />
                                      </button>
                                    </div>
                                    {action.delay && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Delay: {action.delay.amount} {action.delay.unit}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No actions added</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowWorkflowBuilder(false);
                    setShowCreateModal(false);
                    setEditingWorkflow(null);
                    resetWorkflowData();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  disabled={!workflowData.name || !workflowData.trigger || workflowData.actions.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}