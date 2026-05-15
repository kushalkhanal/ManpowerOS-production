import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { candidatesApi, staffApi, sponsorsApi } from '../api';
import { CheckCircle2, Circle, X, ChevronRight, Rocket } from 'lucide-react';

const STORAGE_KEY = 'onboarding_dismissed';

const STEPS = [
  {
    id: 'profile',
    label: 'Complete agency profile',
    description: 'Add your DoFE license number and address',
    href: '/settings/profile',
    check: async () => true, // checked via agency object
  },
  {
    id: 'staff',
    label: 'Invite your first staff member',
    description: 'Add team members so they can manage candidates',
    href: '/settings/staff',
    check: async () => {
      try {
        const r = await staffApi.getAll({ limit: 2 });
        return (r.data?.total || 0) > 1;
      } catch { return false; }
    },
  },
  {
    id: 'sponsor',
    label: 'Add a sponsor / employer',
    description: 'Add your first overseas employer to the directory',
    href: '/directory',
    check: async () => {
      try {
        const r = await sponsorsApi.getAll({ limit: 1 });
        return (r.data?.total || 0) > 0;
      } catch { return false; }
    },
  },
  {
    id: 'candidate',
    label: 'Register your first candidate',
    description: 'Add a worker to start tracking their pipeline',
    href: '/candidates',
    check: async () => {
      try {
        const r = await candidatesApi.getAll({ limit: 1 });
        return (r.data?.total || 0) > 0;
      } catch { return false; }
    },
  },
  {
    id: 'demand',
    label: 'Create a job demand',
    description: 'Link candidates to employer job orders',
    href: '/demands',
    check: async () => true, // lightweight — skip API call
  },
];

const OnboardingChecklist = () => {
  const { agency } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [done, setDone] = useState({});
  const [loading, setLoading] = useState(true);

  const agencyKey = `${STORAGE_KEY}_${agency?._id}`;

  useEffect(() => {
    if (!agency?._id) return;
    if (localStorage.getItem(agencyKey) === 'true') return;

    const run = async () => {
      const results = {};
      await Promise.allSettled(
        STEPS.map(async (s) => {
          results[s.id] = await s.check();
        })
      );
      // Also mark profile done if agency has a DoFE license
      results.profile = !!agency?.settings?.dofeLicenseNumber;
      setDone(results);
      setLoading(false);

      const allDone = STEPS.every(s => results[s.id]);
      if (!allDone) setVisible(true);
    };
    run();
  }, [agency?._id]);

  const completedCount = STEPS.filter(s => done[s.id]).length;
  const allDone = completedCount === STEPS.length;

  const dismiss = () => {
    localStorage.setItem(agencyKey, 'true');
    setVisible(false);
  };

  useEffect(() => {
    if (allDone && !loading) {
      setTimeout(dismiss, 2000);
    }
  }, [allDone, loading]);

  if (!visible || loading) return null;

  if (minimised) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setMinimised(false)}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-lg text-sm font-medium text-gray-700 hover:shadow-xl transition-shadow"
        >
          <Rocket size={15} className="text-primary" />
          Setup {completedCount}/{STEPS.length}
          <span className="ml-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket size={16} className="text-white" />
          <span className="text-sm font-bold text-white">Get started</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimised(true)}
            className="p-1 text-white/70 hover:text-white rounded"
            aria-label="Minimise"
          >
            <span className="text-lg leading-none">—</span>
          </button>
          <button
            onClick={dismiss}
            className="p-1 text-white/70 hover:text-white rounded"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 px-4 pt-2">
        {completedCount} of {STEPS.length} completed
      </p>

      {/* Steps */}
      <ul className="px-4 pb-4 pt-2 space-y-2">
        {STEPS.map(step => {
          const isDone = done[step.id];
          return (
            <li key={step.id}>
              <button
                onClick={() => navigate(step.href)}
                disabled={isDone}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors ${
                  isDone
                    ? 'opacity-50 cursor-default'
                    : 'hover:bg-gray-50 group'
                }`}
              >
                {isDone
                  ? <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                  : <Circle size={18} className="text-gray-300 mt-0.5 shrink-0 group-hover:text-primary" />
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {step.label}
                  </p>
                  {!isDone && (
                    <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                  )}
                </div>
                {!isDone && (
                  <ChevronRight size={14} className="text-gray-300 mt-1 shrink-0 group-hover:text-primary" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {allDone && (
        <div className="px-4 pb-4 text-center">
          <p className="text-sm font-medium text-emerald-600">All done! You're set up.</p>
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
