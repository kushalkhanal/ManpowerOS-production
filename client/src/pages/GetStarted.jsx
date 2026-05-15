import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

const GetStarted = () => {
  const { user, registerPublic } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    agencyName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Already logged in — no need to be here
  useEffect(() => {
    if (user) {
      navigate(user.role === 'superadmin' ? '/superadmin/dashboard' : '/candidates', { replace: true });
    }
  }, [user, navigate]);

  // Auto-generate subdomain from agency name
  useEffect(() => {
    const suggested = formData.agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    setFormData(prev => ({ ...prev, subdomain: suggested }));
  }, [formData.agencyName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subdomain') {
      setFormData(prev => ({ ...prev, subdomain: value.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.adminPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&).');
      return;
    }

    if (!formData.subdomain) {
      setError('Subdomain is required.');
      return;
    }

    setLoading(true);
    try {
      await registerPublic(formData);
      setSuccess(true);
      setTimeout(() => navigate('/candidates'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
          <p className="mt-2 text-gray-500">Taking you to your dashboard&hellip;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} />
          Back to home
        </Link>
        <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Already have an account? <span className="text-primary font-medium">Sign in</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create your agency</h1>
            <p className="mt-1 text-sm text-gray-500">
              Free 14-day trial · No credit card required
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agency name <span className="text-red-500">*</span>
                </label>
                <input
                  name="agencyName"
                  type="text"
                  required
                  value={formData.agencyName}
                  onChange={handleChange}
                  placeholder="ABC Manpower Services"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subdomain <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-colors">
                  <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 shrink-0">
                    app/
                  </span>
                  <input
                    name="subdomain"
                    type="text"
                    required
                    value={formData.subdomain}
                    onChange={handleChange}
                    placeholder="yourcompany"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                {formData.subdomain && (
                  <p className="mt-1 text-xs text-gray-400">Your login: {formData.subdomain}.manpoweros.com</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Admin account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your full name <span className="text-red-500">*</span>
                </label>
                <input
                  name="adminName"
                  type="text"
                  required
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="Ram Prasad Sharma"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  name="adminEmail"
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="you@yourcompany.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="adminPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.adminPassword}
                    onChange={handleChange}
                    placeholder="Min 8 chars, uppercase, number, symbol"
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? 'Creating your agency…' : 'Create agency & start free trial'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            By signing up you agree to our terms. Your data is stored securely and never shared.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
