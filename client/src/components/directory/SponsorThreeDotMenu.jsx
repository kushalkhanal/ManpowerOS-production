import { useAuth } from '../../context/AuthContext';

const SponsorThreeDotMenu = ({ sponsor, onViewProfile, onEdit, onViewCandidates, onDeactivate, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isManager = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="absolute right-0 top-8 z-[100] w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1">
      <button
        onClick={onViewProfile}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        View full profile
      </button>
      <button
        onClick={onViewCandidates}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        View candidates
      </button>

      {isManager && (
        <button
          onClick={onEdit}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Edit sponsor
        </button>
      )}

      {isManager && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={onDeactivate}
            className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 transition-colors"
          >
            {sponsor.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </>
      )}

      {isAdmin && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
};

export default SponsorThreeDotMenu;