import logoIcon from "../../assets/images/logo-icon.png";

export default function BrandLogo({ variant = "full" }) {
  if (variant === "compact") {
    return <img src={logoIcon} alt="SaleKhata" style={{ height: 32 }} />;
  }

  if (variant === "auth") {
    return (
      <div className="brand-logo-auth">
        <span className="brand-logo-auth-icon">
          <img src={logoIcon} alt="" />
        </span>
        <span className="brand-logo-auth-type">
          <span className="brand-logo-auth-wordmark">
            <span>Sale</span>
            <span>Khata</span>
          </span>
          <span className="brand-logo-auth-urdu">کھاتہ</span>
        </span>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="brand-logo-sidebar">
        <span className="brand-logo-sidebar-icon">
          <img src={logoIcon} alt="" />
        </span>
        <span className="brand-logo-sidebar-type">
          <span className="brand-logo-sidebar-wordmark">
            <span>Sale</span>
            <span>Khata</span>
          </span>
          <span className="brand-logo-sidebar-urdu">کھاتہ</span>
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img src={logoIcon} alt="SaleKhata Icon" style={{ height: 40 }} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#0D9488" }}>
          Sale
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#12203A",
            fontFamily: "'Noto Nastaliq Urdu', serif",
            marginTop: 2,
          }}
        >
          کھاتہ
        </span>
      </div>
    </div>
  );
}
