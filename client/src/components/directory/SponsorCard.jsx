import { useState, useRef, useEffect } from 'react';
import { Phone, MapPin, MoreVertical } from 'lucide-react';
import SponsorThreeDotMenu from './SponsorThreeDotMenu';

const AGENT_STATUS_STYLE = {
  active:      'bg-emerald-100 text-emerald-700',
  passive:     'bg-amber-100 text-amber-700',
  blacklisted: 'bg-red-100 text-red-700',
};

const getAvatarColor = (name) => {
  const colors = ['bg-primary', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'];
  const hash = name?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
  return colors[hash % colors.length];
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const formatLastReferral = (date) => {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const SponsorCard = ({ sponsor, onViewProfile, onEdit, onViewCandidates, onDeactivate, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const agentStatusStyle = AGENT_STATUS_STYLE[sponsor.agentStatus] || AGENT_STATUS_STYLE.active;
  const agentStatusLabel = sponsor.agentStatus
    ? sponsor.agentStatus.charAt(0).toUpperCase() + sponsor.agentStatus.slice(1)
    : 'Active';
  const lastRef = formatLastReferral(sponsor.lastReferralDate);
  const location = sponsor.permanentDistrict || sponsor.primaryArea;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewProfile?.(sponsor)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${getAvatarColor(sponsor.fullName)}`}>
          {getInitials(sponsor.fullName)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 text-sm truncate">{sponsor.fullName}</h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${agentStatusStyle}`}>
              {agentStatusLabel}
            </span>
            {sponsor.role && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">
                {sponsor.role.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            {sponsor.phone && (
              <a
                href={`tel:${sponsor.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Phone size={10} /> {sponsor.phone}
              </a>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin size={10} /> {location}
              </span>
            )}
          </div>

          {lastRef && (
            <p className="mt-1 text-[10px] text-gray-400">Last referral: {lastRef}</p>
          )}

          {sponsor.introducedBy && (
            <p className="mt-0.5 text-[10px] text-gray-400">
              Added by: {sponsor.introducedBy.name || 'Staff'}
            </p>
          )}
        </div>

        {/* Three-dot menu */}
        <div
          className="relative shrink-0"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreVertical size={16} />
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
    </div>
  );
};

export default SponsorCard;
