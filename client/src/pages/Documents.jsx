import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAgencyDocuments } from '../hooks/useAgencyDocuments';
import DocumentUploadModal from '../components/DocumentUploadModal';
import DocumentCard from '../components/DocumentCard';
import { ConfirmDialog } from '../components/ui';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_COLORS } from '../utils/constants';
import { 
  Search, Upload, Grid, List, FolderOpen, 
  FileText, FileSpreadsheet, Image, FileSignature 
} from 'lucide-react';

const Documents = () => {
  const { user } = useAuth();
  const { documents, categoryCounts, getDocuments, deleteDocument, downloadDocument, loading } = useAgencyDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [editDoc, setEditDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    getDocuments();
  }, []);

  useEffect(() => {
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;
    getDocuments(params);
  }, [selectedCategory, searchQuery]);

  const handleDownload = async (doc) => {
    try {
      await downloadDocument(doc._id, doc.fileName);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete._id);
      getDocuments();
      setDocToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      license: <FileSignature className="w-5 h-5" />,
      contract: <FileSignature className="w-5 h-5" />,
      template: <FileText className="w-5 h-5" />,
      legal: <FileText className="w-5 h-5" />,
      financial: <FileSpreadsheet className="w-5 h-5" />,
      training: <FileText className="w-5 h-5" />,
      marketing: <Image className="w-5 h-5" />,
      correspondence: <FileText className="w-5 h-5" />,
      other: <FileText className="w-5 h-5" />
    };
    return icons[category] || <FileText className="w-5 h-5" />;
  };

  const totalDocs = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      <aside className="w-full lg:w-64 bg-white border-r flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Categories</h2>
        </div>
        <nav className="p-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
              !selectedCategory ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              <span className="font-medium">All Documents</span>
            </div>
            <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full">{totalDocs}</span>
          </button>

          {DOCUMENT_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                selectedCategory === cat.value ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={selectedCategory === cat.value ? 'text-primary-600' : 'text-gray-400'}>
                  {getCategoryIcon(cat.value)}
                </span>
                <span>{cat.label}</span>
              </div>
              <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full">
                {categoryCounts[cat.value] || 0}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500 text-sm mt-1">
              {selectedCategory 
                ? DOCUMENT_CATEGORIES.find(c => c.value === selectedCategory)?.label 
                : 'All agency documents'}
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Upload className="w-5 h-5" />
            Upload
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents found</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Upload your first document
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map(doc => (
              <DocumentCard
                key={doc._id}
                document={doc}
                viewMode="grid"
                onEdit={setEditDoc}
                onDelete={setDocToDelete}
                onDownload={handleDownload}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <DocumentCard
                key={doc._id}
                document={doc}
                viewMode="list"
                onEdit={setEditDoc}
                onDelete={setDocToDelete}
                onDownload={handleDownload}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>

      <DocumentUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          getDocuments();
          setShowUpload(false);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(docToDelete)}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.title || 'this document'}"? This action cannot be undone.`}
        confirmLabel="Delete Document"
        confirmVariant="danger"
        onCancel={() => setDocToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Documents;