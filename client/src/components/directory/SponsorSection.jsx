import { useState, useEffect, useCallback } from 'react';
import { useSponsors } from '../../hooks/useSponsors';
import { debounce } from '../../utils/debounce';
import { showToast } from '../ToastProvider';
import SponsorCard from './SponsorCard';
import SponsorFormModal from './SponsorFormModal';
import SponsorProfileDrawer from './SponsorProfileDrawer';
import { ConfirmDialog } from '../ui';

const SponsorSection = () => {
  const { sponsors, loading, getSponsors, toggleSponsorActive, deleteSponsor } = useSponsors();
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [selectedSponsorId, setSelectedSponsorId] = useState(null);
  const [sponsorToggleTarget, setSponsorToggleTarget] = useState(null);
  const [sponsorDeleteTarget, setSponsorDeleteTarget] = useState(null);

  useEffect(() => {
    getSponsors();
  }, []);

  useEffect(() => {
    const districts = new Set();
    sponsors.forEach(s => {
      s.coverageDistricts?.forEach(d => districts.add(d));
    });
    setAvailableDistricts(Array.from(districts).sort());
  }, [sponsors]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      getSponsors({ search: value || undefined, district: districtFilter || undefined });
    }, 400),
    [getSponsors, districtFilter]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    setDistrictFilter(value);
    getSponsors({ search: search || undefined, district: value || undefined });
  };

  const handleViewProfile = (sponsor) => {
    setSelectedSponsorId(sponsor._id);
    setShowProfileDrawer(true);
  };

  const handleEdit = (sponsor) => {
    setEditingSponsor(sponsor);
    setShowFormModal(true);
  };

  const handleViewCandidates = (sponsor) => {
    setSelectedSponsorId(sponsor._id);
    setShowProfileDrawer(true);
  };

  const handleDeactivate = async () => {
    if (!sponsorToggleTarget) return;
    try {
      await toggleSponsorActive(sponsorToggleTarget._id, !sponsorToggleTarget.isActive);
      getSponsors();
      setSponsorToggleTarget(null);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!sponsorDeleteTarget) return;
    try {
      await deleteSponsor(sponsorDeleteTarget._id);
      setSponsorDeleteTarget(null);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete sponsor');
    }
  };

  const handleFormSuccess = () => {
    getSponsors();
    setEditingSponsor(null);
  };

  const activeSponsorsCount = sponsors.filter(s => s.isActive).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Sponsors ({activeSponsorsCount})
        </h2>
        <button
          onClick={() => { setEditingSponsor(null); setShowFormModal(true); }}
          className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
        >
          + Add Sponsor
        </button>
      </div>

      <div className="mb-3 space-y-2">
        <input
          type="text"
          placeholder="Search by name, phone, area..."
          value={search}
          onChange={handleSearchChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
        <select
          value={districtFilter}
          onChange={handleDistrictChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Districts</option>
          {availableDistricts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-8">
            {search ? (
              <>
                <p className="text-gray-500">No sponsors match "{search}"</p>
                <button
                  onClick={() => { setSearch(''); getSponsors(); }}
                  className="text-primary-600 hover:underline text-sm mt-2"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500">No sponsors added yet</p>
                <button
                  onClick={() => setShowFormModal(true)}
                  className="text-primary-600 hover:underline text-sm mt-2"
                >
                  Add your first sponsor
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {sponsors.map(sponsor => (
              <SponsorCard
                key={sponsor._id}
                sponsor={sponsor}
                onViewProfile={handleViewProfile}
                onEdit={handleEdit}
                onViewCandidates={handleViewCandidates}
                onDeactivate={setSponsorToggleTarget}
                onDelete={setSponsorDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <SponsorFormModal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingSponsor(null); }}
        onSuccess={handleFormSuccess}
        sponsor={editingSponsor}
      />

      <SponsorProfileDrawer
        sponsorId={selectedSponsorId}
        isOpen={showProfileDrawer}
        onClose={() => { setShowProfileDrawer(false); setSelectedSponsorId(null); }}
        onEdit={(sponsor) => { setShowProfileDrawer(false); handleEdit(sponsor); }}
        onStatusChange={() => getSponsors()}
      />

      <ConfirmDialog
        isOpen={Boolean(sponsorToggleTarget)}
        title={sponsorToggleTarget?.isActive ? 'Deactivate Sponsor' : 'Reactivate Sponsor'}
        message={sponsorToggleTarget?.isActive ? 'Are you sure you want to deactivate this sponsor?' : 'Are you sure you want to reactivate this sponsor?'}
        confirmLabel={sponsorToggleTarget?.isActive ? 'Deactivate' : 'Reactivate'}
        confirmVariant="warning"
        onCancel={() => setSponsorToggleTarget(null)}
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        isOpen={Boolean(sponsorDeleteTarget)}
        title="Delete Sponsor"
        message="Are you sure you want to delete this sponsor? This action cannot be undone."
        confirmLabel="Delete Sponsor"
        confirmVariant="danger"
        onCancel={() => setSponsorDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default SponsorSection;