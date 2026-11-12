// hooks/pos/usePosSaleLoader.js
import { useEffect } from "react";
import { notify } from "../../utils/notify";

/**
 * usePosSaleLoader
 * Loads sales/returns into the POS cart for editing or return processing.
 *
 * KEY FLAG:
 *   setEditingReturnId(returnId | null) tells the parent whether we are
 *   editing an existing return (has ID) or creating a new one (null).
 */
export function usePosSaleLoader({
  customers,
  salesPersons,
  products,
  setIsEditing,
  setMode,
  setFoundSale,
  setReturnLoaded,
  setIsManualReturn,
  setSaleData,
  setSelectedCustomer,
  setSelectedSalesPerson,
  setCartItems,
  calculateTotals,
  setEditingReturnId, // ✅ NEW
}) {
  // ─────────────────────────────────────────
  // Product helpers
  // ─────────────────────────────────────────
  const getProductName = (productId) =>
    products.find((p) => p.productId === productId)?.name ||
    `Product ${productId}`;

  const getProductCode = (productId) =>
    products.find((p) => p.productId === productId)?.code || `P-${productId}`;

  const getProductRetailPrice = (productId) =>
    products.find((p) => p.productId === productId)?.retailPrice || 0;

  // ─────────────────────────────────────────
  // Load sale for EDIT
  // ─────────────────────────────────────────
  const loadSaleForEdit = (sale) => {
    setIsEditing(true);
    setMode("sale");
    setFoundSale(null);
    setReturnLoaded(false);
    setEditingReturnId?.(null); // ✅ Not editing a return

    const items = (sale.details || []).map((item) => ({
      ...item,
      productName: item.productName || getProductName(item.productId),
      productCode: item.productCode || getProductCode(item.productId),
      retailPrice: item.retailPrice || getProductRetailPrice(item.productId),
      rowState: "Original",
      isVoid: false,
      isReturn: false,
      maxReturn: 0,
      returnQty: 0,
      itemType: "sale",
    }));

    setSaleData({
      saleId: sale.saleId,
      invoiceNumber: sale.invoiceNumber || "",
      customerId: sale.customerId || "",
      salesPersonId: sale.salesPersonId || "",
      saleDate: sale.saleDate || new Date().toISOString(),
      subTotal: sale.subTotal || 0,
      discount: sale.discount || 0,
      tax: sale.tax || 0,
      total: sale.total || 0,
      paidAmount: sale.paidAmount || 0,
      remainingAmount: sale.remainingAmount || 0,
      paymentMethod: sale.paymentMethod || "Cash",
      status: sale.status || "Completed",
      comments: sale.comments || "",
      details: [],
    });

    if (sale.customerId) {
      const customer = customers.find((c) => c.customerId === sale.customerId);
      if (customer) setSelectedCustomer(customer);
    }

    if (sale.salesPersonId) {
      const person = salesPersons.find(
        (p) => p.salesPersonId === sale.salesPersonId
      );
      if (person) setSelectedSalesPerson(person);
    }

    setCartItems(items);
    calculateTotals(items);
    notify.success(`Sale ${sale.invoiceNumber} loaded for editing`);
  };

  // ─────────────────────────────────────────
  // Load sale for RETURN (creating a new return)
  // ─────────────────────────────────────────
  const loadSaleForReturn = (sale) => {
    setMode("return");
    setFoundSale(sale);
    setReturnLoaded(true);
    setIsManualReturn(false);
    setIsEditing(false);
    setEditingReturnId?.(null); // ✅ Creating NEW return (not editing existing)

    setSaleData({
      saleId: sale.saleId,
      invoiceNumber: `RET-${sale.invoiceNumber}`,
      customerId: sale.customerId || "",
      salesPersonId: sale.salesPersonId || "",
      saleDate: new Date().toISOString(),
      subTotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentMethod: "Cash",
      status: "Return",
      comments: `Return for ${sale.invoiceNumber}`,
      details: [],
    });

    if (sale.customerId) {
      const customer = customers.find((c) => c.customerId === sale.customerId);
      if (customer) setSelectedCustomer(customer);
    }

    if (sale.salesPersonId) {
      const person = salesPersons.find(
        (p) => p.salesPersonId === sale.salesPersonId
      );
      if (person) setSelectedSalesPerson(person);
    }

    if (sale.details && sale.details.length > 0) {
      // ✅ Load invoice items as SALE type (locked until user clicks badge)
      const returnItems = sale.details.map((item) => {
        const qtyBought = Number(item.quantity) || 0;
        const price =
          Number(item.retailPrice) ||
          getProductRetailPrice(item.productId) ||
          0;

        return {
          saleDetailId: item.saleDetailId || 0,
          productId: item.productId,
          productName: item.productName || getProductName(item.productId),
          productCode: item.productCode || getProductCode(item.productId),
          retailPrice: price,

          quantity: qtyBought,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: item.total || qtyBought * price,

          rowState: "Added",
          isVoid: false,

          // ✅ Sale type on load — user must toggle to return
          isReturn: false,
          itemType: "sale",

          // ✅ Return ceiling info
          maxReturn: qtyBought,
          returnQty: 0,
          originalQty: qtyBought,
          isFromOriginalInvoice: true,
        };
      });

      setCartItems(returnItems);
      calculateTotals(returnItems);
    }

    notify.success(`Return loaded for ${sale.invoiceNumber}`);
  };

  // ─────────────────────────────────────────
  // Load RETURN for EDIT (editing an existing return)
  // ─────────────────────────────────────────
  const loadReturnForEdit = (returnData) => {
    setMode("return");
    setReturnLoaded(true);
    setIsManualReturn(
      returnData.isManualReturn === true || returnData.isManualReturn === 1
    );
    setIsEditing(true);
    setFoundSale(null);

    // ✅ CRITICAL: set the return's own primary key
    const returnId =
      returnData.salesReturnId ??
      returnData.SalesReturnId ??
      returnData.saleReturnId ??
      null;

    setEditingReturnId?.(returnId);

    setSaleData({
      saleId: returnData.saleId || null,
      invoiceNumber: returnData.returnNumber || `RET-${Date.now()}`,
      customerId: returnData.customerId || "",
      salesPersonId: null,
      saleDate: returnData.returnDate || new Date().toISOString(),
      subTotal: 0,
      discount: 0,
      tax: 0,
      total: returnData.total || 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentMethod: "Cash",
      status: "Return",
      comments: returnData.comments || "Editing return",
      details: [],
    });

    if (returnData.customerId) {
      const customer = customers.find(
        (c) => c.customerId === returnData.customerId
      );
      if (customer) setSelectedCustomer(customer);
    }

    if (returnData.details && returnData.details.length > 0) {
      const items = returnData.details.map((item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.retailPrice) || 0;

        return {
          saleDetailId: item.saleDetailId || 0,
          productId: item.productId,
          productName: getProductName(item.productId) || item.productName,
          productCode: getProductCode(item.productId) || item.productCode,
          retailPrice: price,
          quantity: -qty,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: -(item.total || qty * price),
          rowState: "Original",
          isVoid: false,
          isReturn: true,
          itemType: "return",
          maxReturn: qty,
          returnQty: qty,
          originalQty: qty,
          isFromOriginalInvoice: !!returnData.saleId,
        };
      });

      setCartItems(items);
      calculateTotals(items);
    }

    notify.success(`Return ${returnData.returnNumber} loaded for editing`);
  };

  // ─────────────────────────────────────────
  // Session restore
  // ─────────────────────────────────────────
  useEffect(() => {
    const editJson = sessionStorage.getItem("editSaleData");
    const returnJson = sessionStorage.getItem("returnSaleData");
    const editReturnJson = sessionStorage.getItem("editReturnData");

    if (editJson) {
      try {
        loadSaleForEdit(JSON.parse(editJson));
        sessionStorage.removeItem("editSaleData");
      } catch (e) {
        console.error("Error loading edit data:", e);
        sessionStorage.removeItem("editSaleData");
      }
    } else if (returnJson) {
      try {
        loadSaleForReturn(JSON.parse(returnJson));
        sessionStorage.removeItem("returnSaleData");
      } catch (e) {
        console.error("Error loading return data:", e);
        sessionStorage.removeItem("returnSaleData");
      }
    } else if (editReturnJson) {
      try {
        loadReturnForEdit(JSON.parse(editReturnJson));
        sessionStorage.removeItem("editReturnData");
      } catch (e) {
        console.error("Error loading return edit data:", e);
        sessionStorage.removeItem("editReturnData");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, salesPersons, products]);

  return {
    loadSaleForEdit,
    loadSaleForReturn,
    loadReturnForEdit,
  };
}