/**
 * StatusBadge — unified badge for ALL status values across the app.
 *
 * Usage:
 *   <StatusBadge status="demand_assigned" />
 *   <StatusBadge status="medical_passed" size="md" />
 *   <StatusBadge status={candidate.status} />
 */

const STATUS_CONFIG = {
  // ─── Stage 0: Registration ───────────────────────────────────────
  registered:             { label: 'Registered',            color: 'bg-gray-100 text-gray-800'     },
  pre_screened:           { label: 'Pre-Screened',          color: 'bg-gray-200 text-gray-900'     },
  // ─── Stage 1: Demand & Matching ─────────────────────────────────
  demand_searching:       { label: 'Demand Searching',      color: 'bg-slate-100 text-slate-800'   },
  demand_allocated:       { label: 'Demand Allocated',      color: 'bg-indigo-100 text-indigo-800' },
  trade_test_scheduled:   { label: 'Trade Test Scheduled',  color: 'bg-indigo-100 text-indigo-700' },
  trade_test_passed:      { label: 'Trade Test Passed',     color: 'bg-indigo-200 text-indigo-900' },
  trade_test_failed:      { label: 'Trade Test Failed',     color: 'bg-red-100 text-red-800'       },
  // ─── Stage 2: Documentation ─────────────────────────────────────
  passport_pending:       { label: 'Passport Pending',      color: 'bg-violet-100 text-violet-700' },
  passport_collected:     { label: 'Passport Collected',    color: 'bg-violet-200 text-violet-900' },
  documents_complete:     { label: 'Documents Complete',    color: 'bg-violet-300 text-violet-900' },
  // ─── Stage 3: FEIMS ─────────────────────────────────────────────
  feims_pending:          { label: 'FEIMS Pending',         color: 'bg-cyan-100 text-cyan-700'     },
  feims_submitted:        { label: 'FEIMS Submitted',       color: 'bg-cyan-200 text-cyan-800'     },
  feims_registered:       { label: 'FEIMS Registered',      color: 'bg-cyan-300 text-cyan-900'     },
  // ─── Stage 4: Medical ────────────────────────────────────────────
  medical_scheduled:      { label: 'Medical Scheduled',     color: 'bg-teal-100 text-teal-700'     },
  medical_passed:         { label: 'Medical Passed',        color: 'bg-teal-200 text-teal-900'     },
  medical_failed:         { label: 'Medical Failed',        color: 'bg-red-100 text-red-800'       },
  medical_on_hold:        { label: 'Medical On Hold',       color: 'bg-yellow-100 text-yellow-800' },
  medical_expired:        { label: 'Medical Expired',       color: 'bg-red-200 text-red-900'       },
  // ─── Stage 5: Orientation ────────────────────────────────────────
  orientation_scheduled:  { label: 'Orientation Scheduled', color: 'bg-purple-100 text-purple-700' },
  orientation_completed:  { label: 'Orientation Completed', color: 'bg-purple-200 text-purple-900' },
  orientation_absent:     { label: 'Orientation Absent',    color: 'bg-red-100 text-red-700'       },
  // ─── Stage 6: Compliance ─────────────────────────────────────────
  compliance_pending:     { label: 'Compliance Pending',    color: 'bg-blue-100 text-blue-700'     },
  insurance_done:         { label: 'Insurance Done',        color: 'bg-blue-100 text-blue-800'     },
  ssf_done:               { label: 'SSF Done',              color: 'bg-blue-200 text-blue-800'     },
  welfare_done:           { label: 'Welfare Done',          color: 'bg-blue-200 text-blue-900'     },
  compliance_complete:    { label: 'Compliance Complete',   color: 'bg-blue-300 text-blue-900'     },
  // ─── Stage 7: Visa & Embassy ─────────────────────────────────────
  visa_applied:           { label: 'Visa Applied',          color: 'bg-amber-100 text-amber-700'   },
  visa_stamped:           { label: 'Visa Stamped',          color: 'bg-amber-200 text-amber-900'   },
  visa_rejected:          { label: 'Visa Rejected',         color: 'bg-red-100 text-red-800'       },
  esticker_applied:       { label: 'E-Sticker Applied',     color: 'bg-amber-100 text-amber-700'   },
  esticker_received:      { label: 'E-Sticker Received',    color: 'bg-amber-200 text-amber-900'   },
  // ─── Stage 8: Shram Swukriti ─────────────────────────────────────
  shram_applied:          { label: 'Shram Applied',         color: 'bg-orange-100 text-orange-700' },
  shram_issued:           { label: 'Shram Issued',          color: 'bg-orange-200 text-orange-900' },
  // ─── Stage 9: Departure Prep ──────────────────────────────────────
  flight_booked:          { label: 'Flight Booked',         color: 'bg-sky-100 text-sky-800'       },
  airport_slot_assigned:  { label: 'Airport Slot Assigned', color: 'bg-sky-200 text-sky-900'       },
  // ─── Stage 10: Post-Departure ────────────────────────────────────
  departed:               { label: 'Departed',              color: 'bg-green-100 text-green-800'   },
  abroad:                 { label: 'Abroad',                color: 'bg-green-200 text-green-900'   },
  contract_expired:       { label: 'Contract Expired',      color: 'bg-gray-200 text-gray-700'     },
  returned:               { label: 'Returned',              color: 'bg-gray-100 text-gray-800'     },
  // ─── Special states ──────────────────────────────────────────────
  on_hold:                { label: 'On Hold',               color: 'bg-yellow-100 text-yellow-800' },
  cancelled:              { label: 'Cancelled',             color: 'bg-red-100 text-red-800'       },

  // ─── Passport custody statuses ──────────────────────────────────
  with_agency:           { label: 'With Agency',     color: 'bg-primary-100   text-primary-800'  },
  returned_to_candidate: { label: 'Returned',        color: 'bg-green-100  text-green-800' },
  submitted_embassy:     { label: 'At Embassy',      color: 'bg-amber-100  text-amber-800' },
  lost:                  { label: 'Lost',            color: 'bg-red-100    text-red-800'   },

  // ─── Passport allocation statuses ───────────────────────────────
  in_pool:    { label: 'In Pool',   color: 'bg-teal-100  text-teal-800' },
  allocated:  { label: 'Allocated', color: 'bg-primary-100  text-primary-800' },
  returned:   { label: 'Returned',  color: 'bg-gray-100  text-gray-800' },

  // ─── Task statuses ───────────────────────────────────────────────
  pending:     { label: 'Pending',     color: 'bg-gray-100   text-gray-800'  },
  in_progress: { label: 'In Progress', color: 'bg-primary-100   text-primary-800'  },
  completed:   { label: 'Completed',   color: 'bg-green-100  text-green-800' },
  overdue:     { label: 'Overdue',     color: 'bg-red-100    text-red-800'   },

  // ─── Medical results ─────────────────────────────────────────────
  fit:      { label: 'FIT',     color: 'bg-green-100  text-green-800' },
  unfit:    { label: 'UNFIT',   color: 'bg-red-100    text-red-800'   },
  on_hold_medical: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },

  // ─── Orientation statuses ────────────────────────────────────────
  scheduled: { label: 'Scheduled', color: 'bg-primary-100  text-primary-800'  },
  absent:    { label: 'Absent',    color: 'bg-red-100   text-red-800'   },
  failed:    { label: 'Failed',    color: 'bg-gray-100  text-gray-800'  },

  // ─── Payment statuses ────────────────────────────────────────────
  unpaid:   { label: 'Unpaid',   color: 'bg-red-100    text-red-800'   },
  partial:  { label: 'Partial',  color: 'bg-yellow-100 text-yellow-800' },
  paid:     { label: 'Paid',     color: 'bg-green-100  text-green-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100   text-gray-800'  },

  // ─── Demand statuses ─────────────────────────────────────────────
  active:  { label: 'Active',    color: 'bg-green-100 text-green-800' },
  filled:  { label: 'Filled',    color: 'bg-primary-100  text-primary-800'  },
  expired: { label: 'Expired',   color: 'bg-red-100   text-red-800'   },

  // ─── Generic ─────────────────────────────────────────────────────
  inactive:  { label: 'Inactive',  color: 'bg-gray-100 text-gray-800' },
  partially_done: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800' }
};

const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2    py-0.5 text-xs',
  md: 'px-2.5  py-1   text-sm',
  lg: 'px-3    py-1.5 text-base'
};

/**
 * StatusBadge
 * @param {string}  status  - Any known status key (see STATUS_CONFIG above)
 * @param {'xs'|'sm'|'md'|'lg'} size - Badge size, default 'sm'
 * @param {string}  className - Additional CSS classes
 */
const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status ? status.replace(/_/g, ' ') : '—',
    color: 'bg-gray-100 text-gray-800'
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full whitespace-nowrap
        ${config.color} ${SIZES[size] ?? SIZES.sm} ${className}`}
    >
      {config.label}
    </span>
  );
};

export { STATUS_CONFIG };
export default StatusBadge;
