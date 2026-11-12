import { useEffect, useState } from "react";

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

  return (
    <div>
      <h2>
        {salesReturn
          ? "Edit Sales Return"
          : "Add Sales Return"}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* =========================
            MASTER
        ========================== */}

        <h3>
          Return Information
        </h3>

        <div>
          <label>
            Return Number
          </label>
          <br />
          <input
            name="returnNumber"
            value={formData.returnNumber}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>
            Select Sale
          </label>
          <br />
          <select
            name="saleId"
            value={formData.saleId}
            onChange={handleSaleSelect}
            required
          >
            <option value="">
              Select a sale to return from
            </option>
            {sales.map(s => (
              <option
                key={s.saleId}
                value={s.saleId}
              >
                {s.invoiceNumber} - ₹{s.total}
              </option>
            ))}
          </select>
        </div>

        <br />

        <div>
          <label>
            Customer
          </label>
          <br />
          <input
            type="number"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            placeholder="Auto-filled from sale"
          />
        </div>

        <br />

        <div>
          <label>
            Return Date
          </label>
          <br />
          <input
            type="date"
            name="returnDate"
            value={formData.returnDate}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>
            Comments
          </label>
          <br />
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
          />
        </div>

        <br />

        {/* =========================
            DETAILS
        ========================== */}

        <h3>
          Return Products
        </h3>

        <button
          type="button"
          onClick={addDetail}
        >
          Add Product
        </button>

        <br />
        <br />

        {formData.details
          .filter(d => d.rowState !== "Deleted")
          .map((detail, index) => (
            <div
              key={detail.salesReturnDetailId || `new-${index}`}
              style={{
                border: "1px solid gray",
                padding: "10px",
                marginBottom: "10px"
              }}
            >
              <h4>
                Product {index + 1}
              </h4>

              {/* PRODUCT */}
              <label>
                Product
              </label>
              <br />
              <select
                value={detail.productId}
                onChange={(event) =>
                  handleDetailChange(
                    index,
                    "productId",
                    event.target.value
                  )
                }
                required
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option
                    key={p.productId}
                    value={p.productId}
                  >
                    {p.name} (Stock: {p.currentStock})
                  </option>
                ))}
              </select>

              <br />
              <br />

              {/* QUANTITY */}
              <label>
                Quantity to Return
              </label>
              <br />
              <input
                type="number"
                step="0.01"
                value={detail.quantity}
                onChange={(event) =>
                  handleDetailChange(
                    index,
                    "quantity",
                    event.target.value
                  )
                }
                required
              />
              {detail.maxQuantity > 0 && (
                <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>
                  Max: {detail.maxQuantity}
                </span>
              )}

              <br />
              <br />

              {/* RETAIL PRICE */}
              <label>
                Retail Price
              </label>
              <br />
              <input
                type="number"
                step="0.01"
                value={detail.retailPrice}
                onChange={(event) =>
                  handleDetailChange(
                    index,
                    "retailPrice",
                    event.target.value
                  )
                }
                required
              />

              <br />
              <br />

              {/* DISCOUNT */}
              <label>
                Discount
              </label>
              <br />
              <input
                type="number"
                step="0.01"
                value={detail.discount}
                onChange={(event) =>
                  handleDetailChange(
                    index,
                    "discount",
                    event.target.value
                  )
                }
              />

              <br />
              <br />

              {/* TAX */}
              <label>
                Tax
              </label>
              <br />
              <input
                type="number"
                step="0.01"
                value={detail.tax}
                onChange={(event) =>
                  handleDetailChange(
                    index,
                    "tax",
                    event.target.value
                  )
                }
              />

              <br />
              <br />

              {/* REASON */}
              <label>
                Reason for Return
              </label>
              <br />
              <select
                value={detail.reason || ""}
                onChange={(event) =>
                  handleDetailChange(
                    index,
                    "reason",
                    event.target.value
                  )
                }
              >
                <option value="">Select Reason</option>
                <option value="Damaged">Damaged</option>
                <option value="Defective">Defective</option>
                <option value="Wrong Item">Wrong Item</option>
                <option value="Customer Request">Customer Request</option>
                <option value="Other">Other</option>
              </select>

              <br />
              <br />

              {/* TOTAL */}
              <strong>
                Total: {detail.total}
              </strong>

              <br />
              <br />

              {/* ROW STATE */}
              <div>
                Row State:{" "}
                <strong>
                  {detail.rowState}
                </strong>
              </div>

              <br />

              {/* REMOVE */}
              <button
                type="button"
                onClick={() =>
                  removeDetail(index)
                }
              >
                Remove
              </button>
            </div>
          ))}

        <br />

        {/* =========================
            SUMMARY
        ========================== */}

        <h3>Summary</h3>

        <div>
          <strong>Total Return Amount:</strong> ₹{formData.total}
        </div>

        <br />

        {/* =========================
            SAVE / CANCEL
        ========================== */}

        <button
          type="submit"
        >
          Save Sales Return
        </button>

        {" "}

        <button
          type="button"
          onClick={onClose}
        >
          Cancel
        </button>

      </form>
    </div>
  );
}

export default SalesReturnForm;