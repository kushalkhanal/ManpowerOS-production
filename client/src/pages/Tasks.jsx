import { useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskCreateModal from '../components/TaskCreateModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { TASK_STATUS_LABELS, TASK_PRIORITY_COLORS, TASK_TYPES, TASK_STATUS_COLORS } from '../utils/constants';

const Tasks = () => {
  const { tasks, getTasks, stats, getStats, loading, updateTaskStatus } = useTasks();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    getTasks({ status: filterStatus });
    getStats();
  }, []);

  useEffect(() => {
    const params = {};
    if (filterAssignedTo) params.assignedTo = filterAssignedTo;
    if (filterPriority) params.priority = filterPriority;
    getTasks(params);
  }, [filterAssignedTo, filterPriority]);

  const filterStatus = '';
  const columns = [
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  const handleStatusDragStart = (e, task, fromStatus) => {
    e.dataTransfer.setData('taskId', task._id);
    e.dataTransfer.setData('fromStatus', fromStatus);
  };

  const handleDrop = async (e, toStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const fromStatus = e.dataTransfer.getData('fromStatus');
    
    if (fromStatus !== toStatus) {
      await updateTaskStatus(taskId, toStatus);
      getTasks();
      getStats();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const filteredTasks = tasks;
  const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-gray-500">Pending: {stats.pending}</span>
            <span className="text-primary-600">In Progress: {stats.inProgress}</span>
            <span className="text-green-600">Completed: {stats.completed}</span>
            {stats.overdue > 0 && <span className="text-red-600">Overdue: {stats.overdue}</span>}
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
        <select
          value={filterAssignedTo}
          onChange={(e) => setFilterAssignedTo(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">All Assignees</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <div
            key={column.id}
            className="bg-gray-50 rounded-lg p-3 min-h-[500px]"
            onDrop={(e) => handleDrop(e, column.id)}
            onDragOver={handleDragOver}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-700">{column.label}</h3>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                {getTasksByStatus(column.id).length}
              </span>
            </div>
            <div className="space-y-2">
              {getTasksByStatus(column.id).map(task => (
                <div
                  key={task._id}
                  draggable
                  onDragStart={(e) => handleStatusDragStart(e, task, task.status)}
                  onClick={() => setSelectedTask(task._id)}
                  className="bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${TASK_PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-400">
                      {TASK_TYPES.find(t => t.value === task.taskType)?.label || task.taskType}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{task.assignedTo?.name}</span>
                    {task.dueDate && (
                      <span className={new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.candidateId && (
                    <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                      Candidate: {task.candidateId.fullName}
                    </div>
                  )}
                </div>
              ))}
              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskCreateModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          getTasks();
          getStats();
        }}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        taskId={selectedTask}
        onUpdate={() => {
          getTasks();
          getStats();
        }}
      />
    </div>
  );
};

export default Tasks;