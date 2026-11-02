"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MarketProperty = {
  id: string;
  location: string;
  neighborhood: string;
  priceTier: string;
  size: string;
  price: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  ytdGrowth: number;
};

type Filters = {
  location: string;
  priceTier: string;
  size: string;
};

const defaultProperties: MarketProperty[] = [
  { id: "PH-101", location: "Austin", neighborhood: "Downtown", priceTier: "Premium", size: "Large", price: 642000, squareFootage: 1820, bedrooms: 3, bathrooms: 2, ytdGrowth: 8.4 },
  { id: "PH-102", location: "Austin", neighborhood: "North Loop", priceTier: "Mid", size: "Medium", price: 515000, squareFootage: 1640, bedrooms: 3, bathrooms: 2, ytdGrowth: 6.1 },
  { id: "PH-103", location: "Seattle", neighborhood: "Capitol Hill", priceTier: "Premium", size: "Large", price: 785000, squareFootage: 2100, bedrooms: 4, bathrooms: 3, ytdGrowth: 7.8 },
  { id: "PH-104", location: "Seattle", neighborhood: "Ballard", priceTier: "Mid", size: "Medium", price: 610000, squareFootage: 1750, bedrooms: 3, bathrooms: 2, ytdGrowth: 5.9 },
  { id: "PH-105", location: "Boston", neighborhood: "Back Bay", priceTier: "Luxury", size: "Large", price: 980000, squareFootage: 2350, bedrooms: 4, bathrooms: 3, ytdGrowth: 9.4 },
  { id: "PH-106", location: "Boston", neighborhood: "Cambridge", priceTier: "Premium", size: "Medium", price: 730000, squareFootage: 1980, bedrooms: 3, bathrooms: 2, ytdGrowth: 7.2 },
];

const chartData = [
  { name: "Austin", value: 578000 },
  { name: "Seattle", value: 698000 },
  { name: "Boston", value: 855000 },
  { name: "Denver", value: 612000 },
  { name: "Miami", value: 834000 },
];

const initialFilters: Filters = { location: "", priceTier: "", size: "" };

export default function MarketAnalysisPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [properties, setProperties] = useState<MarketProperty[]>(defaultProperties);
  const [summary, setSummary] = useState({ totalProperties: 6, averagePrice: 704000, averageSquareFootage: 1880, medianPrice: 671000, monthlyGrowth: 6.8, marketHealth: "Strong" });
  const [scenario, setScenario] = useState({ location: "Austin", priceTier: "Mid", squareFootage: 1800, bedrooms: 3, bathrooms: 2, priceDeltaPct: 8 });
  const [scenarioResult, setScenarioResult] = useState<{ projectedPrice: number; delta: number; recommendation: string } | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_MARKET_ANALYSIS_URL || "http://localhost:8080";
      try {
        const [summaryResponse, propertyResponse] = await Promise.all([
          fetch(`${baseUrl}/api/market/summary`),
          fetch(`${baseUrl}/api/market/properties`),
        ]);

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        }

        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json();
          if (Array.isArray(propertyData) && propertyData.length) {
            setProperties(propertyData);
          }
        }
      } catch {
        setProperties(defaultProperties);
      }
    };

    void fetchMarketData();
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const locationMatch = !filters.location || property.location === filters.location;
      const priceTierMatch = !filters.priceTier || property.priceTier === filters.priceTier;
      const sizeMatch = !filters.size || property.size === filters.size;
      return locationMatch && priceTierMatch && sizeMatch;
    });
  }, [filters, properties]);

  const handleScenarioSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const baseUrl = process.env.NEXT_PUBLIC_MARKET_ANALYSIS_URL || "http://localhost:8080";

    try {
      const response = await fetch(`${baseUrl}/api/market/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: scenario.location,
          priceTier: scenario.priceTier,
          squareFootage: scenario.squareFootage,
          bedrooms: scenario.bedrooms,
          bathrooms: scenario.bathrooms,
          priceDeltaPct: scenario.priceDeltaPct,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScenarioResult({ projectedPrice: Number(data.projectedPrice), delta: Number(data.delta), recommendation: data.recommendation });
        return;
      }
    } catch {
      // no-op: fallback below
    }

    const currentAverage = filteredProperties.length
      ? filteredProperties.reduce((sum, property) => sum + property.price, 0) / filteredProperties.length
      : 640000;
    const projected = currentAverage * (1 + scenario.priceDeltaPct / 100);
    setScenarioResult({
      projectedPrice: projected,
      delta: projected - currentAverage,
      recommendation: projected > currentAverage ? "Accelerate pricing and highlight premium finishes." : "Consider competitive concessions to improve absorption.",
    });
  };

  const downloadCsv = () => {
    const rows = filteredProperties.map((property) => [property.id, property.location, property.neighborhood, property.priceTier, property.size, property.price].join(","));
    const blob = new Blob(["id,location,neighborhood,priceTier,size,price\n", ...rows.map((row) => `${row}\n`)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "market-data.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const content = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 104 >>\nstream\nBT\n/F1 12 Tf\n30 100 Td\n(Market Analysis Export) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000062 00000 n\n0000000123 00000 n\n0000000248 00000 n\n0000000615 00000 n\ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n698\n%%EOF";
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "market-data.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-grid">
      <section className="panel wide-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">App 2</p>
            <h2>Property Market Analysis</h2>
          </div>
          <span className="chip success">{summary.marketHealth}</span>
        </div>

        <div className="filter-row">
          <select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}>
            <option value="">All locations</option>
            <option value="Austin">Austin</option>
            <option value="Seattle">Seattle</option>
            <option value="Boston">Boston</option>
          </select>
          <select value={filters.priceTier} onChange={(event) => setFilters({ ...filters, priceTier: event.target.value })}>
            <option value="">All tiers</option>
            <option value="Mid">Mid</option>
            <option value="Premium">Premium</option>
            <option value="Luxury">Luxury</option>
          </select>
          <select value={filters.size} onChange={(event) => setFilters({ ...filters, size: event.target.value })}>
            <option value="">All sizes</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
        </div>

        <div className="kpi-strip">
          <div className="kpi-box">
            <span>Total Properties</span>
            <strong>{summary.totalProperties}</strong>
          </div>
          <div className="kpi-box">
            <span>Average Price</span>
            <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(summary.averagePrice)}</strong>
          </div>
          <div className="kpi-box">
            <span>Median Price</span>
            <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(summary.medianPrice)}</strong>
          </div>
          <div className="kpi-box">
            <span>Monthly Growth</span>
            <strong>{summary.monthlyGrowth}%</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <h3>Market trend by city</h3>
        </div>
        <div className="chart-box small-chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Price"]} />
              <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <h3>What-if analysis</h3>
        </div>

        <form className="scenario-form" onSubmit={handleScenarioSubmit}>
          <label>
            Location
            <input value={scenario.location} onChange={(event) => setScenario({ ...scenario, location: event.target.value })} />
          </label>
          <label>
            Price delta %
            <input type="number" value={scenario.priceDeltaPct} onChange={(event) => setScenario({ ...scenario, priceDeltaPct: Number(event.target.value) })} />
          </label>
          <label>
            Square footage
            <input type="number" value={scenario.squareFootage} onChange={(event) => setScenario({ ...scenario, squareFootage: Number(event.target.value) })} />
          </label>
          <label>
            Bedrooms
            <input type="number" value={scenario.bedrooms} onChange={(event) => setScenario({ ...scenario, bedrooms: Number(event.target.value) })} />
          </label>
          <button type="submit" className="primary-button">Run scenario</button>
        </form>

        {scenarioResult && (
          <div className="scenario-result">
            <div>
              <span>Projected price</span>
              <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(scenarioResult.projectedPrice)}</strong>
            </div>
            <div>
              <span>Delta</span>
              <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(scenarioResult.delta)}</strong>
            </div>
            <p>{scenarioResult.recommendation}</p>
          </div>
        )}
      </section>

      <section className="panel wide-panel">
        <div className="section-header">
          <div>
            <h3>Market data table</h3>
          </div>
          <div className="inline-actions">
            <button type="button" className="secondary-button" onClick={downloadCsv}>CSV</button>
            <button type="button" className="secondary-button" onClick={downloadPdf}>PDF</button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Location</th>
              <th>Tier</th>
              <th>Size</th>
              <th>Price</th>
              <th>Sqft</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((property) => (
              <tr key={property.id}>
                <td>{property.id}</td>
                <td>{property.location}</td>
                <td>{property.priceTier}</td>
                <td>{property.size}</td>
                <td>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(property.price)}</td>
                <td>{property.squareFootage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
