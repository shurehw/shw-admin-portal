'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, User, Flag } from 'lucide-react';

export default function NewTaskPage() {
  const router = useRouter();
  const [task, setTask] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'medium',
    relatedTo: '',
    type: 'general'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle task creation
    console.log('Creating task:', task);
    router.push('/crm/activities');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
        <p className="text-gray-600 mt-1">Add a new task or activity</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={task.title}
            onChange={(e) => setTask({...task, title: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Enter task title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={task.description}
            onChange={(e) => setTask({...task, description: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            rows={4}
            placeholder="Add task details..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <select
              value={task.type}
              onChange={(e) => setTask({...task, type: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="general">General</option>
              <option value="call">Phone Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="follow-up">Follow-up</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={task.priority}
              onChange={(e) => setTask({...task, priority: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={task.dueDate}
              onChange={(e) => setTask({...task, dueDate: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <select
              value={task.assignee}
              onChange={(e) => setTask({...task, assignee: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Select assignee</option>
              <option value="me">Me</option>
              <option value="john">John Smith</option>
              <option value="sarah">Sarah Johnson</option>
              <option value="mike">Mike Davis</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related To
          </label>
          <input
            type="text"
            value={task.relatedTo}
            onChange={(e) => setTask({...task, relatedTo: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Contact, Company, or Deal"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
}