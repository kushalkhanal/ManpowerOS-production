import { useState, useEffect } from "react";
import { X, Search, UserCheck } from "lucide-react";
import { candidatesApi } from "../api";
import { showToast } from "./ToastProvider";

const AgentModal = ({ isOpen, onClose, candidateId, currentAgentId, onSuccess }) => {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(currentAgentId || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(currentAgentId || null);
    setSearch("");
    candidatesApi.getAgents().then((r) => setAgents(r.data)).catch(() => {});
  }, [isOpen, currentAgentId]);

  const filtered = agents.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search) ||
    a.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await candidatesApi.update(candidateId, { agentId: selected || null });
      showToast.success("Agent updated");
      onSuccess?.();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Assign Agent</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search by name, phone, area…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
        </div>

        {/* None option */}
        <div className="px-4 pb-1">
          <button
            onClick={() => setSelected(null)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
              selected === null ? "bg-blue-50 border border-blue-200 text-blue-800 font-medium" : "hover:bg-gray-50 text-gray-500"
            }`}
          >
            No agent assigned
          </button>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">No agents found</p>
          )}
          {filtered.map((agent) => (
            <button
              key={agent._id}
              onClick={() => setSelected(agent._id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                selected === agent._id
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                selected === agent._id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {agent.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${selected === agent._id ? "text-blue-800" : "text-gray-800"}`}>
                  {agent.name}
                </p>
                {(agent.phone || agent.address) && (
                  <p className="text-xs text-gray-400 truncate">
                    {[agent.phone, agent.address].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              {selected === agent._id && <UserCheck size={14} className="text-blue-600 flex-shrink-0" />}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentModal;
