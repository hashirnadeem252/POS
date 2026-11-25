import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import FormInput from "../common/FormInput";
import FormSelect from "../common/FormSelect";
import FormTextarea from "../common/FormTextarea";
import { notify } from "../../utils/notify";
import "../../assets/styles/sales/SalesReturnForm.css";
import EmptyState from "../common/EmptyState";

function SalesReturnForm({
  salesReturn,
  onClose,
  onSave,
  products,
  sales
}) {

  // =========================
  // FORM STATE
  // =========================

  const [formData, setFormData] = useState({
    returnNumber: "",
    saleId: "",
    customerId: "",
    returnDate: "",
    total: 0,
    comments: "",
    details: []
  });

  // =========================
  // LOAD SALES RETURN FOR EDIT
  // =========================

  useEffect(() => {
    if (salesReturn) {
      setFormData({
        returnNumber: salesReturn.returnNumber || "",
        saleId: salesReturn.saleId || "",
        customerId: salesReturn.customerId || "",
        returnDate: salesReturn.returnDate
          ? salesReturn.returnDate.substring(0, 10)
          : "",
        total: salesReturn.total || 0,
        comments: salesReturn.comments || "",
        details: (salesReturn.details || []).map(
          (detail) => ({
            ...detail,
            rowState: "Original"
          })
        )
      });
    } else {
      setFormData({
        returnNumber: "",
        saleId: "",
        customerId: "",
        returnDate: "",
        total: 0,
        comments: "",
        details: []
      });
    }
  }, [salesReturn]);

  // =========================
  // MASTER FIELD CHANGE
  // =========================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  }

  // =========================
  // LOAD SALE DETAILS WHEN SALE SELECTED
  // =========================

  function handleSaleSelect(event) {
    const saleId = event.target.value;
    const selectedSale = sales.find(s => s.saleId === Number(saleId));

    setFormData((current) => ({
      ...current,
      saleId: saleId,
      customerId: selectedSale?.customerId || "",
      // Load sale products as return items
      details: (selectedSale?.details || []).map(d => ({
        salesReturnDetailId: 0,
        productId: d.productId,
        productName: d.productName || "Product",
        quantity: 0,
        retailPrice: d.retailPrice || 0,
        discount: 0,
        tax: 0,
        total: 0,
        reason: "",
        rowState: "Added",
        maxQuantity: d.quantity || 0
      }))
    }));
  }

  // =========================
  // ADD DETAIL
  // =========================

  function addDetail() {
    const newDetail = {
      salesReturnDetailId: 0,
      productId: "",
      productName: "",
      quantity: 0,
      retailPrice: 0,
      discount: 0,
      tax: 0,
      total: 0,
      reason: "",
      rowState: "Added",
      maxQuantity: 0
    };

    setFormData((current) => ({
      ...current,
      details: [
        ...current.details,
        newDetail
      ]
    }));
  }

  // =========================
  // DETAIL FIELD CHANGE
  // =========================

  function handleDetailChange(
    index,
    field,
    value
  ) {
    setFormData((current) => {
      const updatedDetails =
        [...current.details];

      const detail =
        updatedDetails[index];

      let updatedDetail = {
        ...detail,
        [field]: value
      };

      // =========================
      // CALCULATE TOTAL
      // =========================

      if (
        field === "quantity" ||
        field === "retailPrice" ||
        field === "discount"
      ) {
        const quantity =
          field === "quantity"
            ? Number(value) || 0
            : Number(detail.quantity) || 0;

        const retailPrice =
          field === "retailPrice"
            ? Number(value) || 0
            : Number(detail.retailPrice) || 0;

        const discount =
          field === "discount"
            ? Number(value) || 0
            : Number(detail.discount) || 0;

        updatedDetail.total =
          (quantity * retailPrice) - discount;
      }

      // =========================
      // ROW STATE
      // =========================

      if (
        detail.rowState === "Original"
      ) {
        updatedDetail.rowState =
          "Modified";
      }

      updatedDetails[index] =
        updatedDetail;

      // Recalculate total
      let total = 0;
      updatedDetails.forEach(d => {
        total += Number(d.total) || 0;
      });

      return {
        ...current,
        details: updatedDetails,
        total: total
      };
    });
  }

  // =========================
  // REMOVE DETAIL
  // =========================

  function removeDetail(index) {
    setFormData((current) => {
      const updatedDetails =
        [...current.details];

      const detail =
        updatedDetails[index];

      // =========================
      // NEW UNSAVED ROW
      // =========================

      if (
        detail.rowState === "Added"
      ) {
        updatedDetails.splice(
          index,
          1
        );
      }

      // =========================
      // EXISTING DATABASE ROW
      // =========================

      else {
        updatedDetails[index] = {
          ...detail,
          rowState: "Deleted"
        };
      }

      // Recalculate total
      let total = 0;
      updatedDetails.forEach(d => {
        if (d.rowState !== "Deleted") {
          total += Number(d.total) || 0;
        }
      });

      return {
        ...current,
        details: updatedDetails,
        total: total
      };
    });
  }

  // =========================
  // SAVE
  // =========================

  function handleSubmit(event) {
    event.preventDefault();

    if (formData.details.filter(d => d.rowState !== "Deleted").length === 0) {
      notify.warning("Please add at least one product to return.");
      return;
    }

    const cleanedData = {
      ...formData,
      saleId: Number(formData.saleId),
      customerId: formData.customerId
        ? Number(formData.customerId)
        : null,
      total: Number(formData.total),

      details: formData.details
        .filter(d => d.rowState !== "Deleted")
        .map((detail) => ({
          ...detail,
          productId: Number(detail.productId),
          quantity: Number(detail.quantity),
          retailPrice: Number(detail.retailPrice),
          discount: Number(detail.discount) || 0,
          tax: Number(detail.tax) || 0,
          total: Number(detail.total)
        }))
    };

    console.log("Sales Return being saved:", cleanedData);
    console.log("Return Details:", cleanedData.details);

    onSave(cleanedData);
  }

  // =========================
  // RENDER
  // =========================

  const saleOptions = sales.map((sale) => ({
    value: sale.saleId,
    label: `${sale.invoiceNumber} - ₹${sale.total}`,
  }));
  const productOptions = products.map((product) => ({
    value: product.productId,
    label: `${product.name} (Stock: ${product.currentStock})`,
  }));
  const reasonOptions = [
    { value: "Damaged", label: "Damaged" },
    { value: "Defective", label: "Defective" },
    { value: "Wrong Item", label: "Wrong Item" },
    { value: "Customer Request", label: "Customer Request" },
    { value: "Other", label: "Other" },
  ];
  const activeDetails = formData.details.filter(
    (detail) => detail.rowState !== "Deleted"
  );

  return (
    <div className="sales-return-form-page">
      <header className="sales-return-form-header">
        <h2>{salesReturn ? "Edit Sales Return" : "Add Sales Return"}</h2>
      </header>

      <form onSubmit={handleSubmit} className="sales-return-form">
        <section className="sales-return-form-section">
          <div className="sales-return-section-heading">
            <h3>Return Information</h3>
          </div>

          <div className="sales-return-form-grid">
            <FormInput
              label="Return Number"
              name="returnNumber"
              value={formData.returnNumber}
              onChange={handleChange}
              required
            />
            <FormSelect
              label="Select Sale"
              name="saleId"
              value={formData.saleId}
              onChange={handleSaleSelect}
              options={saleOptions}
              placeholder="Select a sale to return from"
              required
            />
            <FormInput
              label="Customer"
              name="customerId"
              type="number"
              value={formData.customerId}
              onChange={handleChange}
              placeholder="Auto-filled from sale"
            />
            <FormInput
              label="Return Date"
              name="returnDate"
              type="date"
              value={formData.returnDate}
              onChange={handleChange}
              required
            />
            <FormTextarea
              className="sales-return-comments"
              label="Comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </section>

        <section className="sales-return-form-section">
          <div className="sales-return-section-heading">
            <h3>Return Products</h3>
            <button type="button" className="btn btn-outline" onClick={addDetail}>
              <Plus size={16} />
              Add Product
            </button>
          </div>

          <div className="sales-return-detail-list">
            {activeDetails.length === 0 ? (
              <EmptyState
                title="No return products added yet"
                description='Select "Add Product" to begin.'
                compact
              />
            ) : (
              activeDetails.map((detail, index) => (
                <article
                  className="sales-return-detail-card"
                  key={detail.salesReturnDetailId || `new-${index}`}
                >
                  <div className="sales-return-detail-heading">
                    <h4>Product {index + 1}</h4>
                    <span className="sales-return-row-state">{detail.rowState}</span>
                  </div>

                  <div className="sales-return-detail-grid">
                    <FormSelect
                      label="Product"
                      name={`product-${index}`}
                      value={detail.productId}
                      onChange={(event) =>
                        handleDetailChange(index, "productId", event.target.value)
                      }
                      options={productOptions}
                      placeholder="Select product"
                      required
                    />
                    <FormInput
                      label="Quantity to Return"
                      name={`quantity-${index}`}
                      type="number"
                      step="0.01"
                      value={detail.quantity}
                      onChange={(event) =>
                        handleDetailChange(index, "quantity", event.target.value)
                      }
                      helper={detail.maxQuantity > 0 ? `Maximum: ${detail.maxQuantity}` : null}
                      required
                    />
                    <FormInput
                      label="Retail Price"
                      name={`retailPrice-${index}`}
                      type="number"
                      step="0.01"
                      value={detail.retailPrice}
                      onChange={(event) =>
                        handleDetailChange(index, "retailPrice", event.target.value)
                      }
                      required
                    />
                    <FormInput
                      label="Discount"
                      name={`discount-${index}`}
                      type="number"
                      step="0.01"
                      value={detail.discount}
                      onChange={(event) =>
                        handleDetailChange(index, "discount", event.target.value)
                      }
                    />
                    <FormInput
                      label="Tax"
                      name={`tax-${index}`}
                      type="number"
                      step="0.01"
                      value={detail.tax}
                      onChange={(event) =>
                        handleDetailChange(index, "tax", event.target.value)
                      }
                    />
                    <FormSelect
                      label="Reason for Return"
                      name={`reason-${index}`}
                      value={detail.reason || ""}
                      onChange={(event) =>
                        handleDetailChange(index, "reason", event.target.value)
                      }
                      options={reasonOptions}
                      placeholder="Select reason"
                    />
                  </div>

                  <div className="sales-return-detail-footer">
                    <strong>Line total: ₹{detail.total}</strong>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeDetail(index)}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="sales-return-summary">
          <span>Total Return Amount</span>
          <strong>₹{formData.total}</strong>
        </section>

        <div className="sales-return-form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            <X size={16} />
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            Save Sales Return
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalesReturnForm;