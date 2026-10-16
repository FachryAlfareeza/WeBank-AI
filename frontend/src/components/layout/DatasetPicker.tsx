import { useRef, useState } from "react";
import { SAMPLE_DATASETS, type SampleDataset } from "@/mocks/sampleData";

interface Props {
  value: SampleDataset;
  onChange: (d: SampleDataset) => void;
  onUsePrompt: (text: string) => void;
}

// Columns the engine (and mock) expect in an uploaded transactions CSV.
const REQUIRED_COLUMNS = [
  "gross_revenue_rmb",
  "total_expenses_rmb",
  "supplier_invoices_efapiao_rmb",
];

/** Pull a merchant name out of the CSV if present, else fall back. */
function readMerchantName(headers: string[], firstRow: string[]): string {
  const idx = headers.indexOf("merchant_name");
  const name = idx >= 0 ? firstRow[idx]?.trim() : "";
  return name || "Uploaded merchant";
}
function readMerchantId(headers: string[], firstRow: string[]): string {
  const idx = headers.indexOf("merchant_id");
  const id = idx >= 0 ? firstRow[idx]?.trim() : "";
  return id || `MERCH_UPLOAD_${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

/** Validate an uploaded CSV and turn it into a selectable dataset. */
function parseUpload(fileName: string, text: string): SampleDataset {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("The file needs a header row and at least one month of data.");
  }
  const headers = lines[0].split(",").map((h) => h.trim());
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    throw new Error(`Missing required column(s): ${missing.join(", ")}.`);
  }
  const firstRow = lines[1].split(",");
  return {
    key: `upload-${Date.now()}`,
    label: `${fileName} (uploaded)`,
    merchantId: readMerchantId(headers, firstRow),
    merchantName: readMerchantName(headers, firstRow),
    csv: text.trim(),
    suggestedPrompt: "I need 50,000 RMB to grow my business, 6-month tenor.",
  };
}

/** Lets the demo pick a sample merchant dataset, upload a CSV, and prefill a prompt. */
export function DatasetPicker({ value, onChange, onUsePrompt }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<SampleDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const options = uploaded ? [...SAMPLE_DATASETS, uploaded] : SAMPLE_DATASETS;

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const dataset = parseUpload(file.name, text);
      setUploaded(dataset);
      onChange(dataset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  };

  return (
    <div className="dataset">
      <div className="dataset__row">
        <label className="dataset__label" htmlFor="dataset-select">
          Dataset
        </label>
        <select
          id="dataset-select"
          className="dataset__select"
          value={value.key}
          onChange={(e) => {
            const next = options.find((d) => d.key === e.target.value);
            if (next) onChange(next);
          }}
        >
          {options.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="dataset__file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = ""; // allow re-uploading the same file
          }}
        />
        <button
          type="button"
          className="dataset__upload"
          onClick={() => fileRef.current?.click()}
          title="Upload a merchant transactions CSV (WeChat Pay / e-fapiao export)"
        >
          ⬆ Upload CSV
        </button>

        <button
          type="button"
          className="dataset__prefill"
          onClick={() => onUsePrompt(value.suggestedPrompt)}
          title="Prefill the suggested prompt"
        >
          Use suggested prompt
        </button>
      </div>

      {error && (
        <p className="dataset__error" role="alert">
          ⚠ {error} Expected columns include: {REQUIRED_COLUMNS.join(", ")}.
        </p>
      )}
    </div>
  );
}
