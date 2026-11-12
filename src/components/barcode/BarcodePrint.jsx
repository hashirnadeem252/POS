// components/barcode/BarcodePrint.jsx
import {
  ArrowLeft,
  Printer,
  FileText,
  Tag,
  Grid3X3,
  PackageX,
} from "lucide-react";
import "../../assets/styles/barcode/BarcodePrint.css";

/**
 * BarcodePrint Component
 * Displays a preview of barcode labels and provides print functionality
 *
 * @param {Array} labels - Array of label objects with barcodeSVG, name, price
 * @param {Object} template - Selected template config
 * @param {Function} onPrint - Callback to trigger printing
 * @param {Function} onBack - Callback to go back to previous step
 */
function BarcodePrint({ labels, template, onPrint, onBack }) {
  const config = template.config;

  /**
   * Calculate responsive label sizing
   */
  const getLabelSize = () => {
    const cols = config.cols;
    const gap = config.gap * 2;
    return {
      labelWidth: `calc((100% - ${(cols - 1) * gap}px) / ${cols})`,
      gap: gap,
    };
  };

  const { gap } = getLabelSize();

  // ===== EMPTY STATE =====
  if (labels.length === 0) {
    return (
      <div className="barcode-print-container">
        <div className="print-controls no-print">
          <div className="print-controls-left">
            <button className="btn btn-outline btn-sm" onClick={onBack}>
              <ArrowLeft size={14} strokeWidth={2} />
              Back
            </button>
          </div>
          <div className="print-controls-center">
            <span className="info-badge">
              <FileText size={14} strokeWidth={2} />
              No labels to preview
            </span>
          </div>
        </div>

        <div className="print-preview-wrapper">
          <div className="empty-preview">
            <div className="empty-icon">
              <PackageX size={48} strokeWidth={1.25} />
            </div>
            <h3>No Labels to Preview</h3>
            <p>Please go back and select items to generate barcodes.</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN VIEW =====
  return (
    <div className="barcode-print-container">
      {/* ===== TOOLBAR ===== */}
      <div className="print-controls no-print">
        <div className="print-controls-left">
          <button className="btn btn-outline btn-sm" onClick={onBack}>
            <ArrowLeft size={14} strokeWidth={2} />
            Back
          </button>
        </div>

        <div className="print-controls-center">
          <span className="info-badge">
            <FileText size={14} strokeWidth={2} />
            <strong>{template.name}</strong>
          </span>
          <span className="info-badge">
            <Tag size={14} strokeWidth={2} />
            <strong>{labels.length}</strong> labels
          </span>
          <span className="info-badge">
            <Grid3X3 size={14} strokeWidth={2} />
            <strong>
              {config.cols}×{config.rows}
            </strong>
          </span>
        </div>

        <div className="print-controls-right">
          <button className="btn btn-success btn-sm" onClick={onPrint}>
            <Printer size={14} strokeWidth={2} />
            Print
          </button>
        </div>
      </div>

      {/* ===== PRINT PREVIEW ===== */}
      <div className="print-preview-wrapper">
        <div className="print-preview">
          <div
            className="label-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
              gap: `${gap}px`,
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            {labels.map((label, index) => (
              <div
                key={index}
                className="label-item"
                style={{
                  aspectRatio: `${config.labelWidth} / ${config.labelHeight}`,
                }}
              >
                {/* Barcode SVG */}
                <div
                  className="barcode-svg"
                  dangerouslySetInnerHTML={{ __html: label.barcodeSVG }}
                />

                {/* Product Name */}
                <div className="label-text" title={label.name}>
                  {label.name}
                </div>

                {/* Price */}
                <div className="label-price">PKR {label.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PRINT STYLES ===== */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-preview-wrapper {
            overflow: visible !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: white !important;
          }

          .print-preview {
            padding: 10px !important;
          }

          .label-grid {
            display: grid !important;
            grid-template-columns: repeat(${config.cols}, 1fr) !important;
            gap: ${gap}px !important;
            padding: 5px !important;
            margin: 0 auto !important;
            max-width: 1200px !important;
          }

          .label-item {
            border: 1px solid #ccc !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            aspect-ratio: ${config.labelWidth} / ${config.labelHeight} !important;
            width: 100% !important;
            height: auto !important;
            padding: 8px !important;
          }

          .label-item .barcode-svg svg {
            max-width: 100% !important;
            height: auto !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}

export default BarcodePrint;