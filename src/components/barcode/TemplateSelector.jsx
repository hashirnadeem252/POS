// components/barcode/TemplateSelector.jsx
import { FileText, Grid3X3, Settings, Check } from "lucide-react";

const templates = [
  {
    id: 1,
    name: "40 Labels (A4)",
    Icon: Grid3X3,
    description: "4 columns × 10 rows",
    config: {
      cols: 4,
      rows: 10,
      labelWidth: "48mm",
      labelHeight: "25mm",
      gap: "2mm",
      pageSize: "A4",
    },
  },
  {
    id: 2,
    name: "24 Labels (A4)",
    Icon: Grid3X3,
    description: "3 columns × 8 rows",
    config: {
      cols: 3,
      rows: 8,
      labelWidth: "62mm",
      labelHeight: "33mm",
      gap: "3mm",
      pageSize: "A4",
    },
  },
  {
    id: 3,
    name: "12 Labels (A4)",
    Icon: FileText,
    description: "2 columns × 6 rows",
    config: {
      cols: 2,
      rows: 6,
      labelWidth: "90mm",
      labelHeight: "48mm",
      gap: "4mm",
      pageSize: "A4",
    },
  },
  {
    id: 4,
    name: "6 Labels (A4)",
    Icon: FileText,
    description: "1 column × 6 rows",
    config: {
      cols: 1,
      rows: 6,
      labelWidth: "190mm",
      labelHeight: "70mm",
      gap: "5mm",
      pageSize: "A4",
    },
  },
  {
    id: 5,
    name: "Custom Template",
    Icon: Settings,
    description: "Custom size labels",
    config: {
      cols: 2,
      rows: 4,
      labelWidth: "85mm",
      labelHeight: "45mm",
      gap: "3mm",
      pageSize: "A4",
      isCustom: true,
    },
  },
];

function TemplateSelector({ selected, onSelect }) {
  return (
    <div className="template-selector">
      <h3>Select Barcode Template</h3>
      <div className="template-grid">
        {templates.map((template) => {
          const TemplateIcon = template.Icon;
          const isSelected = selected?.id === template.id;
          return (
            <div
              key={template.id}
              className={`template-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelect(template)}
            >
              {isSelected && (
                <div className="template-check">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
              <div className="template-icon">
                <TemplateIcon size={24} strokeWidth={1.75} />
              </div>
              <div className="template-name">{template.name}</div>
              <div className="template-desc">{template.description}</div>
              <div className="template-preview">
                <div
                  className="mini-grid"
                  style={{
                    gridTemplateColumns: `repeat(${template.config.cols}, 1fr)`,
                  }}
                >
                  {Array.from({
                    length: Math.min(template.config.cols * 2, 8),
                  }).map((_, i) => (
                    <div key={i} className="mini-cell"></div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TemplateSelector;