// hooks/pos/usePosMasterData.js
import { useState, useEffect, useCallback } from "react";
import { getProductsFromIndexedDB } from "../../services/indexdb/productService";
import { getCustomersFromIndexedDB } from "../../services/indexdb/customerService";
import { getSalesPersonsFromIndexedDB } from "../../services/indexdb/salesPersonService";
import {
  getProducts,
  refreshProductCache,
} from "../../services/ProductDefinition/productService";
import { getCustomers } from "../../services/CustomerDefinition/customerService";
import { getSalesPersons } from "../../services/SalesPersonDefinition/salesPersonService";

/**
 * usePosMasterData
 * Loads products, customers, and sales persons for the POS screen.
 * Uses IndexedDB first with API fallback.
 */
export function usePosMasterData() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [products, setProducts] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Products
      let productsData = await getProductsFromIndexedDB();
      if (!productsData || productsData.length === 0) {
        productsData = await getProducts();
      }

      // 2. Customers
      let customersData = await getCustomersFromIndexedDB();
      if (!customersData || customersData.length === 0) {
        customersData = await getCustomers();
      }

      // 3. Sales Persons
      let personsData = await getSalesPersonsFromIndexedDB();
      if (!personsData || personsData.length === 0) {
        personsData = await getSalesPersons();
      }

      setCustomers(customersData || []);
      setSalesPersons(personsData || []);
      setProducts(productsData || []);
      setLocalProducts(productsData || []);
      setFilteredProducts(productsData || []);
    } catch (error) {
      console.error("[usePosMasterData] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const fresh = await refreshProductCache();
      setLocalProducts(fresh);
      setProducts(fresh);
      setFilteredProducts(fresh);
      return fresh;
    } catch (error) {
      console.error("[usePosMasterData] Failed to refresh products:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    loading,
    customers,
    salesPersons,
    products,
    localProducts,
    filteredProducts,
    setFilteredProducts,
    refreshProducts,
    reloadMasterData: loadInitialData,
  };
}