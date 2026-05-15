import { useState, useRef, useEffect } from 'react';
import SponsorThreeDotMenu from './SponsorThreeDotMenu';

const getAvatarColor = (name) => {
  const colors = [
    'bg-primary-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-primary-500', 'bg-red-500', 'bg-teal-500', 'bg-orange-500'
  ];
  const hash = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  return colors[hash % colors.length];
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const SponsorCard = ({ sponsor, onViewProfile, onEdit, onViewCandidates, onDeactivate, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayDistricts = sponsor.coverageDistricts?.slice(0, 3) || [];
  const moreCount = (sponsor.coverageDistricts?.length || 0) - 3;

  const formatRole = (role) => {
    const roles = {
      agent: 'Agent',
      senior_agent: 'Senior Agent',
      partner: 'Partner',
      coordinator: 'Coordinator',
      manager: 'Manager'
    };
    return roles[role] || role;
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
      <div className="flex items-start gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(sponsor.fullName)}`}>
          {getInitials(sponsor.fullName)}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate text-sm">{sponsor.fullName}</h4>
          {sponsor.primaryArea && (
            <p className="text-xs text-gray-500 truncate">{sponsor.primaryArea}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-full ${
              sponsor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {sponsor.isActive ? 'Active' : 'Inactive'}
            </span>
            {sponsor.role && (
              <span className="inline-block px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                {formatRole(sponsor.role)}
              </span>
            )}
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <SponsorThreeDotMenu
              sponsor={sponsor}
              onViewProfile={() => { setMenuOpen(false); onViewProfile?.(sponsor); }}
              onEdit={() => { setMenuOpen(false); onEdit?.(sponsor); }}
              onViewCandidates={() => { setMenuOpen(false); onViewCandidates?.(sponsor); }}
              onDeactivate={() => { setMenuOpen(false); onDeactivate?.(sponsor); }}
              onDelete={() => { setMenuOpen(false); onDelete?.(sponsor); }}
            />
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-600">
        <a href={`tel:${sponsor.phone}`} className="hover:text-primary-600">
          {sponsor.phone}
        </a>
        {sponsor.permanentDistrict && (
          <p>{sponsor.permanentDistrict}{sponsor.permanentProvince ? `, ${sponsor.permanentProvince.replace(' Province', '')}` : ''}</p>
        )}
      </div>

      {displayDistricts.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">Districts:</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {displayDistricts.map((district, idx) => (
              <span key={idx} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {district}
              </span>
            ))}
            {moreCount > 0 && (
              <span className="text-xs text-gray-500">+{moreCount} more</span>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 flex gap-2 text-xs">
        <div className="bg-gray-50 rounded px-2 py-1">
          <span className="font-semibold">{sponsor.candidatesReferred || 0}</span> sent
        </div>
        <div className="bg-gray-50 rounded px-2 py-1">
          <span className="font-semibold">{sponsor.candidatesDeparted || 0}</span> dept.
        </div>
      </div>

      {sponsor.assignedStaffId && (
        <p className="mt-2 text-xs text-gray-500">
          Assigned to: {sponsor.assignedStaffId.name || 'Staff'}
        </p>
      )}

      {sponsor.introducedBy && (
        <p className="mt-1 text-xs text-gray-500">
          Added by: {sponsor.introducedBy.name || 'Staff'}
        </p>
      )}
    </div>
  );
};

export default SponsorCard;