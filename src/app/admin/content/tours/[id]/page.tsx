"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Star,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Tag,
  Globe,
  Upload,
  Download,
  Trash2,
  Eye,
  ArrowUpDown,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImportModal } from "@/components/admin/ImportModal";
import { formatDate } from "@/lib/dateFormat";

// Types: allow date fields to be string as returned from API
interface TourRecord {
  id: string;
  name: string;
  slug: string | null;
  destination: string;
  primaryDestination?: string | null;
  destinationCountry?: string | null;
  destinationState?: string | null;
  duration: string;
  durationDays?: number | null;
  durationNights?: number | null;
  price: number;
  basePriceInInr?: number | null;
  originalPrice?: number | null;
  currency?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  status?: string | null;
  allowAdvance: boolean;
  advancePercentage?: number | null;
  tourType?: string | null;
  tourSubType?: string | null;
  region?: string | null;
  packageType?: string | null;
  country?: { id: string; name: string } | null;
  updatedAt: string | Date;
  createdAt: string | Date;
}

interface CountryOption {
  id: string;
  name: string;
}

type TourFilters = {
  countryId: string;
  status: "all" | "active" | "inactive" | "draft";
  tourType: string;
  region: string;
  packageType: string;
  featured: "all" | "yes" | "no";
  search: string;
};

const TOUR_FILTER_DEFAULT: TourFilters = {
  countryId: "",
  status: "all",
  tourType: "all",
  region: "all",
  packageType: "all",
  featured: "all",
  search: "",
};

export default function AdminToursPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TourFilters>(TOUR_FILTER_DEFAULT);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [bulkActionMessage, setBulkActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sortField, setSortField] = useState<"createdAt" | "price" | "name" | "status">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const bootstrapped = useRef(false);

  // Use a stable ref so we can cancel inflight fetches on unmount
  const countriesAbortRef = useRef<AbortController | null>(null);
  const toursAbortRef = useRef<AbortController | null>(null);

  const fetchCountries = useCallback(async () => {
    countriesAbortRef.current?.abort();
    const ac = new AbortController();
    countriesAbortRef.current = ac;
    try {
      const response = await fetch("/api/admin/content/countries", { signal: ac.signal });
      if (response.ok) {
        const data = await response.json();
        setCountries(
          data.map((country: any) => ({ id: country.id, name: country.name }))
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Failed to load countries", error);
    } finally {
      countriesAbortRef.current = null;
    }
  }, []);

  // fetchTours accepts filters explicitly and returns the fetched items
  const fetchTours = useCallback(async (activeFilters: TourFilters) => {
    toursAbortRef.current?.abort();
    const ac = new AbortController();
    toursAbortRef.current = ac;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilters.countryId) params.set("countryId", activeFilters.countryId);
      if (activeFilters.status && activeFilters.status !== "all") params.set("status", activeFilters.status);
      if (activeFilters.search) params.set("search", activeFilters.search);

      const response = await fetch(
        `/api/admin/content/tours${params.toString() ? `?${params}` : ""}`,
        { signal: ac.signal }
      );

      if (response.ok) {
        const data = await response.json();
        // Normalize dates (API may return ISO strings)
        const normalized: TourRecord[] = data.map((t: any) => ({ ...t, createdAt: t.createdAt || t.updatedAt, updatedAt: t.updatedAt || t.createdAt }));

        // Apply client-side filters for tourType, region, packageType, featured
        let filtered = normalized as TourRecord[];
        if (activeFilters.tourType !== "all") {
          filtered = filtered.filter((t) => t.tourType === activeFilters.tourType);
        }
        if (activeFilters.region !== "all") {
          filtered = filtered.filter((t) => t.region === activeFilters.region);
        }
        if (activeFilters.packageType !== "all") {
          filtered = filtered.filter((t) => t.packageType === activeFilters.packageType);
        }
        if (activeFilters.featured === "yes") {
          filtered = filtered.filter((t) => t.isFeatured);
        } else if (activeFilters.featured === "no") {
          filtered = filtered.filter((t) => !t.isFeatured);
        }

        setTours(filtered);
        return filtered;
      } else {
        console.error("Failed to fetch tours: ", response.statusText);
      }
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Error fetching tours:", error);
    } finally {
      toursAbortRef.current = null;
      setLoading(false);
      setRefreshing(false);
    }

    return [] as TourRecord[];
  }, []);

  useEffect(() => {
    if (status === "loading" || bootstrapped.current) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (session.user.role !== "STAFF_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      router.push("/admin");
      return;
    }
    bootstrapped.current = true;

    // initial load
    (async () => {
      setLoading(true);
      await Promise.all([fetchCountries(), fetchTours(TOUR_FILTER_DEFAULT)]);
      setLoading(false);
    })();

    return () => {
      countriesAbortRef.current?.abort();
      toursAbortRef.current?.abort();
    };
  }, [session, status, router, fetchCountries, fetchTours]);

  // Safer filter change: use functional update to avoid stale closures
  const handleFilterChange = useCallback((field: keyof TourFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value } as TourFilters;
      // Fetch using the new filters immediately
      fetchTours(next);
      return next;
    });
  }, [fetchTours]);

  // Debounced search handler
  const [searchValue, setSearchValue] = useState(filters.search);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (filters.search !== searchValue) {
      setSearchValue(filters.search);
    }
  }, [filters.search, searchValue]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleFilterChange("search", value);
    }, 300);
  }, [handleFilterChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTours(filters);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedTours.map(t => t.id)));
      setShowBulkActions(true);
    } else {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedIds.size === 0) return;

    setBulkActionLoading(true);
    setBulkActionMessage(null);

    try {
      switch (action) {
        case "status": {
          if (!value) return;
          const statusValue = value === "active" ? "active" : "inactive";
          const response = await fetch("/api/admin/content/tours/bulk/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selectedIds), status: statusValue, isActive: statusValue === "active" }),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to update status");
          }
          setBulkActionMessage({ type: "success", text: `Successfully updated ${selectedIds.size} tour(s)` });
          break;
        }
        case "featured": {
          const featuredValue = value === "true";
          const featuredResponse = await fetch("/api/admin/content/tours/bulk/featured", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selectedIds), featured: featuredValue }),
          });
          if (!featuredResponse.ok) {
            const errorData = await featuredResponse.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to update featured status");
          }
          setBulkActionMessage({ type: "success", text: `Successfully ${featuredValue ? "featured" : "unfeatured"} ${selectedIds.size} tour(s)` });
          break;
        }
        case "delete": {
          if (!confirm("Are you absolutely sure? This action cannot be undone.")) {
            setBulkActionLoading(false);
            return;
          }
          const deleteResponse = await fetch("/api/admin/content/tours/bulk/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selectedIds) }),
          });
          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to delete tours");
          }
          setBulkActionMessage({ type: "success", text: `Successfully deleted ${selectedIds.size} tour(s)` });
          break;
        }
        case "export": {
          const exportResponse = await fetch(`/api/admin/content/tours/export?ids=${Array.from(selectedIds).join(",")}`);
          if (!exportResponse.ok) {
            const errorData = await exportResponse.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to export tours");
          }
          const blob = await exportResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `tours-${new Date().toISOString().split("T")[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setBulkActionMessage({ type: "success", text: `Successfully exported ${selectedIds.size} tour(s)` });
          setBulkActionLoading(false);
          setTimeout(() => setBulkActionMessage(null), 5000);
          return;
        }
        default:
          break;
      }

      await fetchTours(filters);
      setSelectedIds(new Set());
      setShowBulkActions(false);
      setTimeout(() => setBulkActionMessage(null), 5000);
    } catch (error: any) {
      setBulkActionMessage({ type: "error", text: error.message || "An error occurred" });
      setTimeout(() => setBulkActionMessage(null), 5000);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusColor = (tour: TourRecord) => {
    const raw = (tour.status || (tour.isActive ? "active" : "inactive") || "inactive").toString().toLowerCase();
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-neutral-100 text-neutral-600",
      draft: "bg-yellow-100 text-yellow-700",
    };
    return colors[raw] || "bg-neutral-100 text-neutral-600";
  };

  const stats = useMemo(() => {
    const active = tours.filter(t => t.isActive && (!t.status || t.status === "active")).length;
    const inactive = tours.filter(t => !t.isActive || t.status === "inactive").length;
    const featured = tours.filter(t => t.isFeatured).length;
    const totalValue = tours.reduce((sum, t) => sum + (t.basePriceInInr || t.price || 0), 0);
    return { totalTours: tours.length, active, inactive, featured, totalValue };
  }, [tours]);

  const sortedTours = useMemo(() => {
    const cloned = [...tours];
    return cloned.sort((a, b) => {
      let comparison = 0;
      if (sortField === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "price") {
        comparison = (a.basePriceInInr || a.price || 0) - (b.basePriceInInr || b.price || 0);
      } else if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "status") {
        const aStatus = (a.status || (a.isActive ? "active" : "inactive")).toString();
        const bStatus = (b.status || (b.isActive ? "active" : "inactive")).toString();
        comparison = aStatus.localeCompare(bStatus);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tours, sortField, sortDirection]);

  const handleSortChange = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "price" ? "desc" : "asc");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const uniqueRegions = useMemo(() => Array.from(new Set(tours.map(t => t.region).filter((r): r is string => Boolean(r)))), [tours]);
  const uniqueTourTypes = useMemo(() => Array.from(new Set(tours.map(t => t.tourType).filter((t): t is string => Boolean(t)))) , [tours]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* header, stats, filters, table - kept unchanged visually */}

        {/* ... the rest of the JSX is intentionally identical to your original UI for brevity - keep your existing rendering code here ... */}

      </div>
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        entityType="tours"
        entityName="Tours"
        onImportComplete={() => {
          fetchTours(filters);
          setShowImportModal(false);
        }}
      />
    </AdminLayout>
  );
}
