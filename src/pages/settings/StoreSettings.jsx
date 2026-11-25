// src/pages/settings/StoreSettings.jsx
import { useState, useEffect } from "react";
import { Store, Receipt, Percent, CheckCircle2, Languages } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import { updateSettings } from "../../services/SettingsDefinition/settingsService";
import { notify } from "../../utils/notify";
import FormInput from "../../components/common/FormInput";
import FormSelect from "../../components/common/FormSelect";
import FormTextarea from "../../components/common/FormTextarea";
import LanguageToggle from "../../components/common/LanguageToggle";
import { useTranslation } from "react-i18next";
import "../../assets/styles/settings/Settings.css";

export default function StoreSettings() {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    storeName: "",
    storeAddress: "",
    storePhone: "",
    storeEmail: "",
    currencySymbol: "Rs",
    currencyCode: "PKR",
    receiptHeader: "",
    receiptFooter: "",
    businessType: "Retail",
    taxNumber: "",
    showTaxNumberOnReceipt: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        storeName: settings.storeName || "",
        storeAddress: settings.storeAddress || "",
        storePhone: settings.storePhone || "",
        storeEmail: settings.storeEmail || "",
        currencySymbol: settings.currencySymbol || "Rs",
        currencyCode: settings.currencyCode || "PKR",
        receiptHeader: settings.receiptHeader || "",
        receiptFooter: settings.receiptFooter || "",
        businessType: settings.businessType || "Retail",
        taxNumber: settings.taxNumber || "",
        showTaxNumberOnReceipt: settings.showTaxNumberOnReceipt !== false,
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(form);
      setSettings((prev) => ({ ...prev, ...form }));
      notify.success(t("settings.saved"));
    } catch (error) {
      notify.error(error?.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const businessTypeOptions = [
    { value: "Retail", label: t("settings.retailShop") },
    { value: "Restaurant", label: t("settings.restaurant") },
  ];

  // ✅ No wrapper div, no header — parent handles those
  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <section className="settings-section settings-language-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon"><Languages size={19} /></span>
          <div>
            <h2>{t("settings.languageSection")}</h2>
            <p>{t("settings.languageHelp")}</p>
          </div>
        </div>
        <LanguageToggle />
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon"><Store size={19} /></span>
          <div>
            <h2>{t("settings.storeDetails")}</h2>
            <p>{t("settings.storeDetailsHelp")}</p>
          </div>
        </div>

        <div className="settings-grid settings-store-grid">
          <FormInput
            className="settings-span-full"
            label={t("settings.storeName")}
            name="storeName"
            value={form.storeName}
            onChange={handleChange}
            placeholder={t("settings.storeNamePlaceholder")}
            required
          />
          <FormInput
            label={t("settings.phone")}
            name="storePhone"
            type="tel"
            value={form.storePhone}
            onChange={handleChange}
            placeholder="03xx-xxxxxxx"
          />
          <FormInput
            label={t("settings.email")}
            name="storeEmail"
            type="email"
            value={form.storeEmail}
            onChange={handleChange}
            placeholder="store@example.com"
          />
          <FormInput
            className="settings-span-full"
            label={t("settings.address")}
            name="storeAddress"
            value={form.storeAddress}
            onChange={handleChange}
            placeholder={t("settings.addressPlaceholder")}
          />
          <FormInput
            label={t("settings.taxNumber")}
            name="taxNumber"
            value={form.taxNumber}
            onChange={handleChange}
            placeholder="e.g., 1234567-8"
          />
          <FormSelect
            label={t("settings.businessType")}
            name="businessType"
            value={form.businessType}
            onChange={handleChange}
            options={businessTypeOptions}
            searchable={false}
          />
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon"><Percent size={19} /></span>
          <div>
            <h2>{t("settings.financial")}</h2>
            <p>{t("settings.financialHelp")}</p>
          </div>
        </div>

        <div className="settings-grid settings-financial-grid">
          <FormInput
            label={t("settings.currencySymbol")}
            name="currencySymbol"
            value={form.currencySymbol}
            onChange={handleChange}
            placeholder="Rs"
          />
          <FormInput
            label={t("settings.currencyCode")}
            name="currencyCode"
            value={form.currencyCode}
            onChange={handleChange}
            placeholder="PKR"
          />
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon"><Receipt size={19} /></span>
          <div>
            <h2>{t("settings.receipt")}</h2>
            <p>{t("settings.receiptHelp")}</p>
          </div>
        </div>

        <div className="settings-grid">
          <FormInput
            className="settings-span-full"
            label={t("settings.receiptHeader")}
            name="receiptHeader"
            value={form.receiptHeader}
            onChange={handleChange}
            placeholder={t("settings.receiptHeaderPlaceholder")}
            helper={t("settings.receiptHeaderHelp", { storeName: form.storeName || t("settings.yourStore") })}
          />
          <FormTextarea
            className="settings-span-full"
            label={t("settings.receiptFooter")}
            name="receiptFooter"
            value={form.receiptFooter}
            onChange={handleChange}
            placeholder={t("settings.receiptFooterPlaceholder")}
            rows={2}
          />
          <label className="settings-checkbox">
            <input
              type="checkbox"
              name="showTaxNumberOnReceipt"
              checked={form.showTaxNumberOnReceipt}
              onChange={handleChange}
            />
            <span>
              <strong>{t("settings.printTax")}</strong>
              <small>{t("settings.printTaxHelp")}</small>
            </span>
          </label>
        </div>
      </section>

      <div className="settings-save-bar">
        <span>{loading ? t("settings.saving") : t("settings.changesApply")}</span>
        <button type="submit" disabled={loading} className="btn btn-primary settings-save-button">
          {loading ? t("settings.savingChanges") : t("settings.save")}
          {!loading && <CheckCircle2 size={18} />}
        </button>
      </div>
    </form>
  );
}