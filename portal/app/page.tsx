import Link from "next/link";

const appCards = [
  {
    title: "Property Value Estimator",
    description:
      "Submit property details, validate fields, and review a price estimate plus historical comparisons.",
    href: "/property-estimator",
    tag: "Python + ML",
  },
  {
    title: "Property Market Analysis",
    description:
      "Explore segment-level price trends, run scenario planning, and export filtered data sets.",
    href: "/market-analysis",
    tag: "Java + Analytics",
  },
  {
    title: "Task 1 Model Integration",
    description:
      "Both apps reuse the same house-price regression model container and shared contract definitions.",
    href: "/",
    tag: "Single source of truth",
  },
];

export default function HomePage() {
  return (
    <div className="landing-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Unified portfolio</p>
          <h2>Property intelligence for pricing and market planning</h2>
        </div>
        <p className="hero-copy">
          This portal hosts two independent applications backed by different service stacks while
          sharing the same ML-driven underwriting workflow and a consistent user experience.
        </p>
      </section>

      <div className="card-grid">
        {appCards.map((card) => (
          <Link key={card.title} href={card.href} className="info-card">
            <span className="chip">{card.tag}</span>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
