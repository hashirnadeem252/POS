// hooks/pos/usePosSaleLoader.js
import { useEffect } from "react";
import { notify } from "../../utils/notify";
import { getSaleById } from "../../services/SaleDefinition/saleService";
import { getSalesReturnsBySaleId } from "../../services/SaleReturnDefinition/salesReturnService";

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

  const getInvoiceNumber = (sale) =>
    sale.invoiceNumber ?? sale.InvoiceNumber ?? sale.invoiceNo ?? sale.InvoiceNo ?? "";

  // ─────────────────────────────────────────
  // Load sale for EDIT
  // ─────────────────────────────────────────
  const loadSaleForEdit = (sale) => {
    const invoiceNumber = getInvoiceNumber(sale);
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
      invoiceNumber,
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
    calculateTotals(items, "sale");
    notify.success(`Sale ${invoiceNumber} loaded for editing`);
  };

  // ─────────────────────────────────────────
  // Load sale for RETURN (creating a new return)
  // ─────────────────────────────────────────
  const loadSaleForReturn = async (sale) => {
    if (!sale?.saleId) {
      throw new Error("This sale is missing its ID and cannot be returned.");
    }

    const [saleResponse, returnsResponse] = await Promise.all([
      Array.isArray(sale.details) ? Promise.resolve(sale) : getSaleById(sale.saleId),
      getSalesReturnsBySaleId(sale.saleId),
    ]);
    const completeSale = {
      ...sale,
      ...saleResponse,
      details: saleResponse?.details ?? sale.details,
    };
    if (String(completeSale.status || "").toLowerCase() !== "completed") {
      throw new Error("Only completed sales can be returned.");
    }
    if (!Array.isArray(completeSale.details)) {
      throw new Error("The sale items could not be loaded.");
    }
    if (returnsResponse != null && !Array.isArray(returnsResponse)) {
      throw new Error("The sale return history was not in the expected format.");
    }

    const returnedByProduct = new Map();
    (returnsResponse || []).forEach((salesReturn) => {
      (salesReturn.details || []).forEach((item) => {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity) || 0;
        if (Number.isFinite(productId) && quantity > 0) {
          returnedByProduct.set(
            productId,
            (returnedByProduct.get(productId) || 0) + quantity
          );
        }
      });
    });

    const invoiceNumber = getInvoiceNumber(completeSale);
    setMode("return");
    setFoundSale(completeSale);
    setReturnLoaded(true);
    setIsManualReturn(false);
    setIsEditing(false);
    setEditingReturnId?.(null); // ✅ Creating NEW return (not editing existing)

    setSaleData((current) => ({
      ...current,
      saleId: completeSale.saleId,
      invoiceNumber: `RET-${Date.now()}`,
      customerId: completeSale.customerId || "",
      salesPersonId: completeSale.salesPersonId || "",
      saleDate: new Date().toISOString(),
      subTotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentMethod: "Cash",
      status: "Return",
      comments: `Return for ${invoiceNumber}`,
      details: [],
    }));

    const customer = completeSale.customerId
      ? customers.find(
          (item) => Number(item.customerId) === Number(completeSale.customerId)
        )
      : null;
    setSelectedCustomer(customer || null);

    if (completeSale.salesPersonId) {
      const person = salesPersons.find(
        (p) => Number(p.salesPersonId) === Number(completeSale.salesPersonId)
      );
      setSelectedSalesPerson(person || null);
    } else {
      setSelectedSalesPerson(null);
    }

    if (completeSale.details.length > 0) {
      // ✅ Load invoice items as SALE type (locked until user clicks badge)
      const availableByProduct = new Map();
      completeSale.details.forEach((item) => {
        const productId = Number(item.productId);
        availableByProduct.set(
          productId,
          (availableByProduct.get(productId) || 0) +
            (Number(item.quantity) || 0)
        );
      });
      returnedByProduct.forEach((quantity, productId) => {
        availableByProduct.set(
          productId,
          Math.max(0, (availableByProduct.get(productId) || 0) - quantity)
        );
      });

      const returnItems = completeSale.details.map((item) => {
        const qtyBought = Number(item.quantity) || 0;
        const productId = Number(item.productId);
        const availableQty = Math.min(
          qtyBought,
          availableByProduct.get(productId) || 0
        );
        availableByProduct.set(
          productId,
          Math.max(
            0,
            (availableByProduct.get(productId) || 0) - availableQty
          )
        );
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
          originalDiscount: Number(item.discount) || 0,

          rowState: "Added",
          isVoid: false,

          // ✅ Sale type on load — user must toggle to return
          isReturn: false,
          itemType: "sale",

          // ✅ Return ceiling info
          maxReturn: availableQty,
          returnQty: 0,
          originalQty: qtyBought,
          isFromOriginalInvoice: true,
        };
      });

      setCartItems(returnItems);
      calculateTotals(returnItems, "return");
    } else {
      setCartItems([]);
      calculateTotals([], "return");
    }

    notify.success(`Return loaded for ${invoiceNumber}`);
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
      calculateTotals(items, "return");
    }

    notify.success(`Return ${returnData.returnNumber} loaded for editing`);
  };

  // ─────────────────────────────────────────
  // Session restore
  // ─────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const editJson = sessionStorage.getItem("editSaleData");
      const returnJson = sessionStorage.getItem("returnSaleData");
      const editReturnJson = sessionStorage.getItem("editReturnData");

      if (editJson) {
        sessionStorage.removeItem("editSaleData");
        try {
          loadSaleForEdit(JSON.parse(editJson));
        } catch (error) {
          console.error("Error loading edit data:", error);
        }
      } else if (returnJson) {
        sessionStorage.removeItem("returnSaleData");
        try {
          await loadSaleForReturn(JSON.parse(returnJson));
        } catch (error) {
          console.error("Error loading return data:", error);
        }
      } else if (editReturnJson) {
        sessionStorage.removeItem("editReturnData");
        try {
          loadReturnForEdit(JSON.parse(editReturnJson));
        } catch (error) {
          console.error("Error loading return edit data:", error);
        }
      }
    };

    void restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, salesPersons, products]);

  return {
    loadSaleForEdit,
    loadSaleForReturn,
    loadReturnForEdit,
  };
}