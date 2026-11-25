// hooks/pos/usePosCart.js
import { useState, useCallback, useEffect } from "react";
import { notify } from "../../utils/notify";

export function usePosCart({
  mode,
  foundSale,
  isManualReturn,
  products,
  setSaleData,
}) {
  const [cartItems, setCartItems] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const calculateTotals = useCallback((items, transactionMode = mode) => {
    const active = items.filter(
      (item) =>
        !item.isVoid &&
        (transactionMode === "sale" || item.itemType !== "sale")
    );
    let subTotal = 0;
    let discount = 0;
    let tax = 0;

    active.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.retailPrice) || 0;
      const itemDiscount = Number(item.discount) || 0;
      const taxRate = Number(item.tax) || 0; // The tax percentage
      const isReturn = item.itemType === "return";

      const lineTotal = isReturn
        ? qty * price + itemDiscount
        : qty * price - itemDiscount;
      let lineTax = 0;
      let lineNet = lineTotal;

      if (taxRate > 0) {
        lineTax = lineTotal - (lineTotal / (1 + (taxRate / 100)));
        lineNet = lineTotal - lineTax;
      }

      subTotal += lineNet;
      discount += isReturn ? -itemDiscount : itemDiscount;
      tax += lineTax;
    });

    subTotal = Number(subTotal.toFixed(2));
    discount = Number(discount.toFixed(2));
    tax = Number(tax.toFixed(2));
    const total = Number((subTotal + tax).toFixed(2));

    setSaleData((prev) => {
      return {
        ...prev,
        subTotal,
        discount,
        tax,
        total,
        remainingAmount:
          transactionMode === "sale"
            ? Number(
                Math.max(0, total - (Number(prev.paidAmount) || 0)).toFixed(2)
              )
            : 0,
        details: active,
      };
    });
  }, [mode, setSaleData]);

  useEffect(() => {
    calculateTotals(cartItems);
  }, [cartItems, calculateTotals]);

  // ─────────────────────────────────────────
  // Add product (sale or return mode)
  // ─────────────────────────────────────────
  const addProductToCart = useCallback(
    (product, asReturn = false) => {
      if (mode === "sale") {
        const availableStock = Number(product.currentStock) || 0;
        if (availableStock <= 0) {
          notify.warning(`${product.name} is out of stock`);
          return;
        }

        setCartItems((prev) => {
          const existingIndex = prev.findIndex(
            (item) => item.productId === product.productId && !item.isReturn
          );

          if (existingIndex !== -1) {
            const item = prev[existingIndex];
            const newQty = (item.quantity || 0) + 1;

            if (newQty > availableStock) {
              notify.warning(`Only ${availableStock} items available`);
              return prev;
            }

            const newItem = {
              ...item,
              quantity: newQty,
              total: newQty * item.retailPrice - (item.discount || 0),
              rowState: "Modified",
            };

            const updated = [...prev];
            updated[existingIndex] = newItem;
            return updated;
          }

          const newItem = {
            saleDetailId: 0,
            productId: product.productId,
            productName: product.name,
            productCode: product.code,
            retailPrice: product.retailPrice || 0,
            discount: 0,
            tax: product.taxPercentage || 0,
            rowState: "Added",
            isVoid: false,
            isReturn: false,
            itemType: "sale",
            quantity: 1,
            total: product.retailPrice || 0,
          };

          return [...prev, newItem];
        });

        setSelectedProductIds((prev) =>
          prev.includes(product.productId)
            ? prev
            : [...prev, product.productId]
        );
        return;
      }

      if (mode === "return") {
        const isFromOriginalInvoice = foundSale
          ? foundSale.details?.some(
              (detail) =>
                Number(detail.productId) === Number(product.productId)
            )
          : false;

        const defaultAsReturn = isFromOriginalInvoice ? true : false;
        const actualAsReturn = isManualReturn
          ? true
          : asReturn ?? defaultAsReturn;

        let maxReturn = 999;
        if (foundSale && isFromOriginalInvoice) {
          const originalItem = foundSale.details.find(
            (detail) =>
              Number(detail.productId) === Number(product.productId)
          );
          maxReturn = originalItem?.quantity ?? 0;
        }

        setCartItems((prev) => {
          const existingIndex = prev.findIndex(
            (item) => item.productId === product.productId
          );

          if (existingIndex !== -1) {
            const item = prev[existingIndex];

            if (actualAsReturn) {
              const newQty = (item.returnQty || 0) + 1;
              if (newQty > (item.maxReturn ?? 999)) {
                notify.warning(`Maximum return quantity is ${item.maxReturn}`);
                return prev;
              }
              const originalQty =
                Number(item.originalQty) || Number(item.maxReturn) || newQty;
              const originalDiscount =
                Number(item.originalDiscount ?? item.discount) || 0;
              const proratedDiscount =
                originalQty > 0
                  ? (originalDiscount * newQty) / originalQty
                  : 0;

              const newItem = {
                ...item,
                returnQty: newQty,
                quantity: -newQty,
                discount: proratedDiscount,
                total: -(newQty * item.retailPrice - proratedDiscount),
                rowState: "Modified",
                isReturn: true,
                itemType: "return",
              };

              const updated = [...prev];
              updated[existingIndex] = newItem;
              return updated;
            } else {
              const newQty = (item.quantity || 0) + 1;
              const stock =
                Number(
                  products.find((p) => p.productId === product.productId)
                    ?.currentStock
                ) || 0;
              if (newQty > stock) {
                notify.warning(`Only ${stock} items available`);
                return prev;
              }

              const newItem = {
                ...item,
                quantity: newQty,
                total: newQty * item.retailPrice - (item.discount || 0),
                rowState: "Modified",
                isReturn: false,
                itemType: "exchange",
              };

              const updated = [...prev];
              updated[existingIndex] = newItem;
              return updated;
            }
          }

          let newItemType = "return";
          let isReturn = true;
          let qty = -1;
          let total = -(product.retailPrice || 0);
          let maxQty = isManualReturn ? 999 : maxReturn;

          if (foundSale && !isFromOriginalInvoice) {
            const availableStock = Number(product.currentStock) || 0;
            if (availableStock < 1) {
              notify.warning(`${product.name} is out of stock`);
              return prev;
            }
            newItemType = "exchange";
            isReturn = false;
            qty = 1;
            total = product.retailPrice || 0;
            maxQty = availableStock;
          }

          const newItem = {
            saleDetailId: 0,
            productId: product.productId,
            productName: product.name,
            productCode: product.code,
            retailPrice: product.retailPrice || 0,
            discount: 0,
            tax: product.taxPercentage || 0,
            rowState: "Added",
            isVoid: false,
            isReturn,
            isFromOriginalInvoice,
            itemType: newItemType,
            maxReturn: maxQty,
            returnQty: isReturn ? 1 : 0,
            quantity: qty,
            total,
          };

          return [...prev, newItem];
        });

        setSelectedProductIds((prev) =>
          prev.includes(product.productId)
            ? prev
            : [...prev, product.productId]
        );
      }
    },
    [mode, foundSale, isManualReturn, products]
  );

  // ─────────────────────────────────────────
  // Remove product entirely (used by modal deselect)
  // ─────────────────────────────────────────
  const removeProductFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  // ─────────────────────────────────────────
  // Update RETURN quantity
  // ─────────────────────────────────────────
  const updateReturnQuantity = useCallback((index, direction) => {
    setCartItems((prev) => {
      const item = prev[index];
      if (!item) return prev;

      if (item.isVoid) {
        notify.warning("Cannot edit a voided item");
        return prev;
      }

      let newQty = (item.returnQty || 0) + direction;
      if (newQty < 0) newQty = 0;

      const maxQty = item.maxReturn ?? 999;
      if (newQty > maxQty) {
        notify.warning(`Maximum return quantity is ${maxQty}`);
        return prev;
      }

      const originalQty =
        Number(item.originalQty) || Number(item.maxReturn) || newQty;
      const originalDiscount =
        Number(item.originalDiscount ?? item.discount) || 0;
      const proratedDiscount =
        originalQty > 0 ? (originalDiscount * newQty) / originalQty : 0;
      const newItem = {
        ...item,
        returnQty: newQty,
        quantity: -newQty,
        discount: proratedDiscount,
        total: -(newQty * item.retailPrice - proratedDiscount),
        rowState: newQty > 0 ? "Modified" : "Deleted",
        isReturn: true,
        itemType: "return",
      };

      const updated = [...prev];
      updated[index] = newItem;
      return updated;
    });
  }, []);

  // ─────────────────────────────────────────
  // Update EXCHANGE quantity
  // ─────────────────────────────────────────
  const updateExchangeQuantity = useCallback(
    (index, direction) => {
      setCartItems((prev) => {
        const item = prev[index];
        if (!item) return prev;

        if (item.isVoid) {
          notify.warning("Cannot edit a voided item");
          return prev;
        }

        let newQty = (item.quantity || 0) + direction;
        if (newQty < 0) newQty = 0;

        const product = products.find((p) => p.productId === item.productId);
        const stock = Number(product?.currentStock) || 0;
        if (newQty > stock) {
          notify.warning(`Only ${stock} items available`);
          return prev;
        }

        const newItem = {
          ...item,
          quantity: newQty,
          total: newQty * item.retailPrice - (item.discount || 0),
          rowState: item.rowState === "Original" ? "Modified" : item.rowState,
          isReturn: false,
          itemType: "exchange",
        };

        const updated = [...prev];
        updated[index] = newItem;
        return updated;
      });
    },
    [products]
  );

  // ─────────────────────────────────────────
  // Update SALE quantity
  // ─────────────────────────────────────────
  const updateSaleQuantity = useCallback(
    (index, direction) => {
      setCartItems((prev) => {
        const item = prev[index];
        if (!item) return prev;

        if (item.isVoid) {
          notify.warning("Cannot edit a voided item");
          return prev;
        }

        let newQty = (item.quantity || 0) + direction;
        if (newQty < 0) newQty = 0;

        const product = products.find((p) => p.productId === item.productId);
        const stock = Number(product?.currentStock) || 0;
        if (newQty > stock) {
          notify.warning(`Only ${stock} items available`);
          return prev;
        }

        const newItem = {
          ...item,
          quantity: newQty,
          total: newQty * item.retailPrice - (item.discount || 0),
          rowState: item.rowState === "Original" ? "Modified" : item.rowState,
        };

        const updated = [...prev];
        updated[index] = newItem;
        return updated;
      });
    },
    [products]
  );

  // ─────────────────────────────────────────
  // Update discount
  // ─────────────────────────────────────────
  const updateDiscount = useCallback((index, value) => {
    setCartItems((prev) => {
      const item = prev[index];
      if (!item) return prev;

      if (item.isVoid) {
        notify.warning("Cannot edit a voided item");
        return prev;
      }
      if (item.itemType === "return") return prev;

      const requestedDiscount = Number(value) || 0;
      const gross = Math.abs(
        (Number(item.quantity) || 0) * (Number(item.retailPrice) || 0)
      );
      const disc = Math.min(Math.max(0, requestedDiscount), gross);

      const newItem = {
        ...item,
        discount: disc,
        total:
          item.itemType === "return"
            ? (item.quantity || 0) * (item.retailPrice || 0) + disc
            : (item.quantity || 0) * (item.retailPrice || 0) - disc,
        rowState: item.rowState === "Original" ? "Modified" : item.rowState,
      };

      const updated = [...prev];
      updated[index] = newItem;
      return updated;
    });
  }, []);

  // ─────────────────────────────────────────
  // Void / Restore
  // ─────────────────────────────────────────
  const toggleVoid = useCallback((index) => {
    setCartItems((prev) => {
      const item = prev[index];
      if (!item) return prev;

      const isNowVoid = !item.isVoid;

      const newItem = {
        ...item,
        isVoid: isNowVoid,
        rowState: isNowVoid
          ? "Deleted"
          : item.rowState === "Deleted"
          ? "Modified"
          : item.rowState,
      };

      const updated = [...prev];
      updated[index] = newItem;
      return updated;
    });
  }, []);

  // ─────────────────────────────────────────
  // Remove item (uses void flow)
  // ─────────────────────────────────────────
  const removeItem = useCallback(
    (index) => {
      const item = cartItems[index];
      if (!item) return;

      toggleVoid(index);

      if (item.rowState === "Added" && item.saleDetailId === 0) {
        setSelectedProductIds((prev) =>
          prev.filter((id) => id !== item.productId)
        );
      }
    },
    [cartItems, toggleVoid]
  );

  // ─────────────────────────────────────────
  // Toggle return ↔ exchange
  // ─────────────────────────────────────────
  const toggleItemType = useCallback((index) => {
    setCartItems((prev) => {
      const item = prev[index];
      if (!item) return prev;

      const newType = item.itemType === "return" ? "exchange" : "return";
      if (isManualReturn) {
        notify.warning("Manual returns cannot be exchanged without an original invoice.");
        return prev;
      }
      if (
        newType === "return" &&
        (!item.isFromOriginalInvoice || (item.maxReturn ?? 0) <= 0)
      ) {
        notify.warning("Only unreturned items from the original invoice can be returned.");
        return prev;
      }
      const qty = item.returnQty || 0;
      const originalQty =
        Number(item.originalQty) || Number(item.maxReturn) || qty;
      const originalDiscount =
        Number(item.originalDiscount ?? Math.abs(Number(item.discount))) || 0;
      const proratedDiscount =
        originalQty > 0 ? (originalDiscount * qty) / originalQty : 0;

      const newItem = {
        ...item,
        itemType: newType,
        isReturn: newType === "return",
        discount: proratedDiscount,
        quantity: newType === "return" ? -qty : qty,
        total:
          (newType === "return" ? -qty : qty) * item.retailPrice -
          (newType === "return"
            ? -proratedDiscount
            : proratedDiscount),
      };

      const updated = [...prev];
      updated[index] = newItem;
      return updated;
    });
  }, [isManualReturn]);

  // ─────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────
  const resetCart = useCallback(() => {
    setCartItems([]);
    setSelectedProductIds([]);
  }, []);

  return {
    cartItems,
    setCartItems,
    calculateTotals,
    selectedProductIds,
    setSelectedProductIds,
    addProductToCart,
    removeProductFromCart,
    updateReturnQuantity,
    updateExchangeQuantity,
    updateSaleQuantity,
    updateDiscount,
    toggleVoid,
    removeItem,
    toggleItemType,
    resetCart,
  };
}