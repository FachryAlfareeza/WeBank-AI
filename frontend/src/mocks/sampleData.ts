// Sample transaction datasets, mirroring ai/data/sample_data_*.csv.
// Used by the mock engine and as selectable demo uploads.

export interface SampleDataset {
  key: string;
  label: string;
  merchantId: string;
  merchantName: string;
  csv: string;
  suggestedPrompt: string;
}

const XINGFU_CSV = `month,merchant_id,merchant_name,gross_revenue_rmb,total_expenses_rmb,supplier_invoices_efapiao_rmb,net_cash_flow_rmb
2026-04,MERCH_SH_88921,Xingfu Coffee Shop,91496.87,56222.03,39355.42,35274.84
2026-05,MERCH_SH_88921,Xingfu Coffee Shop,92559.73,63025.88,44118.12,29533.85
2026-06,MERCH_SH_88921,Xingfu Coffee Shop,86351.56,52729.24,36910.47,33622.32
2026-07,MERCH_SH_88921,Xingfu Coffee Shop,99117.66,64495.6,45146.92,34622.06
2026-08,MERCH_SH_88921,Xingfu Coffee Shop,84694.9,54348.92,38044.24,30345.98
2026-09,MERCH_SH_88921,Xingfu Coffee Shop,84737.54,50958.68,35671.08,33778.86`;

const LIANHUA_CSV = `month,merchant_id,merchant_name,gross_revenue_rmb,total_expenses_rmb,supplier_invoices_efapiao_rmb,net_cash_flow_rmb
2026-04,MERCH_BJ_44102,Lianhua Mini Mart,43668.96,29453.38,20617.37,14215.58
2026-05,MERCH_BJ_44102,Lianhua Mini Mart,44176.23,32731.11,22911.78,11445.12
2026-06,MERCH_BJ_44102,Lianhua Mini Mart,41213.24,27639.02,19347.31,13574.22
2026-07,MERCH_BJ_44102,Lianhua Mini Mart,47306.16,33620.36,23534.25,13685.8
2026-08,MERCH_BJ_44102,Lianhua Mini Mart,40422.57,28364.61,19855.23,12057.96
2026-09,MERCH_BJ_44102,Lianhua Mini Mart,40442.92,26747.77,18723.44,13695.15`;

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    key: "xingfu",
    label: "Xingfu Coffee Shop (approved demo)",
    merchantId: "MERCH_SH_88921",
    merchantName: "Xingfu Coffee Shop",
    csv: XINGFU_CSV,
    suggestedPrompt:
      "I need 50,000 RMB to restock coffee beans and packaging next month, 6-month tenor.",
  },
  {
    key: "lianhua",
    label: "Lianhua Mini Mart (adjustment demo)",
    merchantId: "MERCH_BJ_44102",
    merchantName: "Lianhua Mini Mart",
    csv: LIANHUA_CSV,
    suggestedPrompt:
      "We need 120,000 RMB fast for new shelving and a fridge within 6 months.",
  },
];
