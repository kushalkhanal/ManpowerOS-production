import { useState } from 'react';
import { DOCUMENT_CATEGORY_COLORS } from '../utils/constants';
import { 
  FileText, FileSpreadsheet, Image, Download, Edit, Trash2, 
  Lock, Calendar, Eye, FileSignature 
} from 'lucide-react';

const DocumentCard = ({ document, viewMode = 'grid', onEdit, onDelete, onDownload, isAdmin }) => {
  const [imageError, setImageError] = useState(false);

  const getFileIcon = () => {
    const ext = document.fileType?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      if (imageError) return <FileText className="w-8 h-8 text-gray-400" />;
      return (
        <img 
          src={`/api/agency-docs/${document._id}/download`}
          alt={document.title}
          className="w-full h-32 object-cover rounded"
          onError={() => setImageError(true)}
        />
      );
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    }
    return <FileText className="w-8 h-8 text-primary-600" />;
  };

  const getExpiryStatus = () => {
    if (!document.expiryDate) return null;
    const days = document.daysUntilExpiry;
    if (days < 0) return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    if (days <= 30) return { label: `${days} days`, color: 'bg-red-100 text-red-800' };
    if (days <= 60) return { label: `${days} days`, color: 'bg-amber-100 text-amber-800' };
    return { label: `${days} days`, color: 'bg-green-100 text-green-800' };
  };

  const expiryStatus = getExpiryStatus();
  const isTemplate = document.category === 'template';

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 truncate">{document.title}</h4>
            {document.isConfidential && <Lock className="w-4 h-4 text-red-500" />}
            {isTemplate && <span className="text-xs bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">Template</span>}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs ${DOCUMENT_CATEGORY_COLORS[document.category]}`}>
              {document.category}
            </span>
            <span>{document.uploadedBy?.name}</span>
            <span>{new Date(document.createdAt).toLocaleDateString()}</span>
            {expiryStatus && (
              <span className={`px-2 py-0.5 rounded text-xs ${expiryStatus.color}`}>
                <Calendar className="w-3 h-3 inline mr-1" />
                {expiryStatus.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload(document)}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(document)}
                className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(document)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg hover:shadow-md transition-shadow overflow-hidden">
      <div className="aspect-video bg-gray-50 flex items-center justify-center relative">
        {getFileIcon()}
        {document.isConfidential && (
          <div className="absolute top-2 right-2">
            <Lock className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{document.title}</h4>
        </div>
        
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs ${DOCUMENT_CATEGORY_COLORS[document.category]}`}>
            {document.category}
          </span>
          {isTemplate && (
            <span className="text-xs bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">Template</span>
          )}
          {document.version && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{document.version}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{document.uploadedBy?.name}</span>
          {expiryStatus && (
            <span className={`px-1.5 py-0.5 rounded ${expiryStatus.color}`}>
              {expiryStatus.label}
            </span>
          )}
        </div>

        {isTemplate && (
          <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
            <span className="text-gray-500">{document.downloadCount} downloads</span>
          </div>
        )}

        <div className="flex items-center gap-1 mt-2 pt-2 border-t">
          <button
            onClick={() => onDownload(document)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded"
          >
            <Download className="w-4 h-4" />
            {isTemplate ? 'Use' : 'Download'}
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(document)}
                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(document)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;