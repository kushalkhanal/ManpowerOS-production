import { useReducer, useEffect } from 'react';
import { showToast } from '../components/ToastProvider';
import { Save } from 'lucide-react';
import { formReducer, createFormState, formActions } from '../hooks/useFormReducer';
import { useAgencySettings, useUpdateAgencySettings } from '../hooks/queries';
import { DESIRED_COUNTRIES } from '../utils/constants';

const FeeSettings = () => {
  const { data: settings, isLoading: loading } = useAgencySettings();
  const updateMutation = useUpdateAgencySettings();

  const [state, dispatch] = useReducer(formReducer, createFormState({}));

  useEffect(() => {
    if (settings?.settings?.serviceFeeDefaults) {
      const fees = {};
      const defaults = settings.settings.serviceFeeDefaults;
      
      // Handle both Map and plain Object
      if (defaults && typeof defaults.forEach === 'function') {
        defaults.forEach((value, key) => {
          fees[key] = value;
        });
      } else if (defaults) {
        Object.entries(defaults).forEach(([key, value]) => {
          fees[key] = value;
        });
      }
      dispatch(formActions.setFields(fees));
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(formActions.setField(name, value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(formActions.setLoading(true));

    try {
      const serviceFeeDefaults = {};
      Object.entries(state.data).forEach(([key, value]) => {
        if (value) serviceFeeDefaults[key] = parseInt(value) || 0;
      });

      await updateMutation.mutateAsync({
        settings: { serviceFeeDefaults },
      });

      showToast.success('Service fees saved');
    } catch (err) {
      dispatch(formActions.setError(err.response?.data?.message || 'Failed to save'));
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      dispatch(formActions.setLoading(false));
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Default Service Fees</h2>
        <p className="text-sm text-gray-500 mb-4">
          Set default service fees per country. These pre-fill when registering new candidates.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DESIRED_COUNTRIES.map((country) => (
            <div key={country}>
              <label className="block text-sm font-medium text-gray-700">{country}</label>
              <input
                type="number"
                name={country}
                value={state.data[country] || ''}
                onChange={handleChange}
                placeholder="NPR 0"
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={state.loading || updateMutation.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
      >
        <Save size={16} />
        {state.loading || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

export default FeeSettings;
