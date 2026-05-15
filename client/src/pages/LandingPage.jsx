import { Link } from 'react-router-dom';
import {
  Users, Briefcase, FileText, Stethoscope, GraduationCap,
  Globe, CheckCircle2, ArrowRight, Shield, Zap, BarChart3,
  MessageCircle, Star
} from 'lucide-react';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '9779800000000';
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=Hello%2C%20I%27m%20interested%20in%20a%20demo%20of%20ManpowerOS.`;

const FEATURES = [
  {
    icon: Users,
    title: 'Full Candidate Pipeline',
    desc: 'Track every worker from registration through departure — medical, orientation, visa, FEIMS, and Shram Swukriti in one place.',
  },
  {
    icon: Globe,
    title: 'Nepal DoFE Compliance',
    desc: 'Built-in FEIMS submission center, Purba Swukriti tracking, and DoFE-aligned workflows so you never miss a compliance step.',
  },
  {
    icon: Stethoscope,
    title: 'Medical & Orientation Boards',
    desc: 'Kanban boards for medical exams and orientation sessions. Track pass/fail, schedule dates, and flag expired results automatically.',
  },
  {
    icon: Briefcase,
    title: 'Gulf, Malaysia & Korea',
    desc: 'Dedicated modules for Gulf visa stamping, Malaysia PLKS processing, and Korea EPS — each country\'s workflow built in.',
  },
  {
    icon: FileText,
    title: 'Document Management',
    desc: 'Store passports, demand letters, insurance papers, and contracts securely. Bulk export to Excel or PDF for audits.',
  },
  {
    icon: BarChart3,
    title: 'Team Collaboration',
    desc: 'Assign agents to candidates, set tasks, track progress in real time. Role-based access for managers, documentation, and accounts.',
  },
];

const PIPELINE_STAGES = [
  'Registered', 'Demand Allocated', 'FEIMS Submitted', 'Medical', 'Orientation',
  'Insurance & SSF', 'Visa Applied', 'Shram Swukriti', 'Flight Booked', 'Departed',
];

const PLANS = [
  {
    key: 'trial',
    name: 'Free Trial',
    price: 'Free',
    period: '14 days',
    highlight: false,
    features: ['Up to 20 candidates', '1 user account', 'Full feature access', 'No credit card'],
  },
  {
    key: 'basic',
    name: 'Basic',
    price: 'NPR 2,000',
    period: 'per month',
    highlight: true,
    features: ['Up to 200 candidates', '5 team members', 'All pipeline stages', 'Email support'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 'NPR 5,000',
    period: 'per month',
    highlight: false,
    features: ['Unlimited candidates', 'Unlimited team members', 'Priority support', 'Bulk exports'],
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-bold text-gray-900">ManpowerOS</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MessageCircle size={15} />
              WhatsApp Demo
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/get-started"
              className="text-sm font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-6">
            <Shield size={14} />
            Nepal DoFE Compliant · No credit card required
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Manage your manpower agency
            <span className="text-primary block mt-1">end-to-end, digitally.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            From candidate registration to departure — track FEIMS submissions, medical boards,
            orientation, visa stamping, and Shram Swukriti all in one platform built for Nepal.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/get-started"
              className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md"
            >
              Start your free 14-day trial
              <ArrowRight size={18} />
            </Link>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1ebe5a] transition-colors shadow-md"
            >
              <MessageCircle size={18} />
              Demo on WhatsApp
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Free for 14 days · No setup fees · Cancel anytime
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-50 border-y border-gray-100 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          {['FEIMS Integrated', 'Shram Swukriti Tracking', 'Gulf · Malaysia · Korea', 'Medical Board', 'Orientation Tracking', 'Role-Based Access'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary shrink-0" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Pipeline overview */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">15-stage candidate pipeline</h2>
            <p className="mt-2 text-gray-500">Every step of the DoFE workflow — tracked automatically.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1.5">
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  {stage}
                </span>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight size={12} className="text-gray-300 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Everything your agency needs</h2>
            <p className="mt-2 text-gray-500">Purpose-built for Nepal's foreign employment industry.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-12">Up and running in minutes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Create your agency', desc: 'Sign up with your agency name and admin email. No paperwork, instant access.' },
              { n: '2', title: 'Add your candidates', desc: 'Import existing candidates or add new ones. Assign agents and track progress.' },
              { n: '3', title: 'Track the full pipeline', desc: 'Follow every candidate from registration to departure with automated status updates.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-lg">
                  {n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-2 text-gray-500">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.key}
                className={`rounded-2xl p-6 border-2 flex flex-col ${
                  plan.highlight
                    ? 'border-primary bg-primary text-white shadow-xl scale-105'
                    : 'border-gray-100 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-white px-2 py-0.5 rounded-full w-fit mb-3">
                    <Star size={10} fill="currentColor" />
                    Most popular
                  </div>
                )}
                <h3 className={`text-lg font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-3 mb-5">
                  <span className={`text-3xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ml-1 ${plan.highlight ? 'text-white/70' : 'text-gray-400'}`}>
                    / {plan.period}
                  </span>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={15} className={plan.highlight ? 'text-white' : 'text-primary'} />
                      <span className={plan.highlight ? 'text-white/90' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/get-started"
                  className={`mt-6 text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-white text-primary hover:bg-gray-50'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {plan.key === 'trial' ? 'Start Free Trial' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <Zap size={32} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Ready to streamline your agency?
          </h2>
          <p className="mt-3 text-gray-500">
            Join manpower agencies across Nepal already managing their pipeline digitally.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/get-started"
              className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md"
            >
              Start free trial
              <ArrowRight size={18} />
            </Link>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1ebe5a] transition-colors shadow-md"
            >
              <MessageCircle size={18} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-white font-semibold">ManpowerOS</span>
            <span className="text-gray-500 text-sm ml-2">Nepal's Manpower Management Platform</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link to="/get-started" className="hover:text-white transition-colors">Start trial</Link>
            <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              WhatsApp
            </a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} ManpowerOS. Built for Nepal's foreign employment sector.
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={26} className="text-white" />
      </a>
    </div>
  );
};

export default LandingPage;
