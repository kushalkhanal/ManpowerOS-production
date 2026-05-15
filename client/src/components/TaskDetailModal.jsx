import { useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useStaff } from '../hooks/useStaff';
import { useCandidates } from '../hooks/useCandidates';
import { useJobDemands } from '../hooks/useJobDemands';
import { taskApi } from '../api';
import { TASK_TYPES, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '../utils/constants';
import { ConfirmDialog } from './ui';

const TaskDetailModal = ({ isOpen, onClose, taskId, onUpdate }) => {
  const { updateTask, updateTaskStatus, deleteTask } = useTasks();
  const { getUsers, users: staff } = useStaff();
  const { getCandidates, candidates } = useCandidates();
  const { getDemands, demands } = useJobDemands();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', taskType: '', assignedTo: '',
    candidateId: '', demandId: '', dueDate: '', priority: 'medium', notes: ''
  });

  useEffect(() => {
    if (isOpen && taskId) {
      getUsers({ limit: 100 });
      getCandidates({ limit: 100 });
      getDemands({ limit: 100 });
      setEditMode(false);
    }
  }, [isOpen, taskId]);

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        taskType: task.taskType || '',
        assignedTo: task.assignedTo?._id || '',
        candidateId: task.candidateId?._id || '',
        demandId: task.demandId?._id || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        priority: task.priority || 'medium',
        notes: task.notes || ''
      });
      setTask(task);
    }
  }, [task, isOpen]);

  const loadTask = (t) => {
    setTask(t);
    setFormData({
      title: t.title || '',
      description: t.description || '',
      taskType: t.taskType || '',
      assignedTo: t.assignedTo?._id || '',
      candidateId: t.candidateId?._id || '',
      demandId: t.demandId?._id || '',
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      priority: t.priority || 'medium',
      notes: t.notes || ''
    });
  };

  useEffect(() => {
    if (taskId && isOpen && staff.length > 0) {
      const fetchTask = async () => {
        try {
          const res = await taskApi.getById(taskId);
          loadTask(res.data);
        } catch (err) {
          console.error('Failed to load task:', err);
        }
      };
      fetchTask();
    }
  }, [taskId, isOpen, staff.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }
    setLoading(true);
    try {
      const updated = await updateTask(taskId, formData);
      setTask(updated);
      setEditMode(false);
      onUpdate?.(updated);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to update' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const updated = await updateTaskStatus(taskId, newStatus, '');
      setTask(updated);
      onUpdate?.(updated);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to update status' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTask(taskId);
      onClose();
      onUpdate?.(null, 'deleted');
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to delete' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  const priorityColor = task ? TASK_PRIORITY_COLORS[task.priority] : '';
  const statusColor = task ? TASK_STATUS_COLORS[task.status] : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Task Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {task && (
          <div className="p-4 space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor}`}>
                {TASK_PRIORITY_LABELS[task.priority]}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {TASK_TYPES.find(t => t.value === task.taskType)?.label || task.taskType}
              </span>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select</option>
                      {staff.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Related Candidate</label>
                    <select
                      name="candidateId"
                      value={formData.candidateId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">None</option>
                      {candidates.map(c => (
                        <option key={c._id} value={c._id}>{c.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{task.title}</h3>
                  {task.description && <p className="text-gray-600 mt-1">{task.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Assigned To:</span>
                    <p className="font-medium">{task.assignedTo?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned By:</span>
                    <p className="font-medium">{task.assignedBy?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <p className="font-medium">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                  {task.candidateId && (
                    <div>
                      <span className="text-gray-500">Candidate:</span>
                      <p className="font-medium">{task.candidateId.fullName}</p>
                    </div>
                  )}
                  {task.demandId && (
                    <div>
                      <span className="text-gray-500">Demand:</span>
                      <p className="font-medium">{task.demandId.companyName}</p>
                    </div>
                  )}
                </div>

                {task.notes && (
                  <div>
                    <span className="text-gray-500 text-sm">Notes:</span>
                    <p className="text-sm">{task.notes}</p>
                  </div>
                )}

                {task.completedAt && (
                  <div className="text-sm text-green-600">
                    Completed on {new Date(task.completedAt).toLocaleString()} by {task.completedBy?.name}
                  </div>
                )}
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errors.submit}</div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm text-green-700 bg-green-100 rounded hover:bg-green-200"
                  >
                    Mark Complete
                  </button>
                )}
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm text-primary-700 bg-primary-100 rounded hover:bg-primary-200"
                  >
                    Start Task
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 text-white bg-primary-600 rounded-lg"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete Task"
        confirmVariant="danger"
        loading={loading}
        onCancel={() => !loading && setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TaskDetailModal;