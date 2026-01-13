'use client';

import { useState, useEffect } from 'react';
import { Edit2, Bell, BellOff, ChevronUp, ChevronDown, ChevronsUpDown, Filter, X, FilterX } from 'lucide-react';
import { NewsType } from '../../lib/types/news';
import { NewsListItem } from '../../lib/types/newsViews';
import GlassButton from '@/app/lib/ui/GlassButton';
import { NotesPopover } from '@/app/lib/ui/NotesPopover';
import { EditNewsModal } from './EditNewsModal';

interface AllNewsProps {
  newsTypes: NewsType[];
  onEdit: (news: NewsListItem) => void;
}

type SortField = 'date' | 'ticker' | 'type' | 'source';
type SortDirection = 'asc' | 'desc';

interface NewsItemWithType extends NewsListItem {
  news_type: {
    type_code: string;
    type_name: string;
  };
}

export function AllNews({ newsTypes, onEdit }: AllNewsProps) {
  const [newsItems, setNewsItems] = useState<NewsItemWithType[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItemWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const pageSize = 20;
  const [editingNews, setEditingNews] = useState<NewsItemWithType | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news/all-news?page=1&pageSize=1000`);
      const result = await response.json();
      setNewsItems(result.data || []);
      setFilteredNews(result.data || []);
      
      // Extract unique news types from dataset
      const types = Array.from(new Set(
        (result.data || []).map((item: NewsItemWithType) => item.news_type.type_name)
      )).sort();
      setAvailableTypes(types as string[]);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...newsItems];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.news_type.type_name === filterType);
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(n => 
        new Date(n.news_date) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(n => 
        new Date(n.news_date) <= new Date(dateTo)
      );
    }

    // Filter by search term (description and tags)
    if (searchTerm) {
    filtered = filtered.filter(n => {
        const descMatch = n.news_description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Handle tags as string or array
        let tagsMatch = false;
        const tags = n.tags as string[] | string | null;
        
        if (tags) {
        if (Array.isArray(tags)) {
            tagsMatch = tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        } else if (typeof tags === 'string') {
            tagsMatch = tags.toLowerCase().includes(searchTerm.toLowerCase());
        }
        }
        
        return descMatch || tagsMatch;
    });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'date':
          aVal = new Date(a.news_date).getTime();
          bVal = new Date(b.news_date).getTime();
          break;
        case 'ticker':
          aVal = a.ticker;
          bVal = b.ticker;
          break;
        case 'type':
          aVal = a.news_type.type_name;
          bVal = b.news_type.type_name;
          break;
        case 'source':
          aVal = a.news_source || '';
          bVal = b.news_source || '';
          break;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredNews(filtered);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    setCurrentPage(1);
  }, [newsItems, filterType, searchTerm, dateFrom, dateTo, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 inline ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const clearAllFilters = () => {
    setFilterType('all');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = filterType !== 'all' || searchTerm || dateFrom || dateTo;

  // Paginate filtered results
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedNews = filteredNews.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-center text-blue-200">Loading news items...</p>
      </div>
    );
  }

  return (
    <>
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">All News Items</h2>
          <p className="text-xs text-blue-300 mt-1">
            Showing {filteredNews.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredNews.length)} of {filteredNews.length} news items
          </p>
        </div>
        <GlassButton
          icon={showFilters ? X : Filter}
          onClick={() => setShowFilters(!showFilters)}
          tooltip={showFilters ? 'Hide Filters' : 'Show Filters'}
          variant="primary"
          size="sm"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Filter by Type */}
            <div className="flex-1">
              <label className="text-blue-200 text-sm mb-2 block font-medium">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full funding-input rounded-xl px-4 py-2 text-sm"
              >
                <option value="all">All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="text-blue-200 text-sm mb-2 block font-medium">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search description or tags..."
                className="w-full funding-input rounded-xl px-4 py-2 text-sm"
              />
            </div>

            {/* Clear All Filters */}
            <div className="flex items-end">
              <GlassButton
                icon={FilterX}
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                tooltip="Clear All Filters"
                variant="secondary"
                size="sm"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-4">
            <h4 className="text-blue-200 text-sm font-semibold">Published Date Range</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-blue-200 text-xs mb-2 block">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-blue-200 text-xs mb-2 block">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-blue-300 text-sm font-medium">Active filters:</span>
              {filterType !== 'all' && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                  Type: {filterType}
                  <button onClick={() => setFilterType('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(dateFrom || dateTo) && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                  Date: {dateFrom || '...'} to {dateTo || '...'}
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/20">
              <th 
                className="text-left text-blue-200 font-semibold p-2 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('date')}
              >
                Date {getSortIcon('date')}
              </th>
              <th 
                className="text-left text-blue-200 font-semibold p-2 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('ticker')}
              >
                Ticker {getSortIcon('ticker')}
              </th>
              <th 
                className="text-left text-blue-200 font-semibold p-2 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('type')}
              >
                Type {getSortIcon('type')}
              </th>
              <th 
                className="text-left text-blue-200 font-semibold p-2 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('source')}
              >
                Source {getSortIcon('source')}
              </th>
              <th className="text-left text-blue-200 font-semibold p-2">Description</th>
              <th className="text-left text-blue-200 font-semibold p-2">Tags</th>
              <th className="text-center text-blue-200 font-semibold p-2">Alert</th>
              <th className="text-center text-blue-200 font-semibold p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedNews.map((newsItem) => (
              <tr key={newsItem.news_id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="p-2 text-white">
                  {new Date(newsItem.news_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{newsItem.ticker}</span>
                    {newsItem.company_name && (
                      <span className="text-blue-300 text-xs truncate max-w-[100px]">
                        {newsItem.company_name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2">
                    <span className="text-blue-200">{newsItem.news_type.type_name}</span>
                </td>
                <td className="p-2 text-white">{newsItem.news_source || '-'}</td>
                <td className="p-2 text-white max-w-xs">
                  {newsItem.news_description ? (
                    <NotesPopover 
                      notes={newsItem.news_description}
                      title={`${newsItem.ticker} - ${newsItem.news_type.type_name}`}
                    />
                  ) : (
                    <span className="text-blue-300 italic text-xs">No description</span>
                  )}
                </td>
                <td className="p-2 text-blue-200">
                    {(() => {
                        // Handle tags - could be string or array or null
                        let tagsArray: string[] = [];
                        const tags = newsItem.tags as string[] | string | null;
                        
                        if (tags) {
                        if (Array.isArray(tags)) {
                            tagsArray = tags;
                        } else if (typeof tags === 'string') {
                            tagsArray = tags.split(',').map((t: string) => t.trim());
                        }
                        }
                        
                        return tagsArray.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {tagsArray.slice(0, 2).map((tag: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-500/20 rounded-full text-xs">
                                {tag}
                            </span>
                            ))}
                            {tagsArray.length > 2 && (
                            <span className="text-xs text-blue-300">+{tagsArray.length - 2}</span>
                            )}
                        </div>
                        ) : (
                        <span className="text-blue-300 italic text-xs">-</span>
                        );
                    })()}
                </td>
                <td className="p-2">
                    <div className="flex items-center justify-center">
                        {newsItem.alert_date ? (
                        <div title={`Alert: ${new Date(newsItem.alert_date).toLocaleDateString()}`}>
                            <Bell className="w-4 h-4 text-amber-400" />
                        </div>
                        ) : (
                        <BellOff className="w-4 h-4 text-blue-300 opacity-30" />
                        )}
                    </div>
                    </td>
                <td className="p-2">
                  <div className="flex items-center justify-center">
                    <button
                        onClick={() => setEditingNews(newsItem)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit"
                        >
                        <Edit2 className="w-4 h-4 text-blue-300" />
                        </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {filteredNews.length === 0 && (
          <div className="text-center py-12 text-blue-200">
            {newsItems.length === 0 
              ? 'No news items found. Start by adding your first news entry!'
              : 'No news items match your filters. Try adjusting your search criteria.'
            }
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingNews && (
        <EditNewsModal
          newsItem={editingNews}
          newsTypes={newsTypes}
          onClose={() => setEditingNews(null)}
          onSuccess={() => {
            setEditingNews(null);
            fetchNews();
          }}
        />
      )}
    </>
  );
}