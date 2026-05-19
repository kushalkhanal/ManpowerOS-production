import { useReducer, useEffect } from 'react';
import { showToast } from '../ToastProvider';
import { Save, AlertTriangle } from 'lucide-react';
import { formReducer, createFormState, formActions } from '../../hooks/useFormReducer';
import { useAgencySettings, useUpdateAgencySettings } from '../../hooks/queries';

const ProfileSettings = () => {
  const { data: settings, isLoading: loading } = useAgencySettings();
  const updateMutation = useUpdateAgencySettings();

  const [state, dispatch] = useReducer(
    formReducer,
    createFormState({
      name: '',
      nameNepali: '',
      dofeLicenseNumber: '',
      dofeLicenseExpiry: '',
      phone: '',
      website: '',
      logo: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    })
  );

  // Load settings when they arrive from query
  useEffect(() => {
    if (settings) {
      dispatch(
        formActions.setFields({
          name: settings.name || '',
          nameNepali: settings.settings?.nameNepali || '',
          dofeLicenseNumber: settings.settings?.dofeLicenseNumber || '',
          dofeLicenseExpiry: settings.settings?.dofeLicenseExpiry?.split('T')[0] || '',
          phone: settings.settings?.phone || '',
          website: settings.settings?.website || '',
          logo: settings.settings?.logo || '',
          street: settings.settings?.address?.street || '',
          city: settings.settings?.address?.city || '',
          state: settings.settings?.address?.state || '',
          zipCode: settings.settings?.address?.zipCode || '',
          country: settings.settings?.address?.country || '',
        })
      );
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
      await updateMutation.mutateAsync({
        name: state.data.name,
        settings: {
          nameNepali: state.data.nameNepali,
          dofeLicenseNumber: state.data.dofeLicenseNumber,
          dofeLicenseExpiry: state.data.dofeLicenseExpiry,
          phone: state.data.phone,
          website: state.data.website,
          logo: state.data.logo,
          address: {
            street: state.data.street,
            city: state.data.city,
            state: state.data.state,
            zipCode: state.data.zipCode,
            country: state.data.country,
          },
        },
      });
      showToast.success('Settings saved');
    } catch (err) {
      dispatch(formActions.setError(err.response?.data?.message || 'Failed to save'));
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      dispatch(formActions.setLoading(false));
    }
  };

  const daysUntilExpiry = state.data.dofeLicenseExpiry
    ? Math.ceil((new Date(state.data.dofeLicenseExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 60 && daysUntilExpiry > 0;

  if (loading) {
    return <div className="text-gray-500">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agency Profile</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Agency Name (English)</label>
            <input
              type="text"
              name="name"
              value={state.data.name}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Agency Name (नेपाली)</label>
            <input
              type="text"
              name="nameNepali"
              value={state.data.nameNepali}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DoFE License Number</label>
            <input
              type="text"
              name="dofeLicenseNumber"
              value={state.data.dofeLicenseNumber}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DoFE License Expiry</label>
            <input
              type="date"
              name="dofeLicenseExpiry"
              value={state.data.dofeLicenseExpiry}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
            {isExpiringSoon && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Expires in {daysUntilExpiry} days
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              name="phone"
              value={state.data.phone}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <input
              type="text"
              name="website"
              value={state.data.website}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="https://"
            />
          </div>
        </div>

        <h3 className="text-md font-medium text-gray-900 mt-6 mb-3">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Street</label>
            <input
              type="text"
              name="street"
              value={state.data.street}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={state.data.city}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State/Province</label>
            <input
              type="text"
              name="state"
              value={state.data.state}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
            <input
              type="text"
              name="zipCode"
              value={state.data.zipCode}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              name="country"
              value={state.data.country}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
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

export default ProfileSettings;
