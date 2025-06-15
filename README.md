Project: SARA - Smart Analysis and Research Assistant
A Modular Platform for Real-Time and Historical Data Analytics in Smart Environments

📌 Overview
SARA (Smart Analysis and Research Assistant) is a collaborative research project developed by ISTIC (Tunisia) and Aizu University (Japan). It addresses the limitations of commercial analytics platforms by providing a domain-agnostic, microservice-based framework tailored for academic research in smart environments (e.g., smart campuses, museums). SARA unifies real-time sensor data, historical archives, and custom datasets into a single analytical workflow, empowering researchers to study human-environment interactions with unprecedented flexibility.

🎯 Key Objectives
Unified Data Integration:

Ingest live sensor streams (temperature, occupancy, noise, etc.) from IoT networks across facilities (ISTIC, Aizu University, Fukushima Museum).

Integrate researcher-uploaded custom datasets (CSV/JSON) with schema validation and visibility controls (private/public/restricted).

Real-Time & Historical Analysis:

Live Dashboards: Monitor sensor data with dynamic controls (pause/resume streams, adjust metrics, set aggregation windows).

Historical Visualization: Explore trends across temporal hierarchies (minute → yearly) and spatial layers (facility → sensor box).

Extensibility & Security:

Modular architecture allows seamless addition of new data sources or analytical modules.

JWT-based authentication, role-based access, and encrypted communication (HTTPS/TLS).

User-Centric Interfaces:

Interactive tools for data correlation, annotation, export (CSV/JSON), and reproducible experiments.
🚀 Core Features
Module	Functionality
Real-Time Monitoring:	Live SSE streams for occupancy, environmental (humidity, luminance), and thermal data. Dynamic controls for metrics (mean/max/sum) and visualization.
Historical Analysis:	Drill-down/roll-up across time/location hierarchies. Cross-sensor correlation (e.g., noise vs. occupancy). Support for statistical operators (skewness, median).
Custom Datasets:	Upload, validate (JSON Schema), and manage datasets. Share via granular visibility rules (private/public/collaborators).
Admin Management:	CRUD operations for reference data (sites, locations, sensor boxes, types). Dynamic propagation to all interfaces.
🛠️ Technology Stack
Frontend: Angular, Apache ECharts (visualizations)

Backend:

Spring Boot (API gateway, authentication).

FastAPI (microservices for real-time/historical processing).

Data Layer: Redis (caching), PostgreSQL (metadata/datasets).

Infrastructure: Docker (containerization), GitHub (CI/CD).

Security: JWT, OWASP-compliant practices, BCrypt password hashing.

🌟 Impact
Academic Research: Enables reproducible, cross-disciplinary studies (e.g., correlating classroom environmental data with student behavior).

Scalability: Handles 525k+ sensor data points/year with adaptive caching (Redis) and hierarchical aggregation.

Avoids Vendor Lock-in: Open-source modular design replaces monolithic commercial BI tools.

📚 Future Work
Integration of pre-trained ML models (e.g., activity classifiers).

Enhanced statistical options (percentiles, entropy) and visualizations (violin plots).

Automated experiment snapshots for reproducibility.

Supervisors:

Academic: Prof. Asma Najjar (ISTIC)
Professional: Prof. Rentaro Yoshioka (Aizu University)

Institutions: ISTIC (Tunisia) & University of Aizu (Japan)
