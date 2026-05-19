import { useAuth } from '../../context/AuthContext';

const SponsorThreeDotMenu = ({ sponsor, onViewProfile, onEdit, onViewCandidates, onDeactivate, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isManager = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-md shadow-lg border py-1">
      <button
        onClick={onViewProfile}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
      >
        View full profile
      </button>
      <button
        onClick={onEdit}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
      >
        Edit sponsor
      </button>
      <button
        onClick={onViewCandidates}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
      >
        View candidates
      </button>
      
      {(isManager || isAdmin) && sponsor.isActive && (
        <>
          <div className="border-t my-1" />
          <button
            onClick={onDeactivate}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Deactivate
          </button>
        </>
      )}
      
      {(isManager || isAdmin) && !sponsor.isActive && (
        <>
          <div className="border-t my-1" />
          <button
            onClick={onDeactivate}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Reactivate
          </button>
        </>
      )}

      {isAdmin && (
        <>
          <div className="border-t my-1" />
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
};

export default SponsorThreeDotMenu;