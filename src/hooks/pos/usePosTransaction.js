// hooks/pos/usePosTransaction.js
import {
  createSale,
  getSaleById,
  updateSale,
} from "../../services/SaleDefinition/saleService";
import {
  createSalesReturn,
  updateSalesReturn,
} from "../../services/SaleReturnDefinition/salesReturnService";
import { notify } from "../../utils/notify";
import { offlineQueue } from "../../services/indexdb/offlineQueue";
import { adjustProductStockInCache } from "../../services/ProductDefinition/productService";
import { useAuth } from "../auth/useAuth";
import { getAuthTenantId } from "../../utils/authTenant";

export function usePosTransaction({
  mode,
  isEditing,
  foundSale,
  saleData,
  setSaleData,
  cartItems,
  selectedCustomer,
  selectedSalesPerson,
  resetAll,
  setCompletedSale,
  setShowInvoiceModal,
  setConfirmState,
  editingReturnId,
  products = [],
}) {
  const { user } = useAuth();
  const tenantId = getAuthTenantId(user);

  // ─────────────────────────────────────────
  // Entry point
  // ─────────────────────────────────────────
  const processTransaction = (paymentMethod = "Cash", skipConfirm = false) => {
    if (mode === "return") {
      return processReturn();
    }
    return processSale(paymentMethod, skipConfirm);
  };

  // ─────────────────────────────────────────
  // Process SALE
  // ─────────────────────────────────────────
  const processSale = (paymentMethod, skipConfirm = false) => {
    const saleItems = cartItems.filter(
      (i) => !i.isVoid && i.itemType !== "return" && i.quantity > 0
    );

    if (saleItems.length === 0) {
      notify.warning("Please add at least one product");
      return;
    }

    // Update the payment method in state
    setSaleData((prev) => ({ ...prev, paymentMethod }));

    // ✅ If skipConfirm is true (from Cash, Digital, or Udhaar modal), save immediately
    if (skipConfirm) {
      saveSale(paymentMethod);
      return;
    }

    // For standard flow (e.g. keyboard shortcut), still show the confirmation dialog
    setConfirmState({
      isOpen: true,
      type: "processSale",
      payload: paymentMethod,
    });
  };

 // ─────────────────────────────────────────
  // Save SALE
  // ─────────────────────────────────────────
  const saveSale = async (overridePaymentMethod = null) => {
    try {
      const saleItems = cartItems.filter(
        (i) => !i.isVoid && i.itemType !== "return" && i.quantity > 0
      );

      const finalPaymentMethod = overridePaymentMethod || saleData.paymentMethod || "Cash";
      const isCredit = finalPaymentMethod === "Credit";
      const totalNum = Number(saleData.total);

      const saleToSave = {
        ...saleData,
        saleDate: isEditing ? saleData.saleDate : new Date().toISOString(),
        customerId: saleData.customerId ? Number(saleData.customerId) : null,
        salesPersonId: saleData.salesPersonId ? Number(saleData.salesPersonId) : null,
        subTotal: Number(saleData.subTotal),
        discount: Number(saleData.discount),
        tax: Number(saleData.tax),
        total: totalNum,
        paidAmount: isCredit ? 0 : (Number(saleData.paidAmount) || totalNum),
        remainingAmount: isCredit ? totalNum : 0,
        status: "Completed",
        paymentMethod: finalPaymentMethod,
        details: saleItems.map((i) => ({
          saleDetailId: i.saleDetailId || 0,
          productId: Number(i.productId),
          productName: i.productName,
          productCode: i.productCode,
          quantity: Number(i.quantity),
          retailPrice: Number(i.retailPrice),
          discount: Number(i.discount) || 0,
          tax: Number(i.tax) || 0,
          total: Number(i.total),
          rowState: i.rowState || "Added",
        })),
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const pendingCount = await offlineQueue.add(saleToSave, tenantId);
        notify.warning(
          `Offline: Sale saved locally (${pendingCount} pending sync)`
        );
        if (!isEditing) {
          adjustProductStockInCache(
            saleToSave.details.map((item) => ({
              productId: item.productId,
              quantity: -item.quantity,
            }))
          ).catch((error) => {
            console.error("Unable to update cached stock for offline sale:", error);
          });
        }

        const offlineResponse = {
          saleId: "OFFLINE",
          invoiceNumber: saleToSave.invoiceNumber,
        };
        const completed = {
          ...saleToSave,
          saleId: offlineResponse.saleId,
          customerName: selectedCustomer?.name || "Walk-in",
          salesPersonName: selectedSalesPerson?.name || "-",
          details: saleItems,
          isReturn: false,
        };

        setCompletedSale(completed);
        setShowInvoiceModal(true);
        return;
      }

 let response;
      if (isEditing && saleData.saleId) {
        response = await updateSale(saleData.saleId, saleToSave);
        notify.success("Sale updated");
      } else {
        response = await createSale(saleToSave);
        notify.success(isCredit ? "Udhaar recorded successfully" : "Sale completed");
        if (!isEditing) {
          try {
            await adjustProductStockInCache(
              saleToSave.details.map((item) => ({
                productId: item.productId,
                quantity: -item.quantity,
              }))
            );
          } catch (error) {
            console.error("Unable to update cached stock after sale:", error);
          }
        }
      }

     let invoiceNumber =
       response?.invoiceNumber ??
       response?.InvoiceNumber ??
       response?.invoiceNo ??
       response?.InvoiceNo ??
       saleToSave.invoiceNumber;
      const responseSaleId =
        response?.saleId ??
        response?.SaleId ??
        response?.id ??
        response?.Id;
      const saleId =
        responseSaleId ??
        (typeof response === "number" || typeof response === "string"
          ? response
          : saleToSave.saleId);

      if (
        !invoiceNumber &&
        !isEditing &&
        (typeof saleId === "number" || typeof saleId === "string")
      ) {
        try {
          const savedSale = await getSaleById(saleId);
          invoiceNumber =
            savedSale?.invoiceNumber ??
            savedSale?.InvoiceNumber ??
            savedSale?.invoiceNo ??
            savedSale?.InvoiceNo ??
            invoiceNumber;
        } catch (error) {
          console.error("Sale saved, but its invoice number could not be loaded:", error);
          notify.warning("Sale saved, but its invoice number could not be loaded");
        }
      }

     const completed = {
        ...saleToSave,
        saleId: saleId || saleToSave.saleId,
        invoiceNumber,
        customerName: selectedCustomer?.name || "Walk-in",
        salesPersonName: selectedSalesPerson?.name || "-",
        details: saleItems,
        isReturn: false,
      };
      setSaleData((prev) => ({
        ...prev,
        saleId: completed.saleId,
        invoiceNumber: completed.invoiceNumber,
      }));
      setCompletedSale(completed);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error("Error saving sale:", error);
      notify.error("Failed to save sale");
    }
  };

  // ─────────────────────────────────────────
  // Process RETURN / EXCHANGE
  // ─────────────────────────────────────────
  const processReturn = async () => {
    let returnSaved = false;
    let exchangeSaved = false;
    try {
      const returnItems = cartItems.filter(
        (i) => !i.isVoid && i.itemType === "return" && i.returnQty > 0
      );
      const exchangeItems = cartItems.filter(
        (i) => !i.isVoid && i.itemType === "exchange" && i.quantity > 0
      );

      if (returnItems.length === 0 && exchangeItems.length === 0) {
        notify.info("No items to process");
        return;
      }
      if (exchangeItems.length > 0 && returnItems.length === 0) {
        notify.warning("Select an item from the original invoice to return before adding exchange items.");
        return;
      }

      const invalidReturnItem = returnItems.find(
        (item) =>
          item.returnQty > (item.maxReturn ?? 999) ||
          item.returnQty <= 0 ||
          !Number.isFinite(Number(item.retailPrice)) ||
          Number(item.retailPrice) < 0
      );
      if (invalidReturnItem) {
        notify.warning(
          `Return quantity for ${invalidReturnItem.productName || "an item"} is invalid or exceeds the remaining eligible quantity.`
        );
        return;
      }

      let returnResponse = null;
      let saleResponse = null;

      // ── RETURN ──
      if (returnItems.length > 0) {
        const getReturnDiscount = (item) =>
          Math.max(0, Number(item.discount) || 0);
        const getReturnLineTotal = (item) =>
          Math.max(
            0,
            item.returnQty * Number(item.retailPrice) -
              getReturnDiscount(item)
          );
        const returnTotal = returnItems.reduce(
          (sum, item) => sum + getReturnLineTotal(item),
          0
        );
        const returnData = {
          returnNumber: saleData.invoiceNumber,
          saleId: foundSale?.saleId || null,
          customerId: saleData.customerId
            ? Number(saleData.customerId)
            : null,
          returnDate: new Date().toISOString(),
          total: returnTotal,
          comments:
            saleData.comments ||
            (foundSale
              ? `Return for ${foundSale.invoiceNumber}`
              : "Manual return"),
          createdBy: null,
          isManualReturn: foundSale ? false : true,
          originalInvoiceNumber: foundSale?.invoiceNumber || null,
          returnType: exchangeItems.length > 0 ? "Exchange" : "Return",
          exchangeSaleId: null,
          returnReason: saleData.comments || "Customer return",
          details: returnItems.map((i) => {
            const p = products.find((x) => x.productId === i.productId);
            return {
              productId: Number(i.productId),
              productName: i.productName || p?.name || "",
              productCode: i.productCode || p?.code || "",
              quantity: i.returnQty,
              retailPrice: Number(i.retailPrice),
              discount: getReturnDiscount(i),
              tax: Number(i.tax) || 0,
              total: getReturnLineTotal(i),
              reason: saleData.comments || "Return",
            };
          }),
        };

        if (editingReturnId) {
          returnResponse = await updateSalesReturn(editingReturnId, returnData);
        } else {
          returnResponse = await createSalesReturn(returnData);
          returnSaved = true;
          try {
            await adjustProductStockInCache(
              returnData.details.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              }))
            );
          } catch (error) {
            console.error(
              "Unable to update cached stock after return:",
              error
            );
            notify.warning(
              "Return was saved, but cached stock could not be refreshed."
            );
          }
        }
      }

      // ── EXCHANGE ──
      if (exchangeItems.length > 0) {
        const saleToSave = {
          invoiceNumber: saleData.invoiceNumber,
          customerId: saleData.customerId ? Number(saleData.customerId) : null,
          salesPersonId: saleData.salesPersonId ? Number(saleData.salesPersonId) : null,
          saleDate: new Date().toISOString(),
          subTotal: exchangeItems.reduce((sum, i) => sum + i.quantity * i.retailPrice, 0),
          discount: exchangeItems.reduce((sum, i) => sum + (i.discount || 0), 0),
          tax: exchangeItems.reduce((sum, i) => sum + (i.tax || 0), 0),
          total: exchangeItems.reduce((sum, i) => sum + (i.quantity * i.retailPrice - (i.discount || 0)), 0),
          status: "Completed",
          paymentMethod: "Exchange",
          comments: saleData.comments || "Exchange transaction",
          details: exchangeItems.map((i) => {
            const p = products.find((x) => x.productId === i.productId);
            return {
              productId: Number(i.productId),
              productName: i.productName || p?.name || "",
              productCode: i.productCode || p?.code || "",
              quantity: Number(i.quantity),
              retailPrice: Number(i.retailPrice),
              discount: Number(i.discount) || 0,
              tax: Number(i.tax) || 0,
              total: Number(i.quantity * i.retailPrice - (i.discount || 0)),
              rowState: "Added",
            };
          }),
        };

        saleResponse = await createSale(saleToSave);
        exchangeSaved = true;
        try {
          await adjustProductStockInCache(
            saleToSave.details.map((item) => ({
              productId: item.productId,
              quantity: -item.quantity,
            }))
          );
        } catch (error) {
          console.error(
            "Unable to update cached stock after exchange sale:",
            error
          );
          notify.warning(
            "Exchange sale was saved, but cached stock could not be refreshed."
          );
        }
      }

      // ── Summary toast ──
      const returnTotal = returnItems.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            item.returnQty * Number(item.retailPrice) -
              Math.max(0, Number(item.discount) || 0)
          ),
        0
      );
      const exchangeTotal = exchangeItems.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            item.quantity * Number(item.retailPrice) -
              (Number(item.discount) || 0)
          ),
        0
      );
      const diff = exchangeTotal - returnTotal;

      let msg = "Transaction completed\n";
      if (returnItems.length > 0) {
        msg += `Return Value: PKR ${returnTotal.toFixed(2)}\n`;
        msg += `Return #: ${returnResponse?.returnNumber || "N/A"}\n`;
        msg += `Return Type: ${foundSale ? "With Invoice" : "Manual"}\n`;
      }
      if (exchangeItems.length > 0) {
        msg += `Exchange Items: PKR ${exchangeTotal.toFixed(2)}\n`;
        msg += `Sale #: ${saleResponse?.invoiceNumber || "N/A"}\n`;
      }
      if (returnItems.length > 0 && exchangeItems.length > 0) {
        msg += `${diff > 0 ? "Amount to Pay" : "Refund Amount"}: PKR ${Math.abs(diff).toFixed(2)}\n`;
      }

      notify.success(msg);

      // ── Receipt ──
      const receiptData = {
        invoiceNumber:
          returnResponse?.returnNumber ??
          returnResponse?.ReturnNumber ??
          returnResponse?.returnNo ??
          returnResponse?.ReturnNo ??
          saleData.invoiceNumber,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        salesPersonName: selectedSalesPerson?.name || "-",
        details: [
          ...returnItems.map((item) => ({
            ...item,
            productName: `Return: ${item.productName}`,
            type: "Return",
          })),
          ...exchangeItems.map((item) => ({
            ...item,
            productName: `Exchange: ${item.productName}`,
            type: "Exchange",
          })),
        ],
        isReturn: returnItems.length > 0,
        isExchange: exchangeItems.length > 0,
        returnTotal,
        exchangeTotal,
        difference: diff,
        originalInvoice: foundSale?.invoiceNumber || "N/A",
        originalInvoiceNumber: foundSale?.invoiceNumber || "",
        returnDate: new Date().toISOString(),
        subTotal: returnTotal,
        discount: 0,
        tax: 0,
        total: Math.abs(diff),
        paidAmount: Math.max(0, returnTotal - exchangeTotal),
        remainingAmount: Math.max(0, exchangeTotal - returnTotal),
        paymentMethod: "Refund / Exchange",
        returnNumber: returnResponse?.returnNumber || "N/A",
        isManualReturn: !foundSale,
      };

      setCompletedSale(receiptData);
      setShowInvoiceModal(true);
      resetAll();
    } catch (error) {
      console.error("Transaction failed:", error);
      if (returnSaved || exchangeSaved) {
        const savedRecords = [
          returnSaved ? "the return" : null,
          exchangeSaved ? "the exchange sale" : null,
        ]
          .filter(Boolean)
          .join(" and ");
        notify.error(
          `${savedRecords} were saved, but the full exchange could not be completed. Do not retry this transaction; verify the saved records first.`
        );
        resetAll();
      } else {
        notify.error(`Transaction failed: ${error.message}`);
      }
    }
  };

  // ─────────────────────────────────────────
  // HOLD SALE
  // ─────────────────────────────────────────
  const handleHold = () => {
    const activeItems = cartItems.filter(
      (i) => !i.isVoid && i.itemType === "sale" && i.quantity > 0
    );
    if (activeItems.length === 0) {
      notify.warning("No items to hold");
      return;
    }
    setConfirmState({ isOpen: true, type: "hold" });
  };

  const confirmHold = async () => {
    try {
      const activeItems = cartItems.filter(
        (i) => !i.isVoid && i.itemType === "sale" && i.quantity > 0
      );

      const saleToSave = {
        ...saleData,
        customerId: saleData.customerId ? Number(saleData.customerId) : null,
        salesPersonId: saleData.salesPersonId ? Number(saleData.salesPersonId) : null,
        subTotal: Number(saleData.subTotal),
        discount: Number(saleData.discount),
        tax: Number(saleData.tax),
        total: Number(saleData.total),
        paidAmount: 0,
        remainingAmount: Number(saleData.total),
        status: "Draft",
        paymentMethod: saleData.paymentMethod || "Cash",
        details: activeItems.map((i) => ({
          saleDetailId: i.saleDetailId || 0,
          productId: Number(i.productId),
          productName: i.productName,
          productCode: i.productCode,
          quantity: Number(i.quantity),
          retailPrice: Number(i.retailPrice),
          discount: Number(i.discount) || 0,
          tax: Number(i.tax) || 0,
          total: Number(i.total),
          rowState: i.rowState || "Added",
        })),
      };

      await createSale(saleToSave);
      notify.success(`Sale held — ${saleData.invoiceNumber}`);
      resetAll();
    } catch (error) {
      console.error("Error holding sale:", error);
      notify.error("Failed to hold sale");
    } finally {
      setConfirmState({ isOpen: false, type: null, payload: null });
    }
  };

  return {
    processTransaction,
    processSale,
    saveSale,
    processReturn,
    handleHold,
    confirmHold,
  };
}