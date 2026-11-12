// hooks/useExport.js
import { useCallback } from 'react';
import { printTable, exportToCSV, exportToExcel } from '../utils/exportUtils';
import { 
  productExportConfig, 
  supplierExportConfig, 
  customerExportConfig,
  purchaseExportConfig,
  salesPersonExportConfig,
  grnExportConfig,
  salesExportConfig,
  salesReturnExportConfig,  // ✅ ADD THIS
} from '../models/exportConfigs';

// ✅ Make sure this is exported with all configs
export const exportConfigs = {
  products: productExportConfig,
  suppliers: supplierExportConfig,
  customers: customerExportConfig,
  purchases: purchaseExportConfig,
  salespersons: salesPersonExportConfig,
  grns: grnExportConfig,
  sales: salesExportConfig,
  salesReturns: salesReturnExportConfig,  // ✅ ADD THIS
};

export function useExport({ config }) {
  const handlePrint = useCallback((data = [], additionalInfo = null) => {
    printTable({
      tableSelector: '.table-wrapper',
      title: config.title,
      subtitle: config.subtitle,
      totalItems: data.length,
      additionalInfo,
    });
  }, [config]);

  const handleExportCSV = useCallback((data = []) => {
    exportToCSV({
      data,
      headers: config.headers,
      rowMapper: config.rowMapper,
      filename: config.filename,
    });
  }, [config]);

  const handleExportExcel = useCallback((data = []) => {
    exportToExcel({
      data,
      headers: config.headers,
      rowMapper: config.rowMapper,
      filename: config.filename,
    });
  }, [config]);

  return {
    handlePrint,
    handleExportCSV,
    handleExportExcel,
  };
}