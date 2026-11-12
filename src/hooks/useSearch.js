// hooks/useSearch.js
import { useState, useCallback, useMemo } from "react";

function useSearch({
  data = [],
  initialFilters = {},
  searchFields = [],
  debounceDelay = 300,
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setActiveFilters({ ...filters });
    setTimeout(() => {
      setIsSearching(false);
    }, 100);
  }, [filters]);

  const handleReset = useCallback(() => {
    const emptyFilters = {};
    Object.keys(initialFilters).forEach((key) => {
      emptyFilters[key] = "";
    });
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setIsSearching(false);
  }, [initialFilters]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    Object.values(activeFilters).forEach((value) => {
      if (value && value !== "" && value !== null && value !== undefined) {
        count++;
      }
    });
    return count;
  }, [activeFilters]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      let matches = true;

      for (const field of searchFields) {
        const filterValue = activeFilters[field.name];
        
        // Skip empty filters
        if (!filterValue || filterValue === "") continue;

        const itemValue = field.getValue ? field.getValue(item) : item[field.name];

        // Handle date range (from - to)
        if (field.name === "dateFrom" && filterValue) {
          const fromDate = new Date(filterValue);
          const purchaseDate = new Date(itemValue);
          if (purchaseDate < fromDate) {
            matches = false;
            break;
          }
          continue;
        }

        if (field.name === "dateTo" && filterValue) {
          const toDate = new Date(filterValue);
          // Set to end of day for inclusive search
          toDate.setHours(23, 59, 59, 999);
          const purchaseDate = new Date(itemValue);
          if (purchaseDate > toDate) {
            matches = false;
            break;
          }
          continue;
        }

        // Handle exact match (for dropdowns like supplierId, status)
        if (field.type === "exact" || field.type === "select") {
          if (String(itemValue) !== String(filterValue)) {
            matches = false;
            break;
          }
        } 
        // Handle number fields
        else if (field.type === "number") {
          if (Number(itemValue) !== Number(filterValue)) {
            matches = false;
            break;
          }
        }
        // Default: case-insensitive string search
        else {
          if (!itemValue?.toString().toLowerCase().includes(filterValue.toLowerCase())) {
            matches = false;
            break;
          }
        }
      }

      return matches;
    });
  }, [data, activeFilters, searchFields]);

  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

  return {
    filters,
    activeFilters,
    filteredData,
    showSearch,
    isSearching,
    activeFilterCount: getActiveFilterCount(),
    setFilters,
    handleFilterChange,
    handleSearch,
    handleReset,
    toggleSearch,
    setShowSearch,
  };
}

export default useSearch;