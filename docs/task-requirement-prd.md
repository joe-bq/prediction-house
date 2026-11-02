# Task 2: Multi-Application Next.js Portal

## Objective
Create a unified Next.js portal that hosts two independent applications powered by different backend technologies, both capable of interacting with the ML model developed in Task 1.

## Portal Structure & Requirements

### 1. Unified Navigation & Layout
* **Shared Layout:** Implement a shared layout providing seamless navigation between both applications.
* **Routing:** Use the Next.js App Router for routing between and within applications.
* **Design System:** Create a consistent design system and component library across both applications.
* **State Management:** Properly handle loading and error states at the layout level using Next.js error boundaries and loading states.

### 2. App 1: Property Value Estimator (Python Backend)
* **Frontend Requirements:**
  * **Input Form:** Create a comprehensive form for inputting property details, capturing all features required by the ML model.
  * **Validation:** Implement client-side validation with appropriate error messages.
  * **Data Visualization:** Display prediction results in both a tabular format and an interactive visual chart.
  * **Estimation History:** Implement a persistence feature showing previous property value estimates.
  * **Side-by-Side Comparison:** Create a comparison view to analyze multiple properties simultaneously.
* **Backend Requirements (Python):**
  * **Submission Handling:** Process frontend form submissions securely.
  * **Model Integration:** Integrate directly with the regression model container from Task 1.
  * **Server-Side Validation:** Implement data validation and robust error handling.

### 3. App 2: Property Market Analysis (Java Backend)
* **Frontend Requirements:**
  * **Interactive Dashboard:** Create a dashboard featuring comprehensive property market visualizations.
  * **Market Filtering:** Implement filters for analyzing different property segments (e.g., location, price tier, size).
  * **"What-If" Analysis:** Build a "what-if" scenario simulation tool powered by the ML model.
  * **Data Export:** Provide data export options for data sets in CSV and PDF formats.
  * **Data Tables:** Create responsive data tables featuring server-side or client-side sorting and filtering.
* **Backend Requirements (Java):**
  * **REST API:** Create robust REST API endpoints to serve market analysis data.
  * **Aggregate Statistics:** Generate real-time and aggregate statistics from the underlying housing dataset.
  * **Model Integration:** Integrate with the ML model container from Task 1.
  * **Caching Layer:** Implement a caching mechanism to optimize repetitive query performance and reduce model latency.


### Other

you can find the code for task 1 deliverable from [house-prediction project](../house-prediction/)