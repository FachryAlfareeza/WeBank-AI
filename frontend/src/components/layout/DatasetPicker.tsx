import { SAMPLE_DATASETS, type SampleDataset } from "@/mocks/sampleData";

interface Props {
  value: SampleDataset;
  onChange: (d: SampleDataset) => void;
  onUsePrompt: (text: string) => void;
}

/** Lets the demo pick a sample merchant dataset and prefill its prompt. */
export function DatasetPicker({ value, onChange, onUsePrompt }: Props) {
  return (
    <div className="dataset">
      <label className="dataset__label" htmlFor="dataset-select">
        Dataset
      </label>
      <select
        id="dataset-select"
        className="dataset__select"
        value={value.key}
        onChange={(e) => {
          const next = SAMPLE_DATASETS.find((d) => d.key === e.target.value);
          if (next) onChange(next);
        }}
      >
        {SAMPLE_DATASETS.map((d) => (
          <option key={d.key} value={d.key}>
            {d.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="dataset__prefill"
        onClick={() => onUsePrompt(value.suggestedPrompt)}
        title="Prefill the suggested prompt"
      >
        Use suggested prompt
      </button>
    </div>
  );
}
