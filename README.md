# Student Management System

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)

A full-stack web application for managing students in an educational program, featuring an admin dashboard for monitoring student progress and a student portal for individual progress tracking.

## ✨ Features

### Admin Dashboard
- 📊 Real-time student statistics (total, on track, at risk, monitor)
- 📈 Snapshot comparison with historical data
- 📉 Percentage change indicators
- 🔍 Active student filtering and search

### Analytics
- 📊 Overall analytics with interactive charts (ApexCharts)
- 👥 Cohort-specific analytics
- ✅ Attendance tracking (workshops, standups, mentoring)
- 📈 Progress visualization

### Student Management
- 📥 CSV bulk import with validation
- 📋 Student list with filtering and search
- 👤 Individual student detail pages
- 🏷️ Cohort and season management

### Student Portal
- 🎯 Personal progress tracking
- 📅 Google Calendar integration
- 🗺️ Program roadmap view
- ⏰ Project deadline timeline

## 📋 Prerequisites

- **Node.js** >= 18.x
- **npm** or **pnpm** (recommended)
- **Supabase** account for database
- **Google Cloud** credentials (for OAuth and Calendar)

## 🔧 Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Google OAuth (configured in Supabase)
# Set up Google OAuth provider in Supabase Dashboard

# Optional: Google Sheets Integration (for automated data sync)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Set up the required tables (students, cohorts, seasons, programs, etc.)
3. Enable Google OAuth in Authentication > Providers
4. Copy your project URL and anon key to `.env`

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/student-management-system.git
cd student-management-system

# Install dependencies
npm install
# or
pnpm install
```

## 💻 Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
# or
pnpm dev
```

## 🏗️ Production

Build the application for production:

```bash
npm run build
# or
pnpm build
```

Preview production build locally:

```bash
npm run preview
# or
pnpm preview
```

Start the production server:

```bash
npm run start
# or
pnpm start
```

## 📁 Project Structure

```
Final_Project/
├── pages/              # Vue pages for routing
├── components/         # Reusable Vue components
├── composables/        # Vue composables for logic reuse
├── server/api/         # Backend API endpoints
├── middleware/         # Route middleware for authentication
├── layouts/            # Application layouts
├── assets/             # CSS and static assets
├── public/             # Public files
├── scripts/            # Utility scripts (Python and Node.js)
├── utils/              # Utility functions
└── plugins/            # Nuxt plugins
```

## 📸 Screenshots

<!-- Add your screenshots here -->

### Admin Dashboard
*Screenshot placeholder: Add admin dashboard screenshot*

### Student Portal
*Screenshot placeholder: Add student portal screenshot*

### Analytics View
*Screenshot placeholder: Add analytics screenshot*

## 🛠️ Tech Stack

- **Framework:** [Nuxt 4](https://nuxt.com/) with [Vue 3](https://vuejs.org/)
- **Language:** TypeScript
- **Styling:** [TailwindCSS](https://tailwindcss.com/)
- **UI Components:** [@nuxt/ui](https://ui.nuxt.com/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication:** Supabase Auth with Google OAuth
- **Charts:** [ApexCharts](https://apexcharts.com/)
- **Calendar:** [Schedule-X](https://schedule-x.dev/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Soraia**

---

For detailed technical documentation, see [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md).
