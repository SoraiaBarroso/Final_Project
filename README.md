# Student Management System

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82?logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)

A full-stack web application for managing students in an educational program, featuring an admin dashboard for monitoring student progress and a student portal for individual progress tracking.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Data Pipeline](#data-pipeline)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Problem Statement

Educational institutions managing coding bootcamps face challenges in:

1. **Tracking Student Progress**: Monitoring individual student advancement through multi-season programs with multiple projects
2. **Early Risk Detection**: Identifying students falling behind before they become at-risk of not completing the program
3. **Data Aggregation**: Consolidating data from multiple sources (Qwasar platform, attendance records, calendar events)
4. **Real-time Visibility**: Providing administrators with actionable insights and students with self-service progress tracking

This application solves these challenges by providing a unified platform that:
- Automatically syncs student data from the Qwasar learning platform
- Calculates student status based on expected vs actual progress
- Sends notifications when students fall behind
- Provides both admin and student-facing dashboards

---

## Features

### Admin Dashboard
- Real-time student statistics (total, on track, at risk, monitor)
- Snapshot comparison with historical data
- Percentage change indicators
- Active student filtering and search
- Cohort and program management

### Analytics
- Overall analytics with interactive charts (ApexCharts)
- Cohort-specific analytics and comparisons
- Attendance tracking (workshops, standups, mentoring)
- Progress visualization over time
- Status distribution breakdown

### Student Management
- CSV bulk import with validation
- Student list with filtering and search
- Individual student detail pages with:
  - Project completion tracking
  - Season progress visualization
  - Expected vs current season comparison
- Cohort and season assignment management

### Student Portal
- Personal progress tracking dashboard
- Google Calendar integration for events
- Program roadmap with season/project completion
- Project deadline timeline visualization
- Downloadable student ID card

### Automated Data Pipeline
- Web scraping from Qwasar platform
- Automated status calculations
- Progress snapshot generation
- Email and Slack notifications for status changes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Admin Portal   │  │ Student Portal  │  │  Public Pages   │ │
│  │  (Vue 3/Nuxt)   │  │  (Vue 3/Nuxt)   │  │  (Landing)      │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Nuxt Server)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Admin APIs  │  │Student APIs │  │ Notification APIs       │ │
│  │ /api/admin  │  │ /api/student│  │ /api/notifications      │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    Supabase     │  │ Google Calendar │  │  Slack/Email    │ │
│  │   (PostgreSQL)  │  │      API        │  │   Webhooks      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          ▲
          │
┌─────────┴───────────────────────────────────────────────────────┐
│                   Data Pipeline (Python)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Scraper    │  │  Processor  │  │  Analytics Generator    │ │
│  │ (Qwasar)    │  │ (Updates)   │  │  (Snapshots)            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Data Collection**: Python scripts scrape student data from Qwasar platform
2. **Data Processing**: Updates student records, project completions, season progress
3. **Status Calculation**: PostgreSQL functions determine student status (on_track, at_risk, monitor)
4. **Snapshot Generation**: Analytics scripts create progress snapshots for dashboards
5. **Notification**: Status changes trigger email/Slack alerts to administrators

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | [Nuxt](https://nuxt.com/) | 3.x |
| **Frontend** | [Vue.js](https://vuejs.org/) | 3.x |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.x |
| **Styling** | [TailwindCSS](https://tailwindcss.com/) | 3.x |
| **UI Components** | [@nuxt/ui](https://ui.nuxt.com/) | Latest |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | - |
| **Authentication** | Supabase Auth + Google OAuth | - |
| **Charts** | [ApexCharts](https://apexcharts.com/) | - |
| **Calendar** | [Schedule-X](https://schedule-x.dev/) | - |
| **Data Pipeline** | Python | 3.12 |
| **Web Scraping** | BeautifulSoup4 | - |

---

## Project Structure

```
Final_Project/
├── .github/                 # GitHub Actions workflows
│   └── workflows/           # CI/CD automation
├── assets/                  # CSS and static assets
├── components/              # Reusable Vue components
│   ├── admin/               # Admin-specific components
│   │   ├── charts/          # Chart components
│   │   ├── cohorts/         # Cohort management
│   │   ├── modals/          # Modal dialogs
│   │   └── student_details/ # Student detail views
│   └── students/            # Student portal components
├── composables/             # Vue composables for logic reuse
│   ├── useAuth.ts           # Authentication logic
│   ├── useStudents.ts       # Student data management
│   ├── useCohorts.ts        # Cohort data management
│   └── ...                  # Other composables
├── layouts/                 # Application layouts
├── middleware/              # Route middleware
│   ├── auth.global.ts       # Global auth guard
│   ├── admin.ts             # Admin-only routes
│   └── student-only.ts      # Student-only routes
├── pages/                   # Vue pages (file-based routing)
│   ├── admin/               # Admin dashboard pages
│   └── students/            # Student portal pages
├── plugins/                 # Nuxt plugins
├── public/                  # Public static files
├── scripts/                 # Data pipeline scripts (Python)
│   ├── data_processor.py    # Qwasar scraping & data updates
│   ├── student_management.py# Status calculations
│   ├── analytics.py         # Snapshot generation
│   ├── main.py              # Pipeline orchestrator
│   └── utils.py             # Shared utilities
├── server/                  # Backend API
│   └── api/                 # API endpoints
│       ├── admin/           # Admin endpoints
│       ├── student/         # Student endpoints
│       └── notifications/   # Notification endpoints
├── utils/                   # Utility functions
├── .env                     # Environment variables (not committed)
├── nuxt.config.ts           # Nuxt configuration
├── package.json             # Node.js dependencies
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** or **pnpm** (recommended)
- **Python** >= 3.10 (for data pipeline)
- **Supabase** account for database
- **Google Cloud** credentials (for OAuth and Calendar)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/SoraiaBarroso/Final_Project.git
cd Final_Project

# Install Node.js dependencies
npm install
# or
pnpm install

# Install Python dependencies (for data pipeline)
pip install -r requirements.txt
```

---

## Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (configured in Supabase Dashboard)
# Enable Google OAuth provider in Authentication > Providers

# Data Pipeline (Qwasar Scraping)
SCRAPER_USERNAME=your_qwasar_username
SCRAPER_PASSWORD=your_qwasar_password

# Notifications (Optional)
SMTP_HOST=smtp.example.com
SMTP_USER=your_email
SMTP_PASS=your_password
SLACK_WEBHOOK_URL=your_slack_webhook
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database migrations (SQL scripts for tables)
3. Enable Google OAuth in Authentication > Providers
4. Copy your project URL and keys to `.env`

---

## Running the Application

### Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
# or
pnpm dev
```

### Production

Build and run for production:

```bash
# Build
npm run build

# Preview locally
npm run preview

# Start production server
npm run start
```

---

## Data Pipeline

The Python scripts in `/scripts` automate data synchronization:

```bash
# Full pipeline (scrape + process + analytics)
python scripts/main.py --full --scrape

# Quick update (management + analytics only)
python scripts/main.py --quick

# Individual operations
python scripts/data_processor.py --scrape    # Scrape from Qwasar
python scripts/data_processor.py --projects  # Update project completions
python scripts/student_management.py --status # Update student status
python scripts/analytics.py --snapshot       # Create progress snapshot
```

### GitHub Actions Automation

The pipeline runs automatically via GitHub Actions:
- **Daily**: Data sync at 6:00 AM UTC
- **Weekly**: Full scraping on Sundays at 2:00 AM UTC

See [scripts/README.md](scripts/README.md) for detailed pipeline documentation.

---

## API Documentation

The application exposes RESTful API endpoints:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Admin** | `/api/admin/*` | Admin user management |
| **Students** | `/api/students/*` | Student CRUD operations |
| **Dashboard** | `/api/dashboard-*` | Dashboard data |
| **Attendance** | `/api/attendance*` | Attendance metrics |
| **Notifications** | `/api/notifications/*` | Email/Slack alerts |
| **Student Portal** | `/api/student/*` | Authenticated student data |

For complete API documentation, see [CODEBASE_DOCUMENTATION.md](CODEBASE_DOCUMENTATION.md).

---

## Screenshots

### Admin Dashboard
*Overview of student statistics with status distribution and trends*

![Admin Dashboard](img/admin-dashboard.png)

### Student Analytics
*Cohort-level analytics with attendance and progress charts*

![Analytics](img/analytics.png)

### Student Portal - Roadmap
*Student's program roadmap showing season and project completion*

![Student Roadmap](img/student-roadmap.png)

### Student Portal - Calendar
*Integrated Google Calendar view for upcoming events*

![Student Calendar](img/student-calendar.png)

> **Note**: Add screenshots to the `img/` folder and update the paths above.

---

## Future Improvements

- [ ] **Real-time Updates**: Implement WebSocket connections for live dashboard updates
- [ ] **Mobile App**: React Native companion app for students
- [ ] **Advanced Analytics**: Machine learning predictions for at-risk students
- [ ] **Multi-language Support**: i18n for internationalization
- [ ] **Export Features**: PDF reports and CSV exports for administrators
- [ ] **Notification Preferences**: Allow users to customize notification frequency
- [ ] **Integration APIs**: Connect with more learning platforms beyond Qwasar
- [ ] **Gamification**: Add badges and achievements for student motivation

---

## Contributing

Contributions are welcome! Please follow these guidelines:

### Branching Strategy

| Branch Type | Naming Convention | Purpose |
|-------------|-------------------|---------|
| `main` | - | Production-ready code |
| `develop` | - | Integration branch |
| `feature/*` | `feature/add-user-auth` | New features |
| `bugfix/*` | `bugfix/fix-login-error` | Bug fixes |
| `hotfix/*` | `hotfix/security-patch` | Urgent production fixes |

### Commit Messages

Use clear, descriptive commit messages:
```
feat: add student export functionality
fix: resolve calendar sync issue
docs: update API documentation
refactor: simplify authentication flow
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes with clear commits
4. Ensure tests pass (if applicable)
5. Submit a PR with a clear description

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Soraia Barroso**

- GitHub: [@SoraiaBarroso](https://github.com/SoraiaBarroso)

---

## References

- [Nuxt Documentation](https://nuxt.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vue.js Documentation](https://vuejs.org/guide)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
