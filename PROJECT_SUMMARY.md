# Student Management System - Project Summary

## Overview

**Project Name:** Student Management System
**Tech Stack:** Nuxt 4, Vue 3, Supabase, TailwindCSS, TypeScript
**UI Framework:** @nuxt/ui Dashboard Components

A full-stack web application for managing students in an educational program, featuring an admin dashboard for monitoring student progress and a student portal for individual progress tracking.

---

## Project Structure

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

---

## Pages & Routes

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Login page with Google OAuth |
| `/auth/confirm` | OAuth callback handler |

### Admin Section (Protected)
| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Main admin dashboard with student statistics |
| `/admin/analytics/overall` | Overall analytics view |
| `/admin/analytics/cohort` | Cohort-specific analytics |
| `/admin/managment/students` | Student management and import |
| `/admin/managment/seasons` | Season management |
| `/admin/managment/pcs-projects` | Project management |
| `/admin/cohorts` | Cohort management |
| `/admin/settings/admins` | Admin user management |
| `/admin/settings/notifications` | Notification configuration |
| `/admin/students/[id]` | Student detail page |

### Student Section (Protected)
| Route | Description |
|-------|-------------|
| `/students/dashboard` | Student dashboard with progress tracking |
| `/students/calendar` | Google Calendar integration |
| `/students/roadmap` | Program roadmap view |
| `/timeline` | Timeline view for project deadlines |

---

## Key Features

### Admin Dashboard
- Real-time student statistics (total, on track, at risk, monitor)
- Snapshot comparison with historical data
- Percentage change indicators
- Active student filtering

### Analytics
- Overall analytics with charts (ApexCharts)
- Cohort-specific analytics
- Attendance tracking (workshops, standups, mentoring)
- Progress visualization

### Student Management
- CSV bulk import with validation
- Student list with filtering and search
- Individual student detail pages
- Project completion tracking
- Season progress tracking
- Status monitoring (On Track / Monitor / At Risk)

### Cohort Management
- Create/update cohorts
- Program association
- Active status toggle
- Meeting ID tracking

### Notification System
- Email notifications (via Nodemailer/Gmail SMTP)
- Slack webhook integration
- Status change alerts (At Risk, Monitor)
- Test notification functionality
- Configurable notification settings

### Student Portal
- Dashboard with progress overview
- Program roadmap visualization
- Season-by-season progress
- Project completion tracking
- Google Calendar widget
- Deadline alerts

---

## API Endpoints

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/add` | Add new admin users |
| GET | `/api/admin/list` | List all admins |
| POST | `/api/admin/remove` | Remove admin user |
| POST | `/api/admin/check` | Check if user is admin |

### Cohort Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cohorts` | Get all cohorts |
| POST | `/api/cohorts/create` | Create new cohort |
| POST | `/api/cohorts/update-status` | Toggle cohort status |

### Student Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/[id]` | Get student details |
| POST | `/api/students/import` | Bulk import students |
| GET | `/api/students/[id]/project-completions` | Get completed projects |
| GET | `/api/students/[id]/season-progress` | Get season progress |

### Dashboard & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard-students` | Get all students for admin |
| GET | `/api/snapshot` | Get progress snapshots |
| GET | `/api/snapshot-history` | Get historical data |
| GET | `/api/attendance` | Get attendance stats |
| GET | `/api/attendance_by_cohort` | Attendance by cohort |

### Student Portal Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/dashboard` | Student dashboard data |
| GET | `/api/student/roadmap` | Student program roadmap |
| GET | `/api/student/calendar-events` | Google Calendar events |
| GET | `/api/student/timeline-seasons` | Timeline seasons |
| GET | `/api/student/timeline-projects` | Timeline projects |

### Notification Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/send-email` | Send email notification |
| POST | `/api/notifications/send-slack` | Send Slack notification |
| POST | `/api/notifications/test` | Test notifications |
| POST | `/api/notifications/monitor-status` | Monitor status alerts |

---

## Composables

| Composable | Purpose |
|------------|---------|
| `useAuth` | Authentication & role management |
| `useCachedFetch` | Data caching utilities |
| `useCacheInvalidation` | Cache management & invalidation |
| `useAdminApi` | Admin-specific API operations |
| `useNotifications` | Toast notification system |
| `useNotificationSettings` | Notification configuration |
| `useStudents` | Student data management |
| `useCohorts` | Cohort management |
| `useSeasons` | Season management |
| `useProjects` | Project management |
| `useStudentDetails` | Individual student data |
| `useAttendance` | Attendance tracking |
| `useValidation` | Form validation utilities |

---

## Database Tables (Supabase)

| Table | Description |
|-------|-------------|
| `students` | Student records with profile data |
| `admin` | Admin user records |
| `cohorts` | Cohort definitions |
| `programs` | Program/Track definitions |
| `seasons` | Learning seasons |
| `projects` | Projects within seasons |
| `program_cohort_seasons` | Links programs, cohorts, and seasons |
| `student_season_progress` | Student progress tracking |
| `student_project_completion` | Project completion tracking |
| `progress_snapshots` | Historical progress snapshots |
| `cohort_meeting_stats` | Meeting statistics |
| `cohort_meetings` | Meeting schedule info |
| `meeting_types` | Meeting type definitions |
| `notification_settings` | Email/Slack configuration |

---

## Authentication & Authorization

### Authentication
- **Provider:** Supabase with Google OAuth
- **Scopes:** Google Calendar read access
- **Tokens:** Access & refresh tokens stored in localStorage

### Middleware
| Middleware | Purpose |
|------------|---------|
| `auth.global.ts` | Global authentication check |
| `admin.ts` | Admin-only route protection |
| `student-only.ts` | Student-only route protection |
| `guest.js` | Guest-only access (login page) |

### Role System
- **Admin:** Full access to admin dashboard and management features
- **User/Student:** Access to student portal only

---

## External Integrations

### Google Integration
- **Google OAuth** - User authentication
- **Google Calendar API** - Read student calendar events
- Token refresh mechanism for expired tokens

### Slack Integration
- Webhook-based notifications
- Status change alerts (At Risk, Monitor students)
- Rich message formatting with blocks

### Email Integration
- Nodemailer with Gmail SMTP
- HTML-formatted status alerts
- Configurable recipients

---

## Caching System

### Cache Keys
```typescript
CACHE_KEYS = {
  // Admin data
  PROGRAMS, COHORTS, SEASONS, ATTENDANCE, STUDENTS, DASHBOARD_STUDENTS, SNAPSHOT,

  // Student details (dynamic)
  studentDetails(id), studentProjects(id), studentSeasons(id),

  // Student portal
  STUDENT_DASHBOARD, STUDENT_ROADMAP, STUDENT_SEASON_PROGRESS,
  STUDENT_CALENDAR_TODAY, STUDENT_CALENDAR_WEEK, STUDENT_CALENDAR_MONTH,
  STUDENT_TIMELINE_SEASONS, studentTimelineProjects(seasonId)
}
```

### Caching Strategy
- Nuxt payload-based caching via `useFetch` with `getCachedData`
- Manual cache invalidation with `delete nuxtApp.payload.data[key]`
- Automatic refresh with `refreshNuxtData(key)`

---

## Scripts & Utilities

### Python Scripts (`/scripts`)
- `data_processor.py` - Data processing utilities
- `analytics.py` - Analytics calculations
- `student_management.py` - Student data management
- `update_points_assigned.py` - Points assignment updates

### Node.js Scripts
- `update_slack_ids.js` - Updates student Slack IDs from CSV

---

## Configuration

### Environment Variables
```env
# Supabase
SUPABASE_URL=
SUPABASE_KEY=

# Google OAuth
NUXT_PUBLIC_GOOGLE_CLIENT_ID=
NUXT_PUBLIC_GOOGLE_CLIENT_SECRET=

# Email (Nodemailer)
NUXT_NODEMAILER_HOST=
NUXT_NODEMAILER_AUTH_USER=
NUXT_NODEMAILER_AUTH_PASS=
```

### Theme Configuration
- **Primary Color:** Glacier (blue)
- **Neutral Color:** Zinc
- **Color Mode:** Light/Dark support

---

## Development

### Available Scripts
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run generate      # Generate static site
npm run preview       # Preview production build
```

### Key Dependencies
- `@nuxt/ui` v4.0.1 - UI framework
- `@schedule-x/vue` - Calendar component
- `apexcharts` - Charts library
- `@vueuse/nuxt` - Vue utilities
- `nuxt-nodemailer` - Email sending
- `canvas-confetti` - Celebrations

---

## Security Features

- Role-Based Access Control (Admin vs Student)
- Route middleware protection
- Server-side auth checks on all API endpoints
- Environment variables for sensitive data
- Supabase Row Level Security
- OAuth token refresh mechanism

---

## Performance Optimizations

1. **Caching** - Prevents unnecessary API calls
2. **Lazy fetching** - Data fetched on demand
3. **Payload-based state** - Leverages Nuxt's built-in caching
4. **Image proxy** - Centralized image handling
5. **Component Islands** - Experimental feature enabled
6. **Icon bundling** - Optimized icon loading via @nuxt/icon
