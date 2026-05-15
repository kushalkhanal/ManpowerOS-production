import { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import ContractModal from './ContractModal';
import {
  FileText, Plus, Pencil, ExternalLink, Calendar, Coins, Briefcase, AlertCircle
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  draft:      'bg-gray-100 text-gray-700',
  signed:     'bg-blue-100 text-blue-700',
  active:     'bg-emerald-100 text-emerald-700',
  expired:    'bg-amber-100 text-amber-700',
  terminated: 'bg-red-100 text-red-700',
  renewed:    'bg-purple-100 text-purple-700',
};

const STATUS_LABEL = {
  draft: 'Draft', signed: 'Signed', active: 'Active',
  expired: 'Expired', terminated: 'Terminated', renewed: 'Renewed',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : null;

const fmtSalary = (amount, currency) => {
  if (amount == null || amount === '') return null;
  const n = Number(amount);
  if (Number.isNaN(n)) return null;
  return `${n.toLocaleString()} ${currency || ''}`.trim();
};

const daysUntil = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;

// ─── Card ─────────────────────────────────────────────────────────────────────

function ContractCard({ contract, onEdit }) {
  const expDays    = daysUntil(contract.contractExpiryDate);
  const isExpiring = contract.status === 'active' && expDays !== null && expDays > 0 && expDays <= 60;
  const isExpired  = expDays !== null && expDays <= 0 && contract.status === 'active';

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-white hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">
              {contract.contractType === 'dofe_approved' ? 'DoFE-approved contract' : 'Standard contract'}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_COLOR[contract.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[contract.status] || contract.status}
            </span>
            {contract.contractLanguage && (
              <span className="text-[10px] text-gray-400 uppercase">{contract.contractLanguage}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
            {fmtSalary(contract.salary, contract.salaryCurrency) && (
              <span className="inline-flex items-center gap-1">
                <Coins size={11} /> {fmtSalary(contract.salary, contract.salaryCurrency)}/mo
              </span>
            )}
            {contract.contractDurationMonths && (
              <span className="inline-flex items-center gap-1">
                <Briefcase size={11} /> {contract.contractDurationMonths} months
              </span>
            )}
            {contract.contractStartDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} /> Start {fmtDate(contract.contractStartDate)}
              </span>
            )}
            {contract.contractExpiryDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} /> Expires {fmtDate(contract.contractExpiryDate)}
              </span>
            )}
          </div>

          {(contract.workingHoursPerDay || contract.workingDaysPerWeek || contract.accommodation || contract.food) && (
            <p className="mt-1 text-[11px] text-gray-400">
              {contract.workingHoursPerDay && <>{contract.workingHoursPerDay}h/day · </>}
              {contract.workingDaysPerWeek && <>{contract.workingDaysPerWeek}d/week · </>}
              {contract.accommodation && <>{contract.accommodation} acc. · </>}
              {contract.food && <>{contract.food} food</>}
            </p>
          )}

          {contract.dofeApprovalNumber && (
            <p className="mt-1 text-[11px] text-emerald-600">DoFE # {contract.dofeApprovalNumber}</p>
          )}

          {contract.terminationReason && (
            <p className="mt-1 text-[11px] text-red-600">Terminated: {contract.terminationReason}</p>
          )}

          {(isExpiring || isExpired) && (
            <p className={`mt-2 text-[11px] font-semibold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
              {isExpired ? `Contract expired ${-expDays}d ago` : `Expires in ${expDays}d`}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(contract)}
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors"
            title="Edit contract"
          >
            <Pencil size={13} />
          </button>
          {contract.contractFileUrl && (
            <a
              href={contract.contractFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors"
              title="View contract file"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

const ContractsPanel = ({ candidateId }) => {
  const { contracts, loading, error, getByCandidate } = useContract();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  useEffect(() => {
    if (candidateId) getByCandidate(candidateId);
  }, [candidateId, getByCandidate]);

  const handleEdit = (c) => {
    setEditingContract(c);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingContract(null);
    setModalOpen(true);
  };

  const handleSuccess = () => getByCandidate(candidateId);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {contracts.length} contract{contracts.length === 1 ? '' : 's'} on file
        </p>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Plus size={12} /> Add contract
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} /> {error}
        </div>
      ) : loading && contracts.length === 0 ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <FileText size={20} className="text-gray-300" />
          <p className="text-xs text-gray-400">No contracts recorded yet.</p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus size={11} /> Add first contract
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map(c => (
            <ContractCard key={c._id} contract={c} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {modalOpen && (
        <ContractModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingContract(null); }}
          record={editingContract}
          candidateId={candidateId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default ContractsPanel;
