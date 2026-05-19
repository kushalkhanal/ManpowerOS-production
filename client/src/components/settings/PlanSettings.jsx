import { useAuth } from '../../context/AuthContext';
import { useAgencySettings } from '../../hooks/queries';
import { PLAN_LIMITS } from '../../utils/constants';

const PlanSettings = () => {
  const { agency } = useAuth();
  const { data: settings } = useAgencySettings();

  const plan = agency?.plan || 'trial';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial;
  const usage = settings?.usage;
  const daysRemaining = usage?.daysRemaining;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-2xl font-bold text-primary">{limits.name}</p>
            {plan === 'trial' && daysRemaining != null && (
              <p className="text-sm text-amber-600">{daysRemaining} days remaining</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">
              {limits.price === 0 ? 'Free' : `NPR ${limits.price}/mo`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Candidates</p>
            <p className="text-lg font-semibold">
              {usage?.candidateCount ?? 0} / {limits.candidates || '∞'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-lg font-semibold">
              {usage?.userCount ?? 0} / {limits.users || '∞'}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Plan Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {limits.candidates || 'Unlimited'} candidates</li>
            <li>• {limits.users || 'Unlimited'} team members</li>
            <li>• Full access to all features</li>
          </ul>
        </div>

        {plan !== 'pro' && (
          <button className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
            Upgrade to {plan === 'trial' ? 'Basic' : 'Pro'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PlanSettings;
