// src/components/PredictionResult.jsx
import { useMemo } from "react";
import { usePredictionStore } from "@/stores/predictionStore";
import { SectionLoader } from "./SectionLoader";

function formatPercent(p) {
  const n = Number(p);
  if (Number.isNaN(n)) return "-";
  return `${(Math.round(n * 1000) / 10).toFixed(1)}%`;
}

function formatNum(n, d = 5) {
  const x = Number(n);
  if (Number.isNaN(x)) return "-";
  const pow = 10 ** d;
  return String(Math.round(x * pow) / pow);
}

function prettifyFeatureName(name) {
  if (!name) return "";
  return String(name).replaceAll("_", " ");
}

function normalizeItems(x) {
  if (!Array.isArray(x)) return [];
  return x
    .map((it) => ({
      feature: it?.feature ?? it?.name ?? "",
      value: it?.value ?? "",
      shap_value: Number(it?.shap_value ?? it?.shap ?? 0),
    }))
    .filter((it) => it.feature);
}

export default function PredictionResult({ result }) {
  const loading = usePredictionStore((s) => s.loading);
  const error = usePredictionStore((s) => s.error);

  const storePrediction = usePredictionStore((s) => s.prediction);
  const storeLabel = usePredictionStore((s) => s.label);
  const storeProbability = usePredictionStore((s) => s.probability);
  const storeItems = usePredictionStore((s) => s.shapItems);

  const label = result?.depression_risk_result ?? storeLabel ?? null;
  const probability =
    result?.depression_risk_result_probability ?? storeProbability ?? null;

  const riskText = useMemo(() => {
    if (label) return label;
    if (storePrediction === 1) return "at-risk";
    if (storePrediction === 0) return "low-risk";
    return "No result yet";
  }, [label, storePrediction]);

  const items = useMemo(() => {
    const fromResult = normalizeItems(result?.shap_items);
    if (fromResult.length) return fromResult;
    return normalizeItems(storeItems);
  }, [result?.shap_items, storeItems]);

  const top = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value),
    );
    return sorted.slice(0, 10);
  }, [items]);

  if (!result) {
    if (loading)
      return (
        <SectionLoader
          title="Loading prediction results"
          subtitle="Analyzing your survey responses and generating insights..."
        />
      );
    if (error) {
      return (
        <div className="p-4 border rounded-xl">
          <div className="font-semibold">Error</div>
          <div className="mt-1 text-sm text-muted-foreground">{error}</div>
        </div>
      );
    }
    if (storePrediction === null) return null;
  }

  return (
    <div className="grid gap-3 max-h-111 max-w-2xl overflow-y-auto">
      <div className="p-4 border rounded-xl">
        <div className="text-lg font-semibold">
          {String(riskText).toLowerCase() === "at-risk"
            ? "At risk"
            : String(riskText).toLowerCase() === "low-risk"
              ? "Low risk"
              : riskText}
        </div>

        <div className="mt-2 grid gap-1 text-sm">
          <div>
            Label:{" "}
            <span className="font-semibold">
              {label ?? (storePrediction === 1 ? "YES" : "NO")}
            </span>
          </div>
          <div>
            Risk probability:{" "}
            <span className="font-semibold">{formatPercent(probability)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-xl">
        <div className="text-base font-semibold">Top factors</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Positive raises risk. Negative lowers risk.
        </div>

        <div className="mt-3 grid gap-3">
          {top.map((it, idx) => {
            const v = Number(it?.shap_value ?? 0);
            const mag = Math.abs(v);
            const width = Math.max(2, Math.min(100, mag * 100));
            const isPos = v >= 0;

            return (
              <div key={`${it?.feature}-${idx}`} className="grid gap-1">
                <div className="flex items-center justify-between gap-3">
                  <div
                    title={it?.feature}
                    className="text-sm font-semibold truncate"
                    style={{ maxWidth: "70%" }}
                  >
                    {prettifyFeatureName(it?.feature)}
                  </div>
                  <div className="text-xs whitespace-nowrap">
                    SHAP {formatNum(v, 5)}
                  </div>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${isPos ? "bg-red-500" : "bg-blue-600"}`}
                    style={{ width: `${width}%` }}
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  Value used: {String(it?.value ?? "")}
                </div>
              </div>
            );
          })}

          {top.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No explanation data.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
