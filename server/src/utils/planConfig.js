export const PLAN_LIMITS = {
  trial: {
    name: 'Trial',
    candidates: 20,
    users: 1,
    price: 0,
    trialDays: 14,
    description: '14-day free trial'
  },
  basic: {
    name: 'Basic',
    candidates: 200,
    users: 5,
    price: 2000,
    trialDays: null,
    description: 'NPR 2,000/month'
  },
  pro: {
    name: 'Pro',
    candidates: null,
    users: null,
    price: 5000,
    trialDays: null,
    description: 'NPR 5,000/month'
  }
};

export const DEFAULT_SERVICE_FEES = {};

export const DEFAULT_NOTIFICATION_PREFS = {
  passportExpiryDays: 60,
  medicalExpiryDays: 30,
  demandExpiryDays: 14,
  swukritiExpiryDays: 14,
  insuranceExpiryDays: 30,
  enabledAlertTypes: [
    'passport_expiring',
    'medical_expiring',
    'demand_expiring',
    'swukriti_expiring',
    'medical_failed',
    'process_stalled',
    'fee_outstanding',
    'orientation_missing',
    'insurance_expiring'
  ]
};

export const REQUIRED_ROLES = ['admin', 'manager', 'documentation', 'accounts', 'agent'];

export default PLAN_LIMITS;