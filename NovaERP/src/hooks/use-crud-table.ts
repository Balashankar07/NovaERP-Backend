import { useState, useEffect, useCallback, useRef } from "react";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";

type ViewState = "loading" | "success" | "error" | "empty";

export interface UseCrudTableOptions<TData> {
  fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<TData>>;
  defaultSortBy?: string;
  initialSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  defaultPageSize?: number;
  defaultCodePrefix?: string;
}

export function useCrudTable<TData>({
  fetchFn,
  defaultSortBy,
  initialSortBy,
  defaultSortOrder = "asc",
  defaultPageSize = 10,
  defaultCodePrefix,
}: UseCrudTableOptions<TData>) {
  const effectiveSortBy = initialSortBy || defaultSortBy || "Id";
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [data, setData] = useState<PaginatedResponse<TData> | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  // isFetching = true during background refetches (sort/page/search changes)
  // when we already have data. Lets us keep showing existing rows without flutter.
  const [isFetching, setIsFetching] = useState(false);

  // Track whether we've ever successfully received data
  const hasData = useRef(false);

  const [queryParams, setQueryParams] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: defaultPageSize,
    search: "",
    sortBy: effectiveSortBy,
    sortOrder: defaultSortOrder,
    codePrefix: defaultCodePrefix,
  });

  const [searchInput, _setSearchInput] = useState("");

  const setSearchInput = useCallback((value: string) => {
    _setSearchInput(value);

    if (value.trim() === "") {
      setQueryParams((prev) => {
        if (prev.search === "") return prev;
        return {
          ...prev,
          search: "",
          pageNumber: 1,
          sortBy: effectiveSortBy,
          sortOrder: defaultSortOrder,
        };
      });
    }
  }, [effectiveSortBy, defaultSortOrder]);

  const fetchData = useCallback(async () => {
    if (!hasData.current) {
      // First mount — no data yet, show full loading spinner
      setViewState("loading");
    } else {
      // Subsequent refetches — keep existing rows visible, mark as background fetching
      setIsFetching(true);
    }

    try {
      const res = await fetchFnRef.current(queryParams);

      if (res.items.length === 0 && queryParams.pageNumber === 1 && !queryParams.search) {
        setData(null);
        hasData.current = false;
        setViewState("empty");
      } else {
        setData(res);
        hasData.current = true;
        setViewState("success");
      }
    } catch (error: any) {
      setViewState("error");
      setErrorDetails(error);
      console.error("Failed to fetch table data", error);
    } finally {
      setIsFetching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitSearch = useCallback((explicitValue?: string) => {
    const trimmed = (explicitValue !== undefined ? explicitValue : searchInput).trim();

    if (trimmed === "") {
      setQueryParams((prev) => {
        if (prev.search === "") return prev;
        return {
          ...prev,
          search: "",
          pageNumber: 1,
          sortBy: effectiveSortBy,
          sortOrder: defaultSortOrder,
        };
      });
    } else {
      setQueryParams((prev) => ({ ...prev, search: trimmed, pageNumber: 1 }));
    }
  }, [searchInput, effectiveSortBy, defaultSortOrder]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    submitSearch();
  };

  const toggleSort = (field: string) => {
    setQueryParams((prev) => ({
      ...prev,
      pageNumber: 1,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const setPage = (newPage: number) => {
    setQueryParams((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const refresh = () => {
    fetchData();
  };

  return {
    viewState,
    data,
    setData,
    isFetching,
    queryParams,
    searchInput,
    setSearchInput,
    handleSearch,
    submitSearch,
    toggleSort,
    setPage,
    refresh,
    errorDetails,
  };
}
