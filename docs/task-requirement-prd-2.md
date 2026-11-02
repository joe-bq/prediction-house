# Task 2: Multi-Application Next.js Portal

# Objective:

Create a unified Next.js portal that hosts two independent applications with different backend technologies, both capable of interacting with the ML model from Task 1.

 
# Portal Structure Requirements:

    1. Unified Naviga on & Layout:
        a. Implement a shared layout with naviga on between applications
        b. Use Next.js App Router for rou ng between and within applications
        c. Create a consistent design system across both applications
        d. Properly handle loading and error states at the layout level
    2. App 1: Property Value Es mator (Python Backend)
        a. Frontend:
            i. Create a form for inpu ng property details (all fields from the model)
            ii. Implement client-side valida on with appropriate error messages
            iii. Display predic on results in both tabular format and visual chart
            iv. Implement a history feature showing previous estimates
            v. Create a comparison view to analyse multiple proper es side-by-side
        b. Backend (Python):
            i. Handle form submissions
            ii. Integrate with regression model container from Task 1
            iii. Implement data valida on and error handling
    3. App 2: Property Market Analysis (Java Backend)
        a. Frontend:
            i. Create an interac ve dashboard with property market visualisa ons
            ii. Implement filters for analysing different property segments
            iii. Build a "what-if" analysis tool using the model
            iv. Provide data export op ons (CSV, PDF)
            v. Create responsive data tables with sor ng/filtering
        b. Backend (Java):
            i. Create REST API endpoints for market analysis
            ii. Generate aggregate sta s cs from the housing dataset
            iii. Integrate with the ML model container from Task 1
            iv. Implement caching for performance op misa on

# Technical Requirements:
    1. Next.js Implementa on:
        a. Use App Router
        b. Implement server components and client components appropriately
        c. Use React Server Components for initial data loading
        d. Implement proper data fetching strategies
        e. Create custom hooks for shared func onality
    2. UI/UX Requirements:
        a. Create responsive layouts using Tailwind CSS
        b. Implement accessible UI components following WCAG guidelines
        c. Use appropriate loading states and error boundaries
        d. Create smooth transi ons between pages and Application states
        e. Design a cohesive UI that follows modern design principles
    3. State Management & Data Flow:
        a. Implement appropriate client-side state management
        b. Handle form state effectively with valida on
        c. Create effecient data fetching pa erns
        d. Properly manage API communica on and error states
    4. Code Quality & Organisation:
        a. Structure the codebase following Next.js best prac ces

# Technical Constraints:
    - Python 3.12+
    - FastAPI
    - Java 21
    - Spring Boot 3.4.4

# Deliverables:
    1- Source code in github
    2- Ability to show this live during interview


# Other

you can find the code for task 1 deliverable from [house-prediction project](../house-prediction/)