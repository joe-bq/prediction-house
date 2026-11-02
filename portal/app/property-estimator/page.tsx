"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// type definition for the property estimator form and estimate records
type FormState = {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
};

type EstimateRecord = {
  date: string;
  value: number;
  confidence: string;
};

const initialForm: FormState = {
  square_footage: 1850,
  bedrooms: 3,
  bathrooms: 2.5,
  year_built: 2008,
  lot_size: 4100,
  distance_to_city_center: 12,
  school_rating: 8.6,
};

// fallback history for property estimates
const defaultHistory: EstimateRecord[] = [
  { date: "Mar 2024", value: 475000, confidence: "High" },
  { date: "Apr 2024", value: 489000, confidence: "High" },
  { date: "May 2024", value: 498500, confidence: "High" },
  { date: "Jun 2024", value: 512500, confidence: "High" },
];

const fallbackPrediction = (input: FormState) => {
  let estimate = input.square_footage * 180;
  estimate += input.bedrooms * 19000;
  estimate += input.bathrooms * 25000;
  estimate += (2025 - input.year_built) * -320;
  estimate += input.lot_size * 16;
  estimate -= input.distance_to_city_center * 2200;
  estimate += input.school_rating * 42000;
  return Math.max(estimate, 65000);
};

export default function PropertyEstimatorPage() {
  // state for the property estimator form, result, history, and error message
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<{ prediction: number; currency: string; confidence: string; source: string } | null>(null);
  const [history, setHistory] = useState<EstimateRecord[]>(() => {
    if (typeof window === "undefined") {
      return defaultHistory;
    }

    try {
      // attempt to load saved estimate history from local storage
      const saved = window.localStorage.getItem("property-estimator-history");
      if (!saved) {
        return defaultHistory;
      }
      const parsed = JSON.parse(saved) as EstimateRecord[];
      return Array.isArray(parsed) && parsed.length ? parsed : defaultHistory;
    } catch {
      return defaultHistory;
    }
  });
  const [error, setError] = useState<string | null>(null);
  // memoized data for comparison chart (current property vs peers)
  const comparisonData = useMemo(
    () => [
      { name: "Current", value: result?.prediction ?? fallbackPrediction(form) },
      { name: "Peer A", value: 520000 },
      { name: "Peer B", value: 480000 },
      { name: "Peer C", value: 560000 },
    ],
    [form, result],
  );

  const handleChange = (field: keyof FormState, value: string) => {
    const parsed = Number(value);
    setForm((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload = {
      ...form,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
    };

    try {
      // base url to python validator service
      const baseUrl = process.env.NEXT_PUBLIC_PROPERTY_ESTIMATOR_URL || "http://localhost:8001";
      const response = await fetch(`${baseUrl}/api/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Estimator API rejected the request.");
      }

      const data = await response.json();
      const estimate = {
        prediction: Number(data.prediction),
        currency: data.currency || "USD",
        confidence: data.confidence || "High",
        source: data.source || "task-1-model",
      };

      setResult(estimate);
      const entry = { date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }), value: estimate.prediction, confidence: estimate.confidence };
      const nextHistory = [entry, ...history].slice(0, 5);
      setHistory(nextHistory);
      window.localStorage.setItem("property-estimator-history", JSON.stringify(nextHistory));
      return;
    } catch (fetchError) {
      // in case of error, fallback to demo prediction
      const fallback = fallbackPrediction(form);
      const entry = { date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }), value: fallback, confidence: "Moderate" };
      const nextHistory = [entry, ...history].slice(0, 5);
      setHistory(nextHistory);
      setResult({ prediction: fallback, currency: "USD", confidence: "Moderate", source: "fallback" });
      setError(
        fetchError instanceof Error ? fetchError.message : "Unable to reach the estimator API. Displaying a local estimate fallback.",
      );
      window.localStorage.setItem("property-estimator-history", JSON.stringify(nextHistory));
    }
  };

  const estimatedValue = result?.prediction ?? fallbackPrediction(form);

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">App 1</p>
            <h2>Property Value Estimator</h2>
          </div>
          <span className="chip success">{result?.source || "local"}</span>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Square footage
            <input type="number" value={form.square_footage} onChange={(event) => handleChange("square_footage", event.target.value)} />
          </label>
          <label>
            Bedrooms
            <input type="number" value={form.bedrooms} onChange={(event) => handleChange("bedrooms", event.target.value)} />
          </label>
          <label>
            Bathrooms
            <input type="number" step="0.5" value={form.bathrooms} onChange={(event) => handleChange("bathrooms", event.target.value)} />
          </label>
          <label>
            Year built
            <input type="number" value={form.year_built} onChange={(event) => handleChange("year_built", event.target.value)} />
          </label>
          <label>
            Lot size
            <input type="number" value={form.lot_size} onChange={(event) => handleChange("lot_size", event.target.value)} />
          </label>
          <label>
            Distance to city center
            <input type="number" value={form.distance_to_city_center} onChange={(event) => handleChange("distance_to_city_center", event.target.value)} />
          </label>
          <label className="full-width">
            School rating
            <input type="number" step="0.1" min="0" max="10" value={form.school_rating} onChange={(event) => handleChange("school_rating", event.target.value)} />
          </label>

          <button type="submit" className="primary-button">Estimate value</button>
        </form>

        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="panel highlight-panel">
        <p className="eyebrow">Result</p>
        <h3 className="result-title">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(estimatedValue)}</h3>
        <div className="stat-row">
          <span>Confidence</span>
          <strong>{result?.confidence || "Moderate"}</strong>
        </div>
        <div className="stat-row">
          <span>Currency</span>
          <strong>{result?.currency || "USD"}</strong>
        </div>
        <div className="stat-row">
          <span>Model source</span>
          <strong>{result?.source || "fallback"}</strong>
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-header">
          <h3>Prediction trend</h3>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history.map((item) => ({ ...item, value: Math.round(item.value / 1000) * 1000 }))}>
              <defs>
                <linearGradient id="resultFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Value"]} />
              <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="url(#resultFill)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-header">
          <h3>Side-by-side comparison</h3>
        </div>
        <div className="chart-box small-chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Value"]} />
              <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-header">
          <h3>Estimation history</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Estimate</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={`${row.date}-${row.value}`}>
                <td>{row.date}</td>
                <td>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(row.value)}</td>
                <td>{row.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
