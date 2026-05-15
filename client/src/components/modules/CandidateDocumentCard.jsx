import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { medicalApi, orientationApi, insuranceSsfApi, candidatesApi } from '../../api';
import { showToast } from '../ToastProvider';

const isImageUrl = (url) => {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
};

const DocumentCard = ({ column, onAdd, onEdit, onQuickComplete, candidateId, onRefresh, extraActions }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuButtonRef = useRef(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingKey, setTogglingKey] = useState('');
  const [resetting, setResetting] = useState(false);
  const [pendingUpdatePrompt, setPendingUpdatePrompt] = useState(null);
  const [displayCheckItems, setDisplayCheckItems] = useState(column.checkItems || []);
  const [displayLastUpdatedAt, setDisplayLastUpdatedAt] = useState(column.lastUpdatedAt || null);
  const [savedIndicatorKey, setSavedIndicatorKey] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(column.note || '');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setDisplayCheckItems(column.checkItems || []);
    setDisplayLastUpdatedAt(column.lastUpdatedAt || null);
    setNoteText(column.note || '');
  }, [column.id, column.checkItems, column.lastUpdatedAt, column.note]);

  useEffect(() => {
    if (!savedIndicatorKey) return;
    if (pendingUpdatePrompt?.itemKey === savedIndicatorKey) return;
    const timer = setTimeout(() => setSavedIndicatorKey(''), 1200);
    return () => clearTimeout(timer);
  }, [savedIndicatorKey, pendingUpdatePrompt]);

  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, left: rect.right - 160 });
    }
    setShowMenu(!showMenu);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (column.id === 'medical' && column.data?._id) {
        await medicalApi.delete(column.data._id);
      } else if (column.id === 'orientation' && column.data?._id) {
        await orientationApi.delete(column.data._id);
      } else if (column.id === 'insurance' && column.data?._id) {
        await insuranceSsfApi.delete(column.data._id);
      }
      setShowDeleteConfirm(false);
      setShowMenu(false);
      onRefresh?.();
    } catch (err) {
      showToast.error('Failed to delete: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleCheckItem = async (item) => {
    if (!item?.key || togglingKey) return;

    const nextDone = !item.done;
    // Optimistic update — immediately reflect in UI
    const nextItems = (displayCheckItems || []).map((it) =>
      it.key === item.key
        ? {
            ...it,
            done: nextDone,
            overridden: nextDone !== (typeof it.autoDone === 'boolean' ? it.autoDone : nextDone)
          }
        : it
    );
    const nextCompletedCount = nextItems.filter((it) => it.done).length;
    const allDoneAfterClick = nextCompletedCount === (column.totalCount || nextItems.length);

    setDisplayCheckItems(nextItems);
    setDisplayLastUpdatedAt(new Date().toISOString());
    setSavedIndicatorKey(item.key);

    try {
      setTogglingKey(item.key);
      await candidatesApi.toggleChecklistItem(candidateId, column.id, item.key, nextDone);
      showToast.success(`${item.label} marked ${nextDone ? 'complete' : 'incomplete'}`);
      if (nextDone && allDoneAfterClick) {
        setPendingUpdatePrompt({ itemKey: item.key, itemLabel: item.label, nextDone });
      }
    } catch (err) {
      // Revert optimistic update on failure
      setDisplayCheckItems(column.checkItems || []);
      setDisplayLastUpdatedAt(column.lastUpdatedAt || null);
      setSavedIndicatorKey('');
      showToast.error('Failed to update: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingKey('');
    }
  };

  const handleResetToAuto = async () => {
    try {
      setResetting(true);
      await candidatesApi.resetChecklistColumn(candidateId, column.id);
      showToast.success(`${column.title} checklist reset to auto`);
      onRefresh?.();
    } catch (err) {
      showToast.error('Failed to reset checklist: ' + (err.response?.data?.message || err.message));
    } finally {
      setResetting(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      setSavingNote(true);
      await candidatesApi.saveStageNote(candidateId, column.id, noteText);
      showToast.success('Note saved');
      setEditingNote(false);
    } catch (err) {
      showToast.error('Failed to save note: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingNote(false);
    }
  };

  const formatLastUpdated = (ts) => {
    if (!ts) return 'No updates yet';
    const dt = new Date(ts);
    if (Number.isNaN(dt.getTime())) return 'No updates yet';
    return dt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusStyles = () => {
    const base = 'rounded-lg border-2 bg-white shadow-sm';
    switch (column.status) {
      case 'pending':    return `${base} border-dashed border-gray-300`;
      case 'in_progress':return `${base} border-l-4 border-amber-500`;
      case 'complete':   return `${base} border-l-4 border-green-500`;
      case 'expiring':   return `${base} border-l-4 border-amber-500 animate-pulse`;
      case 'expired':    return `${base} border-l-4 border-red-500`;
      case 'blocked':    return `${base} border-l-4 border-red-500`;
      default:           return base;
    }
  };

  const getHeaderBg = () => {
    switch (column.status) {
      case 'complete':   return 'bg-green-50';
      case 'in_progress':return 'bg-amber-50';
      case 'expiring':   return 'bg-amber-50';
      case 'blocked':    return 'bg-red-50';
      case 'expired':    return 'bg-red-50';
      default:           return 'bg-gray-50';
    }
  };

  const getStatusBadge = () => {
    switch (column.status) {
      case 'complete':    return <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Done</span>;
      case 'in_progress': return <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">In progress</span>;
      case 'blocked':     return <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Blocked</span>;
      case 'expired':     return <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Expired</span>;
      case 'expiring':    return <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Expiring</span>;
      default:            return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">Pending</span>;
    }
  };

  const getSubtitle = () => {
    if (column.id === 'medical' && column.data?.result) return column.data.result.toUpperCase();
    if (column.id === 'orientation' && column.data?.certificateNumber) return `Certificate: ${column.data.certificateNumber}`;
    if (column.id === 'fee' && column.data?.totalReceived !== undefined)
      return `रू ${column.data.totalReceived.toLocaleString()} / रू ${(column.data.serviceFeeAgreed || 0).toLocaleString()}`;
    if (column.id === 'visa' && column.data?.visaNumber) return column.data.visaNumber;
    if (column.id === 'feims' && column.data?.shramSwikritiNumber) return column.data.shramSwikritiNumber;
    return column.subtitle;
  };

  const completedCount = displayCheckItems.filter((i) => i.done).length;
  const totalCount = column.totalCount || displayCheckItems.length;

  return (
    <div className={`flex-shrink-0 w-64 ${getStatusStyles()}`}>
      {/* Header */}
      <div className={`px-3 py-2.5 rounded-t-lg ${getHeaderBg()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-gray-900 truncate">{column.title}</span>
            {getStatusBadge()}
          </div>
          <button
            ref={menuButtonRef}
            onClick={handleMenuClick}
            className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
          >
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{getSubtitle()}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Updated: {formatLastUpdated(displayLastUpdatedAt)}
        </p>
      </div>

      <div className="p-3 space-y-1.5">
        {/* Checklist circles */}
        {displayCheckItems.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => handleToggleCheckItem(item)}
              disabled={togglingKey === item.key}
              className={`w-5 h-5 flex-shrink-0 rounded-full border-2 text-[10px] flex items-center justify-center transition-all
                ${item.done
                  ? item.overridden
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 bg-white text-gray-300 hover:border-green-400'}
                ${togglingKey === item.key ? 'opacity-60 cursor-not-allowed scale-90' : 'cursor-pointer hover:scale-110 active:scale-95'}
              `}
              title={item.overridden ? 'Manually set (click to toggle)' : 'Click to toggle'}
            >
              {item.done ? '✓' : ''}
            </button>
            <span className={`flex-1 text-xs leading-tight ${
              item.done
                ? item.overridden ? 'text-amber-700' : 'text-green-700 line-through'
                : 'text-gray-600'
            }`}>
              {item.label}
            </span>
            {item.overridden && (
              <span className="text-[9px] text-amber-600 border border-amber-200 rounded px-0.5 flex-shrink-0">M</span>
            )}
            {savedIndicatorKey === item.key && (
              <span className="text-[9px] text-emerald-600 border border-emerald-200 bg-emerald-50 rounded px-0.5 flex-shrink-0 animate-fade-in">
                ✓
              </span>
            )}
          </div>
        ))}

        {/* Progress count */}
        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">{completedCount}/{totalCount} done</span>
          {column.hasOverrides && (
            <button
              type="button"
              onClick={handleResetToAuto}
              disabled={resetting}
              className="text-[10px] text-amber-600 hover:text-amber-700 underline disabled:opacity-50"
            >
              {resetting ? '...' : 'Reset auto'}
            </button>
          )}
        </div>

        {/* Expiry warning */}
        {column.daysUntilExpiry !== null && column.daysUntilExpiry < 30 && column.status === 'complete' && (
          <div className="text-xs text-amber-600 font-medium">
            ⚠ Expires in {column.daysUntilExpiry} days
          </div>
        )}

        {/* Blocked notice */}
        {column.status === 'blocked' && (
          <div className="text-xs text-red-600 font-medium">
            Medical result: UNFIT — schedule recheck
          </div>
        )}

        {/* Image preview for uploaded files */}
        {Array.isArray(column.uploads) && column.uploads.length > 0 && (
          <div className="mt-2 space-y-2 border-t pt-2">
            {column.uploads.map((file, idx) => (
              isImageUrl(file.url) ? (
                <a
                  key={`${file.url}-${idx}`}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  title={`Open ${file.label || 'image'} full-size`}
                >
                  <img
                    src={file.url}
                    alt={file.label || `Document ${idx + 1}`}
                    className="w-full h-28 object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5 text-center">{file.label || `Image ${idx + 1}`}</p>
                </a>
              ) : (
                <a
                  key={`${file.url}-${idx}`}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {file.label || `Document ${idx + 1}`}
                </a>
              )
            ))}
          </div>
        )}

        {/* Action buttons — always show Edit regardless of status */}
        <div className="flex flex-wrap gap-1.5 mt-2 pt-1 border-t border-gray-100">
          <button
            onClick={() => column.status === 'pending' ? onAdd(column.id) : onEdit(column.id)}
            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
              column.status === 'pending'
                ? 'text-primary-600 hover:text-primary-800 hover:bg-primary-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {column.status === 'pending' ? `+ Add` : `Edit / View`}
          </button>
          {column.status === 'in_progress' && (
            <button
              onClick={() => onQuickComplete(column.id)}
              className="text-xs font-medium px-2 py-1 rounded text-green-600 hover:text-green-800 hover:bg-green-50 transition-colors"
            >
              ✓ Mark done
            </button>
          )}
          {column.status === 'blocked' && (
            <button
              onClick={() => onEdit(column.id)}
              className="text-xs font-medium px-2 py-1 rounded text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
            >
              Resolve
            </button>
          )}
          {Array.isArray(extraActions) && extraActions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="text-xs font-medium px-2 py-1 rounded text-primary-600 hover:text-primary-800 hover:bg-primary-50 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Stage note */}
        <div className="mt-2">
          {editingNote ? (
            <div className="space-y-1">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                placeholder="Add a note for this stage..."
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:outline-none focus:border-primary-400"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="text-xs px-2 py-0.5 bg-primary-600 text-white rounded disabled:opacity-50"
                >
                  {savingNote ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingNote(false); setNoteText(column.note || ''); }}
                  className="text-xs px-2 py-0.5 border border-gray-300 rounded text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : noteText ? (
            <div
              onClick={() => setEditingNote(true)}
              className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 cursor-pointer hover:bg-yellow-100"
              title="Click to edit note"
            >
              📝 {noteText}
            </div>
          ) : (
            <button
              onClick={() => setEditingNote(true)}
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              + Add note
            </button>
          )}
        </div>
      </div>

      {/* Three-dot menu portal */}
      {showMenu && createPortal(
        <div
          className="fixed bg-white rounded-lg shadow-xl border z-50 py-1 min-w-[160px]"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setShowMenu(false); onEdit(column.id); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Edit / Update
          </button>
          <button
            onClick={() => { setShowMenu(false); setEditingNote(true); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            {noteText ? 'Edit note' : 'Add note'}
          </button>
          {column.hasOverrides && (
            <button
              onClick={() => { setShowMenu(false); handleResetToAuto(); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-amber-700"
            >
              Reset to auto
            </button>
          )}
          {column.canDelete && column.data?._id && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Delete record
              </button>
            </>
          )}
          {column.status === 'blocked' && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={() => { setShowMenu(false); onEdit(column.id); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                Schedule recheck
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this {column.title} record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* All-done prompt */}
      {pendingUpdatePrompt && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Update {column.title}?</h3>
            <p className="text-gray-600 mb-4">
              All checklist items are complete. Do you want to open <strong>{column.title}</strong> and update details now?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setPendingUpdatePrompt(null); onRefresh?.(); }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Later
              </button>
              <button
                onClick={() => { setPendingUpdatePrompt(null); onRefresh?.(); onEdit(column.id); }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DocumentCard;
