import { useReducer, useState } from 'react';
import { showToast } from '../components/ToastProvider';
import { Plus, Trash2, Save } from 'lucide-react';
import { formReducer, createFormState, formActions } from '../hooks/useFormReducer';
import { ConfirmDialog } from '../ui';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../hooks/queries';

const DEPARTMENT_ACTIONS = {
  SET_SHOW_FORM: 'SET_SHOW_FORM',
  SET_EDITING: 'SET_EDITING',
  ...formActions,
};

const departmentReducer = (state, action) => {
  switch (action.type) {
    case DEPARTMENT_ACTIONS.SET_SHOW_FORM:
      return { ...state, showForm: action.payload };
    case DEPARTMENT_ACTIONS.SET_EDITING:
      return { ...state, editingDept: action.payload };
    default:
      return formReducer(state, action);
  }
};

const createDepartmentState = () => ({
  ...createFormState({ name: '', description: '', color: '#6366f1' }),
  showForm: false,
  editingDept: null,
});

const DepartmentSettings = () => {
  const { data: departments = [], isLoading: loading } = useDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [state, dispatch] = useReducer(departmentReducer, createDepartmentState());
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(formActions.setField(name, value));
  };

  const handleEdit = (dept) => {
    dispatch({ type: DEPARTMENT_ACTIONS.SET_EDITING, payload: dept });
    dispatch({ type: DEPARTMENT_ACTIONS.SET_SHOW_FORM, payload: true });
    dispatch(
      formActions.setFields({
        name: dept.name,
        description: dept.description || '',
        color: dept.color || '#6366f1',
      })
    );
  };

  const handleCancelEdit = () => {
    dispatch({ type: DEPARTMENT_ACTIONS.SET_EDITING, payload: null });
    dispatch({ type: DEPARTMENT_ACTIONS.SET_SHOW_FORM, payload: false });
    dispatch(formActions.reset({ name: '', description: '', color: '#6366f1' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(formActions.setLoading(true));

    try {
      if (state.editingDept) {
        await updateMutation.mutateAsync({
          id: state.editingDept._id,
          data: state.data,
        });
        showToast.success('Department updated');
      } else {
        await createMutation.mutateAsync(state.data);
        showToast.success('Department created');
      }
      handleCancelEdit();
    } catch (err) {
      dispatch(formActions.setError(err.response?.data?.message || 'Failed to save'));
      showToast.error(err.response?.data?.message || 'Failed to save department');
    } finally {
      dispatch(formActions.setLoading(false));
    }
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;
    try {
      await deleteMutation.mutateAsync(departmentToDelete);
      showToast.success('Department deleted');
      setDepartmentToDelete(null);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete department');
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading departments...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
          <p className="text-sm text-gray-500 mt-1">Organize your staff into departments</p>
        </div>
        {!state.showForm && (
          <button
            onClick={() => dispatch({ type: DEPARTMENT_ACTIONS.SET_SHOW_FORM, payload: true })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            <Plus size={16} />
            Add Department
          </button>
        )}
      </div>

      {state.showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-4">
            {state.editingDept ? 'Edit Department' : 'New Department'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Department Name</label>
              <input
                type="text"
                name="name"
                value={state.data.name}
                onChange={handleChange}
                required
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Human Resources"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={state.data.description}
                onChange={handleChange}
                rows={2}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                placeholder="Optional description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <input
                type="color"
                name="color"
                value={state.data.color}
                onChange={handleChange}
                className="mt-1 h-10 w-20 border rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={state.loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              <Save size={16} />
              {state.loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {departments.length === 0 && !state.showForm && (
          <p className="text-gray-500 text-center py-8">
            No departments yet. Click "Add Department" to create one.
          </p>
        )}
        {departments.map((dept) => (
          <div
            key={dept._id}
            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dept.color || '#6366f1' }}
              />
              <div>
                <h3 className="font-medium text-gray-900">{dept.name}</h3>
                {dept.description && <p className="text-sm text-gray-500">{dept.description}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(dept)}
                className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => setDepartmentToDelete(dept._id)}
                disabled={deleteMutation.isPending}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(departmentToDelete)}
        title="Delete Department"
        message="Delete this department? This action cannot be undone."
        confirmLabel="Delete Department"
        confirmVariant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => !deleteMutation.isPending && setDepartmentToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default DepartmentSettings;
