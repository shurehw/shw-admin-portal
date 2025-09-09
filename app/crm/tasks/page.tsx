'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Clock, CheckCircle2, AlertTriangle, Calendar, User, Building2,
  Filter, Search, MoreHorizontal, Edit, Trash2, Play, Pause
} from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'open' | 'in_progress' | 'waiting' | 'done';
  priority: 'low' | 'normal' | 'high';
  due_date?: string;
  completed_at?: string;
  owner_id?: string;
  related_contact_id?: string;
  related_company_id?: string;
  created_at: string;
  updated_at: string;
  contact_name?: string;
  company_name?: string;
  owner_name?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status: string;
    priority: string;
    owner: string;
    search: string;
  }>({
    status: 'all',
    priority: 'all', 
    owner: 'all',
    search: ''
  });

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Mock data - in production would fetch from API
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Follow up on Marriott proposal',
          notes: 'Check if they reviewed the custom keycard design',
          status: 'open',
          priority: 'high',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          owner_id: 'user1',
          related_company_id: 'comp1',
          company_name: 'Marriott International',
          owner_name: 'John Smith',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Schedule product demo with Hilton',
          notes: 'They want to see the new RFID lock integration',
          status: 'in_progress',
          priority: 'normal',
          due_date: new Date(Date.now() + 172800000).toISOString(),
          owner_id: 'user1',
          related_contact_id: 'cont1',
          contact_name: 'Sarah Johnson',
          company_name: 'Hilton Hotels',
          owner_name: 'John Smith',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Send hardware samples to IHG',
          notes: 'Include the new matte black finish options',
          status: 'done',
          priority: 'normal',
          completed_at: new Date(Date.now() - 86400000).toISOString(),
          owner_id: 'user2',
          related_company_id: 'comp3',
          company_name: 'InterContinental Hotels Group',
          owner_name: 'Emily Davis',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '4',
          title: 'Review contract terms with legal',
          notes: 'For the Hyatt master agreement',
          status: 'waiting',
          priority: 'high',
          due_date: new Date(Date.now() - 86400000).toISOString(), // Overdue
          owner_id: 'user1',
          related_company_id: 'comp4',
          company_name: 'Hyatt Hotels',
          owner_name: 'John Smith',
          created_at: new Date(Date.now() - 432000000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          title: 'Prepare Q1 pricing update',
          notes: 'Include volume discounts for enterprise clients',
          status: 'open',
          priority: 'low',
          due_date: new Date(Date.now() + 604800000).toISOString(),
          owner_id: 'user2',
          owner_name: 'Emily Davis',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      // Apply client-side filters
      let filteredTasks = mockTasks;
      
      if (filter.status !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === filter.status);
      }
      
      if (filter.priority !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
      }
      
      if (filter.owner !== 'all') {
        if (filter.owner === 'me') {
          filteredTasks = filteredTasks.filter(task => task.owner_id === 'user1');
        }
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(searchLower) ||
          task.notes?.toLowerCase().includes(searchLower) ||
          task.contact_name?.toLowerCase().includes(searchLower) ||
          task.company_name?.toLowerCase().includes(searchLower)
        );
      }
      
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      // Update task in local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status,
                completed_at: status === 'done' ? new Date().toISOString() : undefined,
                updated_at: new Date().toISOString()
              }
            : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      // Remove task from local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'normal': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Play className="h-5 w-5 text-blue-600" />;
      case 'waiting': return <Pause className="h-5 w-5 text-yellow-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">Manage your tasks and follow-ups</p>
          </div>
          <Link
            href="/crm/tasks/new"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="done">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Owner Filter */}
          <select
            value={filter.owner}
            onChange={(e) => setFilter({ ...filter, owner: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Owners</option>
            <option value="me">My Tasks</option>
            {/* TODO: Add actual users */}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No tasks found.</p>
            <p className="text-sm">Create your first task to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Status Icon */}
                    <button
                      onClick={() => {
                        const nextStatus = task.status === 'done' ? 'open' : 
                                         task.status === 'open' ? 'in_progress' :
                                         task.status === 'in_progress' ? 'done' : 'done';
                        updateTaskStatus(task.id, nextStatus);
                      }}
                      className="mt-1"
                    >
                      {getStatusIcon(task.status)}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        
                        {/* Priority Badge */}
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>

                        {/* Overdue/Due Badge */}
                        {isOverdue(task.due_date) && (
                          <span className="flex items-center text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </span>
                        )}
                        {isDueToday(task.due_date) && (
                          <span className="flex items-center text-xs text-orange-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Due Today
                          </span>
                        )}
                      </div>

                      {/* Task Details */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {/* Related Entity */}
                        {task.contact_name && (
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {task.contact_name}
                          </span>
                        )}
                        {task.company_name && (
                          <span className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {task.company_name}
                          </span>
                        )}

                        {/* Due Date */}
                        {task.due_date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}

                        {/* Owner */}
                        {task.owner_name && (
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {task.owner_name}
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-2">{task.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="relative group">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 hidden group-hover:block">
                        <Link
                          href={`/crm/tasks/${task.id}/edit`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Task
                        </Link>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Task
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'open').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <Play className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.due_date && isOverdue(t.due_date)).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'done').length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}