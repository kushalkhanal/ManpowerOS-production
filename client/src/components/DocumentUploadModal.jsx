import { useState, useEffect, useRef } from 'react';
import { useAgencyDocuments } from '../hooks/useAgencyDocuments';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_COLORS } from '../utils/constants';
import { Upload, X, FileText, Image, FileSpreadsheet } from 'lucide-react';

const DocumentUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { createDocument } = useAgencyDocuments();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    file: null,
    visibleToRoles: [],
    isConfidential: false,
    version: '',
    expiryDate: '',
    expiryAlertDays: 60,
    tags: ''
  });

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setFormData({
        title: '',
        description: '',
        category: '',
        file: null,
        visibleToRoles: [],
        isConfidential: false,
        version: '',
        expiryDate: '',
        expiryAlertDays: 60,
        tags: ''
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'isConfidential') {
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else {
        setFormData(prev => ({
          ...prev,
          visibleToRoles: checked
            ? [...prev.visibleToRoles, value]
            : prev.visibleToRoles.filter(r => r !== value)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file, title: prev.title || file.name.replace(/\.[^/.]+$/, '') }));
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file, title: prev.title || file.name.replace(/\.[^/.]+$/, '') }));
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.file) newErrors.file = 'File is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('file', formData.file);
      data.append('visibleToRoles', JSON.stringify(formData.visibleToRoles));
      data.append('isConfidential', formData.isConfidential);
      if (formData.version) data.append('version', formData.version);
      if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
      if (formData.expiryAlertDays) data.append('expiryAlertDays', formData.expiryAlertDays);
      if (formData.tags) data.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(Boolean)));

      const doc = await createDocument(data);
      onSuccess?.(doc);
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to upload document' });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!formData.file) return <FileText className="w-12 h-12 text-gray-400" />;
    const ext = formData.file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image className="w-12 h-12 text-purple-500" />;
    if (['xls', 'xlsx'].includes(ext)) return <FileSpreadsheet className="w-12 h-12 text-green-500" />;
    return <FileText className="w-12 h-12 text-primary-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
            />
            {formData.file ? (
              <div className="flex flex-col items-center">
                {getFileIcon()}
                <p className="mt-2 font-medium text-gray-900">{formData.file.name}</p>
                <p className="text-sm text-gray-500">{(formData.file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400" />
                <p className="mt-2 text-gray-600">Drag & drop file here or click to browse</p>
                <p className="text-sm text-gray-400">PDF, DOCX, XLSX, Images (max 10MB)</p>
              </div>
            )}
          </div>
          {errors.file && <p className="text-red-500 text-xs">{errors.file}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Document title"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select category</option>
                {DOCUMENT_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="v1.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Brief description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alert Days</label>
              <input
                type="number"
                name="expiryAlertDays"
                value={formData.expiryAlertDays}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="dofe, renewal, 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visible To Roles</label>
            <div className="flex flex-wrap gap-2">
              {['admin', 'manager', 'staff', 'documentation', 'agent'].map(role => (
                <label key={role} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    name="visibleToRoles"
                    value={role}
                    checked={formData.visibleToRoles.includes(role)}
                    onChange={handleChange}
                    className="rounded border-gray-300"
                  />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
              <span className="text-xs text-gray-500 ml-2">(empty = all staff)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isConfidential"
              checked={formData.isConfidential}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <label className="text-sm text-gray-700">Confidential (admin only)</label>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errors.submit}</div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;