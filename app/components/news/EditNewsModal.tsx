'use client';

import { X, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NewsType } from '../../lib/types/news';
import { NewsListItem } from '../../lib/types/newsViews';
import GlassButton from '@/app/lib/ui/GlassButton';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';

interface EditNewsModalProps {
    newsItem: NewsListItem | null;
    newsTypes: NewsType[];
    onClose: () => void;
    onSuccess: () => void;
}

export function EditNewsModal({ newsItem, newsTypes, onClose, onSuccess }: EditNewsModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [editFormData, setEditFormData] = useState({
        ticker: '',
        company_name: '',
        news_type_id: 0,
        news_description: '',
        news_date: '',
        news_source: '',
        news_url: '',
        tags: '',
        alert_date: '',
        alert_notes: ''
    });

    if (!newsItem) return null;

    // Initialize form data when modal opens
    useEffect(() => {
        if (newsItem) {
            // Handle tags - convert array to comma-separated string
            let tagsString = '';
            if (newsItem.tags) {
                if (Array.isArray(newsItem.tags)) {
                    tagsString = newsItem.tags.join(', ');
                } else if (typeof newsItem.tags === 'string') {
                    tagsString = newsItem.tags;
                }
            }

            setEditFormData({
                ticker: newsItem.ticker,
                company_name: newsItem.company_name || '',
                news_type_id: newsItem.news_type_id,
                news_description: newsItem.news_description,
                news_date: newsItem.news_date,
                news_source: newsItem.news_source || '',
                news_url: newsItem.news_url || '',
                tags: tagsString,
                alert_date: newsItem.alert_date || '',
                alert_notes: newsItem.alert_notes || ''
            });
            setEditError(null);
        }
    }, [newsItem]);

    const handleSaveEdit = async () => {
        // Validation
        if (!editFormData.ticker || !editFormData.news_type_id || !editFormData.news_description || !editFormData.news_date) {
            setEditError('Ticker, News Type, Description, and Date are required');
            return;
        }

        setIsSaving(true);
        setEditError(null);

        try {
            const response = await fetch(`/api/news`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newsId: newsItem.news_id,
                    newsData: {
                        ticker: editFormData.ticker,
                        company_name: editFormData.company_name || null,
                        news_type_id: editFormData.news_type_id,
                        news_description: editFormData.news_description,
                        news_date: editFormData.news_date,
                        news_source: editFormData.news_source || null,
                        news_url: editFormData.news_url || null,
                        tags: editFormData.tags || null,
                        alert_date: editFormData.alert_date || null,
                        alert_notes: editFormData.alert_notes || null
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update news');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setEditError(err.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        onClose();
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/news?newsId=${newsItem.news_id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete news');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Delete failed:', err);
            setEditError(err.message || 'Failed to delete news');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
                {/* Header */}
                <div className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 flex items-start justify-between rounded-t-3xl">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-white">{newsItem.ticker}</h2>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm">
                                {newsItem.news_type.type_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-blue-300 text-sm">
                                {new Date(newsItem.news_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <GlassButton
                            icon={Save}
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            tooltip={isSaving ? 'Saving...' : 'Save Changes'}
                            variant="primary"
                            size="md"
                        />
                        <GlassButton
                            icon={Trash2}
                            onClick={() => setShowDeleteConfirm(true)}
                            tooltip="Delete News"
                            variant="secondary"
                            size="md"
                        />
                        <GlassButton
                            icon={X}
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            tooltip="Cancel"
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

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Ticker */}
                            <div>
                                <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker *</label>
                                <input
                                    type="text"
                                    value={editFormData.ticker}
                                    onChange={(e) => setEditFormData({ ...editFormData, ticker: e.target.value.toUpperCase() })}
                                    className="w-full funding-input rounded-xl px-4 py-3"
                                    disabled={isSaving}
                                    placeholder="AAPL"
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
                                    placeholder="Apple Inc."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* News Type */}
                            <div>
                                <label className="text-blue-200 text-sm mb-2 block font-medium">Type of News *</label>
                                <select
                                    value={editFormData.news_type_id}
                                    onChange={(e) => setEditFormData({ ...editFormData, news_type_id: parseInt(e.target.value) })}
                                    className="w-full funding-input rounded-xl px-4 py-3"
                                    disabled={isSaving}
                                >
                                    <option value="">Select news type...</option>
                                    {newsTypes.map(type => (
                                        <option key={type.news_type_id} value={type.news_type_id}>
                                            {type.type_name}
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Source */}
                            <div>
                                <label className="text-blue-200 text-sm mb-2 block font-medium">Source</label>
                                <input
                                    type="text"
                                    value={editFormData.news_source}
                                    onChange={(e) => setEditFormData({ ...editFormData, news_source: e.target.value })}
                                    className="w-full funding-input rounded-xl px-4 py-3"
                                    disabled={isSaving}
                                    placeholder="Bloomberg, Reuters, etc."
                                />
                            </div>

                            {/* URL */}
                            <div>
                                <label className="text-blue-200 text-sm mb-2 block font-medium">URL</label>
                                <input
                                    type="url"
                                    value={editFormData.news_url}
                                    onChange={(e) => setEditFormData({ ...editFormData, news_url: e.target.value })}
                                    className="w-full funding-input rounded-xl px-4 py-3"
                                    disabled={isSaving}
                                    placeholder="https://..."
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
                                label="Description of the News *"
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

                        {/* Alert Section */}
                        <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4 space-y-4">
                            <h3 className="text-amber-300 font-semibold text-sm">Set Alert (Optional)</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Alert Date */}
                                <div>
                                    <label className="text-blue-200 text-sm mb-2 block font-medium">Alert Date</label>
                                    <input
                                        type="date"
                                        value={editFormData.alert_date}
                                        onChange={(e) => setEditFormData({ ...editFormData, alert_date: e.target.value })}
                                        className="w-full funding-input rounded-xl px-4 py-3"
                                        disabled={isSaving}
                                    />
                                </div>

                                {/* Alert Notes */}
                                <div>
                                    <label className="text-blue-200 text-sm mb-2 block font-medium">Alert Notes</label>
                                    <textarea
                                        value={editFormData.alert_notes}
                                        onChange={(e) => setEditFormData({ ...editFormData, alert_notes: e.target.value })}
                                        className="w-full funding-input rounded-xl px-4 py-3"
                                        disabled={isSaving}
                                        rows={1}
                                        placeholder="Reminder notes..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 max-w-md w-full border border-rose-500/30">
                        <h3 className="text-xl font-bold text-white mb-3">Delete News Item?</h3>
                        <p className="text-blue-200 mb-6">
                            Are you sure you want to delete this news item? This action cannot be undone.
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
                                onClick={handleDelete}
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