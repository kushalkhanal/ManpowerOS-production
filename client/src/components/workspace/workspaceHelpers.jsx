import { ChevronDown, ChevronRight, FileText, ExternalLink } from "lucide-react";
import SecureLink from "../SecureLink";

export const fmtDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
};

export const InfoRow = ({ label, value }) => (
  <div className="flex items-baseline justify-between py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-[11px] uppercase tracking-wide text-gray-400 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-800 font-medium text-right ml-4">
      {value || "—"}
    </span>
  </div>
);

export const FileLink = ({ url, label }) =>
  url ? (
    <SecureLink
      storedUrl={url}
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
    >
      <FileText size={11} /> {label} <ExternalLink size={9} />
    </SecureLink>
  ) : null;

export const EditBtn = ({ onClick, children = "Edit" }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
  >
    {children}
  </button>
);

export const CollapsibleSection = ({
  title,
  badge,
  badgeColor,
  expanded,
  onToggle,
  children,
}) => (
  <div className="mt-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {badge != null && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeColor || "bg-gray-100 text-gray-500"}`}
          >
            {badge}
          </span>
        )}
      </div>
      {expanded ? (
        <ChevronDown size={14} className="text-gray-400" />
      ) : (
        <ChevronRight size={14} className="text-gray-400" />
      )}
    </button>
    {expanded && (
      <div className="px-4 pb-4 border-t border-gray-50">{children}</div>
    )}
  </div>
);
