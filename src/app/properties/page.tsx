'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, TrendingUp, TrendingDown, Minus, Eye, Trash2, Archive, ArchiveRestore } from 'lucide-react'

type PropertyAnalysis = {
  id: string;
  address: string;
  propertyType: string;
  purchasePrice: number;
  bedrooms?: number;
  bathrooms?: number;
  createdAt: string;
  archived: boolean;
  analysis: {
    id: string;
    roi: number;
    monthlyCashFlow: number;
    recommendation: string;
    recommendationScore: number;
    createdAt: string;
  } | null;
  owner?: {
    name?: string | null;
    email: string;
  };
};

interface PropertiesResponse {
  success: boolean;
  analyses: PropertyAnalysis[];
  total: number;
}

export default function PropertiesPage() {
  const router = useRouter();
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Handle checkbox toggle (limit to 3)
  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else if (prev.length < 3) {
        return [...prev, id];
      } else {
        return prev; // Do not allow more than 3
      }
    });
  };

  // Handle compare button
  const handleCompare = () => {
    if (selectedIds.length < 2) return;
    // Navigate to /properties/compare?ids=... (comma-separated)
    router.push(`/properties/compare?ids=${selectedIds.join(',')}`);
  };
  // Number of skeleton cards to show while loading
  const skeletonCount = 3;

  const [properties, setProperties] = useState<PropertyAnalysis[]>([]);
  // Ensure properties is always an array for null safety
  const safeProperties = properties || [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;
  const totalPages = Math.ceil((safeProperties.length || 0) / pageSize);
  // Archive state
  const [showArchived, setShowArchived] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  // (Removed old paginatedProperties declaration; now handled below after filtering)
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ property: PropertyAnalysis; timeout: NodeJS.Timeout | null } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const undoRef = useRef<HTMLDivElement>(null);
  // Filter properties for search (all users)
  const filteredProperties = search.trim()
    ? safeProperties.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.address.toLowerCase().includes(q) ||
          p.propertyType.toLowerCase().includes(q) ||
          (p.owner?.name && p.owner.name.toLowerCase().includes(q)) ||
          (p.owner?.email && p.owner.email.toLowerCase().includes(q))
        );
      })
  : safeProperties;
  const paginatedProperties = filteredProperties?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];
  const openDeleteModal = (id: string) => {
    setPendingDeleteId(id);
    setModalOpen(true);
  };

  const closeDeleteModal = () => {
    setPendingDeleteId(null);
    setModalOpen(false);
  };

  // Delayed delete with undo
  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    const propertyToDelete = properties.find((p) => p.id === pendingDeleteId);
    if (!propertyToDelete) {
      setDeletingId(null);
      closeDeleteModal();
      return;
    }
    // Remove from UI immediately
    setProperties((prev) => prev.filter((p) => p.id !== pendingDeleteId));
    closeDeleteModal();
    // Set undo data and start timer for actual delete
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/properties/${pendingDeleteId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!data.success) {
          alert(data.error || 'Failed to delete property');
        }
      } catch (err) {
        alert('Error deleting property');
      } finally {
        setUndoData(null);
      }
    }, 10000);
    setUndoData({ property: propertyToDelete, timeout });
    setDeletingId(null);
  };

  const handleUndo = async () => {
    if (!undoData) return;
    if (undoData.timeout) clearTimeout(undoData.timeout);
    // Restore property in UI
    setProperties((prev) => [undoData.property, ...prev]);
    setUndoData(null);
    // No backend delete will occur since timer is cleared
  };

  // Archive/Unarchive functions
  const handleArchive = async (id: string) => {
    const property = properties.find(p => p.id === id);
    if (!property) return;

    setArchivingId(id);
    try {
      const response = await fetch(`/api/properties/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !property.archived }),
      });

      const data = await response.json();
      if (data.success) {
        // Update the property in the state
        setProperties(prev => prev.map(p => 
          p.id === id ? { ...p, archived: !p.archived } : p
        ));
      } else {
        alert(data.error || 'Failed to update property');
      }
    } catch (err) {
      alert('Error updating property');
      console.error('Error archiving property:', err);
    } finally {
      setArchivingId(null);
    }
  };
  // Snackbar for undo
  useEffect(() => {
    if (undoData && undoRef.current) {
      undoRef.current.focus();
    }
  }, [undoData]);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Refetch properties when archive filter changes
  useEffect(() => {
    fetchProperties();
  }, [showArchived]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      // Fetch properties based on archive filter
      const archived = showArchived ? 'true' : 'false';
      const response = await fetch(`/api/properties?archived=${archived}`);
      const data: PropertiesResponse = await response.json();
      if (data.success) {
        setProperties(data.analyses);
      } else {
        setError('Failed to load properties');
      }
    } catch (err) {
      setError('Error fetching properties');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRecommendationColor = (recommendation: string, score: number) => {
    if (recommendation === 'BUY' && score >= 70) return 'text-green-600 bg-green-50';
    if (recommendation === 'PASS' && score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation === 'BUY') return <TrendingUp className="h-4 w-4" />;
    if (recommendation === 'PASS') return <Minus className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const getCashFlowColor = (cashFlow: number) => {
    if (cashFlow > 100) return 'text-green-600';
    if (cashFlow > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to render walk-through rating badge if aggregation fields exist
  const renderWalkRating = (p: any) => {
    if (typeof p.walkThroughAverageRating === 'undefined') return null;
    const avg = p.walkThroughAverageRating;
    const count = p.walkThroughRatingCount || 0;
    return (
      <div className="mt-1 flex items-center gap-1 text-xs">
        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium">
          {avg === null ? 'No WT Ratings' : `${avg.toFixed(1)}⭐ (${count})`}
        </span>
      </div>
    )
  }

  return (
  <main>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 w-full">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calculator
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Property Analysis History</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {safeProperties.length} {safeProperties.length === 1 ? 'property' : 'properties'} analyzed
                {showArchived && ' (archived)'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row items-center">
            {/* Archive Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="mr-2"
              title={showArchived ? "Show active properties" : "Show archived properties"}
            >
              {showArchived ? (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Show Active
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Show Archived
                </>
              )}
            </Button>
            {/* Compare Selected Button */}
            <Button
              variant="default"
              size="sm"
              className="ml-0 sm:ml-4"
              disabled={selectedIds.length < 2}
              onClick={handleCompare}
            >
              Compare Selected ({selectedIds.length})
            </Button>
            <div className="h-2 sm:w-6" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by address, owner, type..."
              className="border border-gray-300 rounded px-3 py-1 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0 sm:mr-4"
              aria-label="Search properties"
            />
            {/* Removed Calculator button as requested */}
          </div>
        </div>
        {/* Loading skeletons */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="max-w-md mx-auto w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-500 mb-4">{error}</p>
                <Link href="/">
                  <Button>Analyze Property</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : filteredProperties.length === 0 ? (
          <Card className="max-w-md mx-auto w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No properties found{search ? ' for this search.' : '.'}</p>
                <Link href="/">
                  <Button>Analyze Property</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedProperties.map((property) => (
                <Card key={property.id} className={`hover:shadow-md transition-shadow w-full relative ${property.archived ? 'opacity-60 grayscale' : ''}`}> 
                  {/* Archived badge */}
                  {property.archived && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded z-20" data-testid="archived-badge">
                      Archived
                    </span>
                  )}
                  {/* Multi-select checkbox */}
                  <input
                    type="checkbox"
                    className="absolute top-3 left-3 h-5 w-5 accent-indigo-600 z-10"
                    checked={selectedIds.includes(property.id)}
                    onChange={() => handleSelect(property.id)}
                    aria-label={`Select property at ${property.address}`}
                    disabled={
                      !selectedIds.includes(property.id) && selectedIds.length >= 3
                    }
                  />
                  <CardHeader className="pl-8">
                    <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                      <div className="flex-1">
                        {property.address}
                        {isAdmin && property.owner && (
                          <div className="text-xs text-gray-500 mt-1">
                            Owner: {property.owner.name ? property.owner.name : property.owner.email}
                          </div>
                        )}
                      </div>
                      {property.analysis && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRecommendationColor(property.analysis.recommendation, property.analysis.recommendationScore)}`}>
                          {getRecommendationIcon(property.analysis.recommendation)}
                          {property.analysis.recommendation}
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {property.propertyType} • {formatCurrency(property.purchasePrice)}
                      {(property.bedrooms || property.bathrooms) && (
                        <span className="ml-2 text-gray-500">
                          {property.bedrooms ? `${property.bedrooms} bed` : ''}
                          {property.bedrooms && property.bathrooms ? ' / ' : ''}
                          {property.bathrooms ? `${property.bathrooms} bath` : ''}
                        </span>
                      )}
                      {'purchasePrice' in property && 'analysis' in property && property.analysis && typeof property.purchasePrice === 'number' && typeof (property as any).squareFootage === 'number' && typeof (property as any).analysis.monthlyCashFlow === 'number' ? (
                        <span className="ml-2 text-xs text-blue-700">
                          {/* Try to use grossRent if available, else estimate from cash flow and price */}
                          Rent/Sq Ft: <span className="font-semibold">{
                            (typeof (property as any).grossRent === 'number' && typeof (property as any).squareFootage === 'number')
                              ? ((property as any).grossRent / (property as any).squareFootage).toFixed(2)
                              : 'N/A'
                          }</span>
                        </span>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {property.analysis ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-600">ROI</p>
                            <p className="font-semibold">{property.analysis.roi.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Cash Flow</p>
                            <p className={`font-semibold ${getCashFlowColor(property.analysis.monthlyCashFlow)}`}>
                              {formatCurrency(property.analysis.monthlyCashFlow)}/mo
                            </p>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm">
                          <p className="text-gray-600">Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  property.analysis.recommendationScore >= 70 ? 'bg-green-500' :
                                  property.analysis.recommendationScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${property.analysis.recommendationScore}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold">{property.analysis.recommendationScore}/100</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500">
                            Analyzed {formatDate(property.analysis.createdAt)}
                          </p>
                          {renderWalkRating(property)}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-xs sm:text-sm">No analysis data available</p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Link href={`/properties/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 flex-shrink-0"
                        title={property.archived ? "Unarchive property" : "Archive property"}
                        onClick={() => handleArchive(property.id)}
                        disabled={archivingId === property.id}
                      >
                        {archivingId === property.id ? (
                          <span className="animate-spin">{property.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</span>
                        ) : (
                          property.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-10 flex-shrink-0"
                        title="Delete property"
                        onClick={() => openDeleteModal(property.id)}
                        disabled={deletingId === property.id}
                      >
                        {deletingId === property.id ? (
                          <span className="animate-spin"><Trash2 className="h-4 w-4" /></span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Pagination Controls */}
            {safeProperties.length > pageSize && (
              <div className="flex flex-col sm:flex-row justify-center mt-8 gap-2">
                <button
                  className={`px-3 py-1 rounded border text-xs sm:text-base ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    className={`px-3 py-1 rounded border text-xs sm:text-base ${currentPage === idx + 1 ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100'}`}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  className={`px-3 py-1 rounded border text-xs sm:text-base ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Modal Confirmation Dialog */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">Delete Property?</h2>
            <p className="mb-4">Are you sure you want to delete this property? This action can be undone for 10 seconds.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                type="button"
                autoFocus
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Snackbar */}
      {undoData && (
        <div
          ref={undoRef}
          tabIndex={-1}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded shadow flex items-center gap-4 animate-fade-in"
        >
          <span>Property deleted.</span>
          <button
            className="underline font-semibold hover:text-blue-300 focus:outline-none"
            onClick={handleUndo}
          >
            Undo
          </button>
        </div>
      )}
    </main>
  );
}
