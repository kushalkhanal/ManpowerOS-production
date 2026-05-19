import { useReducer, useEffect } from 'react';
import { Save } from 'lucide-react';
import { showToast } from '../ToastProvider';
import { formReducer, createFormState, formActions } from '../../hooks/useFormReducer';
import { useAgencySettings, useUpdateAgencySettings } from '../../hooks/queries';
import { ALERT_TYPES } from '../../utils/constants';

const INITIAL = {
  passportExpiryDays: 60,
  medicalExpiryDays: 30,
  demandExpiryDays: 14,
  swukritiExpiryDays: 14,
  insuranceExpiryDays: 30,
  enabledAlertTypes: [],
};

const NotificationSettings = () => {
  const { data: settings } = useAgencySettings();
  const updateMutation = useUpdateAgencySettings();
  const [state, dispatch] = useReducer(formReducer, createFormState(INITIAL));

  useEffect(() => {
    if (settings?.settings?.notificationPreferences) {
      dispatch(formActions.setFields({ ...INITIAL, ...settings.settings.notificationPreferences }));
    }
  }, [settings]);

  const toggleAlertType = (type) => {
    const current = state.data.enabledAlertTypes || [];
    dispatch(formActions.setField(
      'enabledAlertTypes',
      current.includes(type) ? current.filter(t => t !== type) : [...current, type]
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(formActions.setLoading(true));
    try {
      await updateMutation.mutateAsync({ settings: { notificationPreferences: state.data } });
      showToast.success('Notification settings saved');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      dispatch(formActions.setLoading(false));
    }
  };

  const daySelect = (name, label, options) => (
    <div key={name}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select name={name} value={state.data[name]}
        onChange={e => dispatch(formActions.setField(name, Number(e.target.value)))}
        className="mt-1 w-full px-3 py-2 border rounded-lg">
        {options.map(d => <option key={d} value={d}>{d} days</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Preferences</h2>

        <div className="space-y-4 mb-6">
          {daySelect('passportExpiryDays', 'Passport Expiry Warning (days)', [30, 45, 60, 90])}
          {daySelect('medicalExpiryDays', 'Medical Expiry Warning (days)', [14, 30, 45])}
          {daySelect('demandExpiryDays', 'Demand Expiry Warning (days)', [7, 14, 30])}
        </div>

        <h3 className="text-sm font-medium text-gray-900 mb-3">Enabled Alert Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALERT_TYPES.map(type => (
            <label key={type.value} className="flex items-center gap-2">
              <input type="checkbox"
                checked={(state.data.enabledAlertTypes || []).includes(type.value)}
                onChange={() => toggleAlertType(type.value)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={state.loading || updateMutation.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
        <Save size={16} />
        {state.loading || updateMutation.isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};

export default NotificationSettings;
