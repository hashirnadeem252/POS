// components/sales/InvoiceModal.jsx
import { useState, useRef } from "react";
import { notify } from "../../utils/notify";
import { useSettings } from "../../contexts/SettingsContext";
import { Printer, X, MessageCircle, Download } from "lucide-react";
import html2pdf from "html2pdf.js";

function InvoiceModal({ isOpen, onClose, saleData }) {
  const printRef = useRef();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { settings } = useSettings();

  if (!isOpen || !saleData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-PK", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const formatCurrency = (amount) => {
    return `Rs ${Number(amount || 0).toFixed(2)}`;
  };

  const handleWhatsAppShare = () => {
    if (!saleData) return;
    let text = `*${settings.storeName || "Rova POS"}*\n`;
    if (settings.receiptHeader) text += `${settings.receiptHeader}\n`;
    if (settings.storeAddress) text += `${settings.storeAddress}\n`;
    if (settings.storePhone) text += `Ph: ${settings.storePhone}\n`;
    if (settings.showTaxNumberOnReceipt && settings.taxNumber) text += `NTN: ${settings.taxNumber}\n`;
    text += `--------------------------\n`;
    text += `*Invoice:* ${saleData.invoiceNumber}\n`;
    text += `*Date:* ${formatDate(saleData.saleDate)}\n`;
    if (saleData.customerName) text += `*Customer:* ${saleData.customerName}\n`;
    text += `--------------------------\n`;

    saleData.details?.forEach((item) => {
      text += `• ${item.productName}\n`;
      text += `  ${Math.abs(item.quantity)} x ${item.retailPrice} = ${Math.abs(item.total).toFixed(2)}\n`;
    });

    text += `--------------------------\n`;
    text += `*NET TOTAL: ${formatCurrency(saleData.total)}*\n`;
    if (saleData.paymentMethod === "Credit") {
      text += `Paid: ${formatCurrency(saleData.paidAmount)}\n`;
      text += `*Balance (Udhaar): ${formatCurrency(saleData.remainingAmount)}*\n`;
    } else {
      text += `Paid via: ${saleData.paymentMethod}\n`;
    }
    text += `--------------------------\n`;
    text += `${settings.receiptFooter || "Thank you!"}`;

    const encodedText = encodeURIComponent(text);
    const phone = saleData.customerPhone ? saleData.customerPhone.replace(/[^0-9]/g, '') : "";
    window.open(phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`, "_blank");
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    const opt = {
      margin: 0, filename: `${saleData.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: [80, 297], orientation: 'portrait' }
    };
    html2pdf().set(opt).from(printRef.current).save().then(() => {
      setIsDownloading(false); notify.success("PDF Downloaded");
    }).catch((err) => {
      setIsDownloading(false); notify.error("Failed to download PDF");
    });
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const printContent = printRef.current.innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.width = '0'; iframe.style.height = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.write(`
      <!DOCTYPE html><html><head><title>Print</title>
          <style>
            @page { size: 80mm auto; margin: 0mm; }
            body { font-family: 'Courier New', monospace; width: 76mm; margin: 0 auto; padding: 0; font-size: 11px; line-height: 1.3; }
            .header h1 { font-size: 16px; margin: 0 0 4px 0; font-weight: bold; text-align: center; text-transform: uppercase; }
            .header p { margin: 2px 0; font-size: 10px; text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .item-header { display: grid; grid-template-columns: 2fr 0.5fr 0.8fr 1fr; gap: 4px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; text-transform: uppercase;}
            .item-row { display: grid; grid-template-columns: 2fr 0.5fr 0.8fr 1fr; gap: 4px; margin-bottom: 4px; }
            .text-right { text-align: right; }
            .totals { margin-top: 6px; font-size: 11px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .grand-total { font-size: 14px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin: 6px 0; }
            .footer { margin-top: 10px; font-size: 10px; text-align: center; }
          </style>
      </head><body>${printContent}</body></html>
    `);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus(); iframe.contentWindow.print();
      setTimeout(() => { document.body.removeChild(iframe); setIsPrinting(false); }, 1000);
    }, 500);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#F8FAFC", borderRadius: "16px", width: "100%", maxWidth: "380px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
        
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #EAEDF2", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#12203A", display: "flex", alignItems: "center", gap: "8px" }}>
            <Printer size={20} color="#0D9488" /> {saleData.isReturn ? 'Return Receipt' : 'Print Invoice'}
          </h2>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: "auto", overflowX: "hidden", padding: "24px 16px", display: "flex", justifyContent: "center", background: "#E2E8F0" }}>
          <div ref={printRef} style={{ background: "#fff", padding: "20px 16px", width: "300px", minWidth: "300px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'Courier New', monospace", color: "#000", boxSizing: "border-box" }}>
            
            <div className="header" style={{ textAlign: "center", marginBottom: "12px" }}>
              {saleData.isReturn && <div style={{ border: "2px solid #000", padding: "4px", fontWeight: "bold", marginBottom: "12px", fontSize: "14px" }}>*** RETURN ***</div>}
              
              {/* ✅ CUSTOM HEADER FROM SETTINGS */}
              {settings.receiptHeader && <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "bold" }}>{settings.receiptHeader}</p>}

              <h1 style={{ fontSize: "18px", margin: "0 0 4px 0", fontWeight: "bold", textTransform: "uppercase", wordBreak: "break-word" }}>{settings.storeName || "Rova POS"}</h1>
              {settings.storeAddress && <p style={{ margin: "2px 0", fontSize: "11px", wordBreak: "break-word" }}>{settings.storeAddress}</p>}
              {settings.storePhone && <p style={{ margin: "2px 0", fontSize: "11px" }}>Ph: {settings.storePhone}</p>}
              
              {/* ✅ TOGGLE TAX NUMBER */}
              {settings.showTaxNumberOnReceipt && settings.taxNumber && (
                <p style={{ margin: "2px 0", fontSize: "11px" }}>NTN: {settings.taxNumber}</p>
              )}
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "12px 0" }}></div>

            <div className="meta" style={{ fontSize: "11px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span>Bill No:</span> <span style={{ fontWeight: "bold" }}>{saleData.invoiceNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span>Date:</span> <span>{formatDate(saleData.returnDate || saleData.saleDate)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span>Cashier:</span> <span>{saleData.salesPersonName || "Admin"}</span>
              </div>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "12px 0" }}></div>

            <div style={{ fontSize: "11px" }}>
              <div className="item-header" style={{ display: "grid", gridTemplateColumns: "2fr 0.5fr 0.8fr 1fr", gap: "4px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "6px" }}>
                <div>Item</div>
                <div className="text-right" style={{ textAlign: "right" }}>Qty</div>
                <div className="text-right" style={{ textAlign: "right" }}>Rate</div>
                <div className="text-right" style={{ textAlign: "right" }}>Total</div>
              </div>

              {saleData.details?.map((item, index) => (
                <div key={index} className="item-row" style={{ display: "grid", gridTemplateColumns: "2fr 0.5fr 0.8fr 1fr", gap: "4px", marginBottom: "6px", alignItems: "start" }}>
                  <div style={{ fontWeight: "bold", wordBreak: "break-word" }}>{item.productName}</div>
                  <div className="text-right" style={{ textAlign: "right" }}>{Math.abs(item.quantity)}</div>
                  <div className="text-right" style={{ textAlign: "right" }}>{Number(item.retailPrice).toFixed(0)}</div>
                  <div className="text-right" style={{ textAlign: "right" }}>{Math.abs(item.total).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #000", margin: "12px 0" }}></div>

            <div className="totals" style={{ fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Sub Total:</span> <span>{formatCurrency(saleData.subTotal)}</span>
              </div>
              {saleData.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Discount:</span> <span>- {formatCurrency(saleData.discount)}</span>
                </div>
              )}
              {saleData.tax > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Tax:</span> <span>{formatCurrency(saleData.tax)}</span>
                </div>
              )}
              
              <div className="grand-total" style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "bold", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "6px 0", margin: "8px 0" }}>
                <span>NET TOTAL:</span> <span>{formatCurrency(saleData.total)}</span>
              </div>

              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Payment Method:</span> <span style={{ fontWeight: "bold" }}>{saleData.paymentMethod || "Cash"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Paid Amount:</span> <span>{formatCurrency(saleData.paidAmount)}</span>
                </div>
                {Number(saleData.remainingAmount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#c00", fontWeight: "bold", fontSize: "12px", marginTop: "4px" }}>
                    <span>Balance (Udhaar):</span> <span>{formatCurrency(saleData.remainingAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "12px 0" }}></div>

            <div className="footer" style={{ textAlign: "center", marginTop: "16px" }}>
              <p style={{ fontWeight: "bold", fontSize: "11px", margin: "0 0 4px 0" }}>{settings.receiptFooter || "Thank you for your business!"}</p>
              <p style={{ margin: 0, fontSize: "10px", color: "#555" }}>Powered by Rova POS</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", background: "#fff", borderTop: "1px solid #EAEDF2", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer", color: "#12203A" }}>
            Close
          </button>
          <button onClick={handleDownloadPDF} disabled={isDownloading} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 20px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", color: "#12203A", fontWeight: 600, cursor: isDownloading ? "not-allowed" : "pointer" }}>
            <Download size={18} /> {isDownloading ? "Saving..." : "PDF"}
          </button>
          <button onClick={handleWhatsAppShare} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 20px", borderRadius: "8px", border: "none", background: "#25D366", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            <MessageCircle size={18} /> WhatsApp
          </button>
          <button onClick={handlePrint} disabled={isPrinting} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0D9488", color: "#fff", fontWeight: 600, cursor: isPrinting ? "not-allowed" : "pointer", opacity: isPrinting ? 0.7 : 1 }}>
            <Printer size={18} /> {isPrinting ? "Printing..." : "Print"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceModal;