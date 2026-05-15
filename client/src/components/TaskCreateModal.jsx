import { useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useStaff } from '../hooks/useStaff';
import { useCandidates } from '../hooks/useCandidates';
import { useJobDemands } from '../hooks/useJobDemands';
import { TASK_TYPES, TASK_PRIORITY_LABELS } from '../utils/constants';

const TaskCreateModal = ({ isOpen, onClose, onSuccess, prefill }) => {
  const { createTask } = useTasks();
  const { getUsers, users: staff } = useStaff();
  const { getCandidates, candidates } = useCandidates();
  const { getDemands, demands } = useJobDemands();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '', description: '', taskType: '', assignedTo: '',
    candidateId: '', demandId: '', dueDate: '', priority: 'medium', notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      getUsers({ limit: 100 });
      getCandidates({ limit: 100, status: 'registered' });
      getDemands({ limit: 100, status: 'active' });
      setErrors({});
      setFormData({
        title: prefill?.title || '',
        description: prefill?.description || '',
        taskType: prefill?.taskType || '',
        assignedTo: prefill?.assignedTo || '',
        candidateId: prefill?.candidateId || '',
        demandId: prefill?.demandId || '',
        dueDate: prefill?.dueDate ? new Date(prefill.dueDate).toISOString().split('T')[0] : '',
        priority: prefill?.priority || 'medium',
        notes: prefill?.notes || ''
      });
    }
  }, [isOpen, prefill]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.taskType) newErrors.taskType = 'Task type is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Assignee is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        dueDate: formData.dueDate || null,
        candidateId: formData.candidateId || null,
        demandId: formData.demandId || null
      };
      const task = await createTask(payload);
      onSuccess?.(task);
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to create task' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Create Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Task title"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Type *</label>
            <select
              name="taskType"
              value={formData.taskType}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select type</option>
              {TASK_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.taskType && <p className="text-red-500 text-xs mt-1">{errors.taskType}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select assignee</option>
                {staff.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              {errors.assignedTo && <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Candidate</label>
              <select
                name="candidateId"
                value={formData.candidateId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">None</option>
                {candidates.map(c => (
                  <option key={c._id} value={c._id}>{c.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related Demand</label>
            <select
              name="demandId"
              value={formData.demandId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">None</option>
              {demands.map(d => (
                <option key={d._id} value={d._id}>{d.companyName} - {d.country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Additional notes"
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errors.submit}</div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreateModal;