'use client';

import { X, Edit2, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NewsListItem } from '../../lib/types/newsViews';
import { BulletDisplay, BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import GlassButton from '@/app/lib/ui/GlassButton';
import { NewsType } from '../../lib/types/news';
import { useSession } from 'next-auth/react';

interface NewsDetailModalProps {
  news: NewsListItem | null;
  onClose: () => void;
  onEdit?: (news: NewsListItem) => void;
  onDelete?: (newsId: number) => void;
  newsTypes?: NewsType[];
}

export function NewsDetailModal({ news, onClose, onEdit, onDelete, newsTypes = [] }: NewsDetailModalProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    ticker: '',
    company_name: '',
    news_type_id: 1,
    news_description: '',
    news_date: '',
    alert_notes: '',
    news_source: '',
    news_url: '',
    tags: ''
  });

  // Reset state when modal opens/closes or news changes
  useEffect(() => {
    setIsEditing(false);
    setEditError(null);
  }, [news?.news_id]);

  // Fetch news types if not provided
  useEffect(() => {
    if (newsTypes.length === 0 && isEditing) {
      // Fetch news types from API
      fetch('/api/news-types')
        .then(res => res.json())
        .then(data => {
          // Handle if needed, but ideally newsTypes should be passed as prop
        })
        .catch(err => console.error('Failed to fetch news types:', err));
    }
  }, [isEditing, newsTypes.length]);

  if (!news) return null;

  const getNewsTypeIcon = (typeCode: string) => {
    const icons: Record<string, string> = {
      'EARNINGS': '💰',
      'MARKET': '📈',
      'REGULATORY': '⚖️',
      'PRODUCT': '🚀'
    };
    return icons[typeCode] || '📰';
  };

  const handleEditClick = async () => {
    // Fetch full news record to get all fields including alert_date
    try {
      const response = await fetch(`/api/news?newsId=${news.news_id}`);
      const result = await response.json();
      
      if (result.data) {
        const fullNews = result.data;
        setEditFormData({
          ticker: fullNews.ticker,
          company_name: fullNews.company_name || '',
          news_type_id: fullNews.news_type_id,
          news_description: fullNews.news_description,
          news_date: fullNews.news_date,
          alert_notes: fullNews.alert_notes || '',
          news_source: fullNews.news_source || '',
          news_url: fullNews.news_url || '',
          tags: fullNews.tags 
            ? (Array.isArray(fullNews.tags) ? fullNews.tags.join(', ') : fullNews.tags)
            : ''
        });
        setShowAlert(!!fullNews.alert_date);
        setIsEditing(true);
        setEditError(null);
      }
    } catch (err) {
      console.error('Failed to fetch full news record:', err);
      setEditError('Failed to load news details for editing');
    }
  };

  const handleSaveEdit = async () => {
    // Validation
    if (!editFormData.ticker || !editFormData.news_description) {
      setEditError('Ticker and Description are required');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const tagsArray = editFormData.tags 
        ? editFormData.tags.split(',').map(t => t.trim()).filter(t => t) 
        : [];

      const response = await fetch('/api/news', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsId: news.news_id,
          newsData: {
            ticker: editFormData.ticker.toUpperCase(),
            company_name: editFormData.company_name || undefined,
            news_type_id: editFormData.news_type_id,
            news_description: editFormData.news_description,
            news_date: editFormData.news_date,
            alert_date: showAlert ? editFormData.news_date : undefined,
            alert_notes: showAlert && editFormData.alert_notes ? editFormData.alert_notes : undefined,
            news_source: editFormData.news_source || undefined,
            news_url: editFormData.news_url || undefined,
            tags: tagsArray.length > 0 ? tagsArray : undefined
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update news');
      }

      const result = await response.json();

      // Call parent's onEdit callback if provided
      if (onEdit) {
        onEdit(result.data);
      }

      onClose();
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 scrollbar-hide">
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 flex items-start justify-between rounded-t-3xl">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getNewsTypeIcon(news.news_type.type_code)}</span>
              <h2 className="text-2xl font-bold text-white">{news.ticker}</h2>
              {news.company_name && (
                <span className="text-blue-200">• {news.company_name}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm">
                {news.news_type.type_name}
              </span>
              <span className="text-blue-300 text-sm">
                {new Date(news.news_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing && onEdit && (
              <GlassButton
                icon={Edit2}
                onClick={handleEditClick}
                tooltip="Edit News"
                variant="primary"
                size="md"
              />
            )}
            {isEditing && (
              <GlassButton
                icon={Save}
                onClick={handleSaveEdit}
                disabled={isSaving}
                tooltip={isSaving ? 'Saving...' : 'Save Changes'}
                variant="primary"
                size="md"
              />
            )}
            {!isEditing && onDelete && (
              <GlassButton
                icon={Trash2}
                onClick={() => setShowDeleteConfirm(true)}
                tooltip="Delete News"
                variant="secondary"
                size="md"
              />
            )}
            <GlassButton
              icon={X}
              onClick={isEditing ? handleCancelEdit : onClose}
              disabled={isSaving}
              tooltip={isEditing ? 'Cancel' : 'Close'}
              variant="secondary"
              size="md"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {editError && (
            <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
              {editError}
            </div>
          )}

          {!isEditing ? (
            // View Mode
            <>
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-blue-200 mb-2">Description</h3>
                <BulletDisplay text={news.news_description} />
              </div>

              {/* Source & URL */}
              {(news.news_source || news.news_url) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {news.news_source && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-200 mb-2">Source</h3>
                      <p className="text-white">{news.news_source}</p>
                    </div>
                  )}
                  {news.news_url && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-200 mb-2">URL</h3>
                      <a href={news.news_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline break-all"
                      >
                        {news.news_url}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {news.tags && (() => {
                const tagsArray = Array.isArray(news.tags) 
                  ? news.tags 
                  : (news.tags as string).split(',');
                
                return (
                  <div>
                    <h3 className="text-sm font-semibold text-blue-200 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tagsArray.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Alert */}
              {news.alert_date && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-xl">
                  <h3 className="text-sm font-semibold text-emerald-200 mb-2">Alert Set</h3>
                  <div className="space-y-1">
                    <p className="text-white">
                      <span className="text-emerald-300">Date:</span>{' '}
                      {new Date(news.alert_date).toLocaleDateString()}
                    </p>
                    {news.alert_notes && (
                      <div>
                        <h4 className="text-emerald-300 font-semibold mb-2">Notes:</h4>
                        <BulletDisplay text={news.alert_notes} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ticker */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker *</label>
                  <input
                    type="text"
                    value={editFormData.ticker}
                    onChange={(e) => setEditFormData({ ...editFormData, ticker: e.target.value.toUpperCase() })}
                    className="w-full funding-input rounded-xl px-4 py-3 uppercase"
                    disabled={isSaving}
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Company Name</label>
                  <input
                    type="text"
                    value={editFormData.company_name}
                    onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* News Type */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Type of News *</label>
                  <select
                    value={editFormData.news_type_id}
                    onChange={(e) => setEditFormData({ ...editFormData, news_type_id: parseInt(e.target.value) })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  >
                    {newsTypes.map(type => (
                      <option key={type.news_type_id} value={type.news_type_id} className="bg-slate-800 text-white">
                        {getNewsTypeIcon(type.type_code)} {type.type_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* News Date */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">News Published On *</label>
                  <input
                    type="date"
                    value={editFormData.news_date}
                    onChange={(e) => setEditFormData({ ...editFormData, news_date: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* News Source */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Source</label>
                  <input
                    type="text"
                    value={editFormData.news_source}
                    onChange={(e) => setEditFormData({ ...editFormData, news_source: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* News URL */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">URL</label>
                  <input
                    type="url"
                    value={editFormData.news_url}
                    onChange={(e) => setEditFormData({ ...editFormData, news_url: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <BulletTextarea
                  value={editFormData.news_description}
                  onChange={(value) => setEditFormData({ ...editFormData, news_description: value })}
                  placeholder="Enter news details (each line becomes a bullet point)..."
                  rows={4}
                  label="Description of the News"
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editFormData.tags}
                  onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                  placeholder="quarterly, revenue, guidance"
                />
              </div>

              {/* Alert Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showAlert}
                      onChange={(e) => setShowAlert(e.target.checked)}
                      className="sr-only peer"
                      disabled={isSaving}
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </div>
                  <span className="text-blue-200 font-medium">Set Alert for this news</span>
                </label>
              </div>

              {/* Alert Notes */}
              {showAlert && (
                <div>
                  <BulletTextarea
                    value={editFormData.alert_notes}
                    onChange={(value) => setEditFormData({ ...editFormData, alert_notes: value })}
                    placeholder="Reminder notes (each line becomes a bullet point)..."
                    rows={3}
                    label="Alert Notes"
                    className="border-emerald-400/30"
                    disabled={isSaving}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 max-w-md w-full border border-rose-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Delete News Entry?</h3>
            <p className="text-blue-200 mb-6">
              Are you sure you want to delete this news entry for <strong>{news.ticker}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <GlassButton
                icon={X}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                tooltip="Cancel"
                variant="secondary"
                size="lg"
              />
              <GlassButton
                icon={Trash2}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    if (onDelete) {
                      await onDelete(news.news_id);
                    }
                    onClose();
                  } catch (err) {
                    console.error('Delete failed:', err);
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                tooltip={isDeleting ? 'Deleting...' : 'Confirm Delete'}
                variant="secondary"
                size="lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}