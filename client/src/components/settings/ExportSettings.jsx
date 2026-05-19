import { useReducer, useEffect } from 'react';
import { Save } from 'lucide-react';
import { showToast } from '../ToastProvider';
import { formReducer, createFormState, formActions } from '../../hooks/useFormReducer';
import { useAgencySettings, useUpdateAgencySettings } from '../../hooks/queries';

const INITIAL = { defaultFormat: 'csv', includePhotos: false, dateFormat: 'BS' };

const ExportSettings = () => {
  const { data: settings } = useAgencySettings();
  const updateMutation = useUpdateAgencySettings();
  const [state, dispatch] = useReducer(formReducer, createFormState(INITIAL));

  useEffect(() => {
    if (settings?.settings?.exportPreferences) {
      dispatch(formActions.setFields({ ...INITIAL, ...settings.settings.exportPreferences }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(formActions.setLoading(true));
    try {
      await updateMutation.mutateAsync({ settings: { exportPreferences: state.data } });
      showToast.success('Export settings saved');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      dispatch(formActions.setLoading(false));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900">Export Settings</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Default Format</label>
        <select value={state.data.defaultFormat}
          onChange={e => dispatch(formActions.setField('defaultFormat', e.target.value))}
          className="mt-1 w-full px-3 py-2 border rounded-lg">
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Date Format</label>
        <select value={state.data.dateFormat}
          onChange={e => dispatch(formActions.setField('dateFormat', e.target.value))}
          className="mt-1 w-full px-3 py-2 border rounded-lg">
          <option value="BS">Buddhist Sambat (Nepali)</option>
          <option value="AD">AD (English)</option>
        </select>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={state.data.includePhotos}
          onChange={e => dispatch(formActions.setField('includePhotos', e.target.checked))}
          className="rounded border-gray-300" />
        <span className="text-sm text-gray-700">Include Photos in Export</span>
      </label>

      <button type="submit" disabled={state.loading || updateMutation.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
        <Save size={16} />
        {state.loading || updateMutation.isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};

export default ExportSettings;
