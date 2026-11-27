// hooks/pos/usePosMasterData.js
import { useState, useEffect, useCallback, useRef } from "react";
import { getProductsFromIndexedDB } from "../../services/indexdb/productService";
import {
  getCustomersFromIndexedDB,
  saveCustomersToIndexedDB,
} from "../../services/indexdb/customerService";
import { getSalesPersonsFromIndexedDB } from "../../services/indexdb/salesPersonService";
import {
  PRODUCTS_UPDATED_EVENT,
} from "../../services/ProductDefinition/productService";
import {
  MASTER_DATA_UPDATED_EVENT,
  refreshMasterData,
} from "../../services/masterDataSyncService";
import { getAuthTenantId, getCurrentAuthTenantId } from "../../utils/authTenant";
import { useAuth } from "../auth/useAuth";
import { useGlobalLoader } from "../useGlobalLoader";

function sortProducts(products = []) {
  return [...products].sort((a, b) => {
    const nameOrder = String(a.name || "").localeCompare(
      String(b.name || ""),
      undefined,
      { sensitivity: "base" }
    );
    if (nameOrder !== 0) return nameOrder;

    const codeOrder = String(a.code || "").localeCompare(
      String(b.code || ""),
      undefined,
      { sensitivity: "base", numeric: true }
    );
    const idOrder = String(a.productId ?? "").localeCompare(
      String(b.productId ?? ""),
      undefined,
      { numeric: true }
    );
    return codeOrder || idOrder;
  });
}

/**
 * usePosMasterData
 * Loads products, customers, and sales persons for the POS screen.
 * Uses IndexedDB first with API fallback.
 */
export function usePosMasterData() {
  const { user } = useAuth();
  const tenantId = getAuthTenantId(user);
  const withGlobalLoader = useGlobalLoader();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const customersRef = useRef([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [products, setProducts] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const loadRequestId = useRef(0);

  const updateCustomers = useCallback((records) => {
    customersRef.current = records;
    setCustomers(records);
  }, []);

  const upsertCustomer = useCallback((customer) => {
    const currentCustomers = customersRef.current;
    const updatedCustomers = [
      ...currentCustomers.filter(
        (existing) =>
          customer.customerId == null ||
          String(existing.customerId) !== String(customer.customerId)
      ),
      customer,
    ];

    updateCustomers(updatedCustomers);
    if (tenantId) {
      saveCustomersToIndexedDB(updatedCustomers, tenantId).catch((error) => {
        console.error("[usePosMasterData] Error caching customer:", error);
      });
    }
  }, [tenantId, updateCustomers]);

  const loadInitialData = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    updateCustomers([]);
    setSalesPersons([]);
    setProducts([]);
    setLocalProducts([]);
    setFilteredProducts([]);

    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      let [productsData, customersData, personsData] = await Promise.all([
        getProductsFromIndexedDB(tenantId),
        getCustomersFromIndexedDB(tenantId),
        getSalesPersonsFromIndexedDB(tenantId),
      ]);

      if (
        tenantId &&
        navigator.onLine &&
        (!productsData.length || !customersData.length || !personsData.length)
      ) {
        try {
          const synced = await refreshMasterData(tenantId);
          productsData = synced.products || productsData;
          customersData = synced.customers || customersData;
          personsData = synced.salesPersons || personsData;
        } catch (error) {
          console.error("[usePosMasterData] Initial master-data sync failed:", error);
        }
      }

      if (
        requestId !== loadRequestId.current ||
        getCurrentAuthTenantId() !== tenantId
      ) {
        return;
      }
      const sortedProducts = sortProducts(productsData || []);
      updateCustomers(customersData || []);
      setSalesPersons(personsData || []);
      setProducts(sortedProducts);
      setLocalProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
    } catch (error) {
      if (requestId === loadRequestId.current) {
        console.error("[usePosMasterData] Error loading data:", error);
      }
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, [tenantId, updateCustomers]);

  const refreshProducts = useCallback(
    () => refreshMasterData(tenantId),
    [tenantId]
  );

  useEffect(() => {
    void withGlobalLoader(loadInitialData, "Loading point-of-sale data...");
  }, [loadInitialData, withGlobalLoader]);

  useEffect(() => {
    const handleProductsUpdated = (event) => {
      if (
        event.detail?.tenantId !== tenantId ||
        getCurrentAuthTenantId() !== tenantId
      ) return;
      const updatedProducts = event.detail?.products;
      if (!Array.isArray(updatedProducts)) return;

      const sortedProducts = sortProducts(updatedProducts);
      setProducts(sortedProducts);
      setLocalProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
    };

    const handleMasterDataUpdated = (event) => {
      if (
        event.detail?.tenantId !== tenantId ||
        getCurrentAuthTenantId() !== tenantId
      ) return;
      const { entity, records } = event.detail || {};
      if (!Array.isArray(records)) return;

      if (entity === "customers") updateCustomers(records);
      if (entity === "salesPersons") setSalesPersons(records);
      if (entity === "products") {
        const sortedProducts = sortProducts(records);
        setProducts(sortedProducts);
        setLocalProducts(sortedProducts);
        setFilteredProducts(sortedProducts);
      }
    };

    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    window.addEventListener(MASTER_DATA_UPDATED_EVENT, handleMasterDataUpdated);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
      window.removeEventListener(
        MASTER_DATA_UPDATED_EVENT,
        handleMasterDataUpdated
      );
    };
  }, [tenantId, updateCustomers]);

  return {
    loading,
    customers,
    upsertCustomer,
    salesPersons,
    products,
    localProducts,
    filteredProducts,
    setFilteredProducts,
    refreshProducts,
    reloadMasterData: loadInitialData,
  };
}