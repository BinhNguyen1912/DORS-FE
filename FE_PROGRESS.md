# DORS-FE - Disaster Emergency Response System Frontend

## Project Overview

DORS-FE is a frontend application built with React, TypeScript, Vite, and TailwindCSS for managing disaster emergency response operations. The system includes features for rescue team management, household tracking, donation management, disaster monitoring, and system settings.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.6 | UI Framework |
| TypeScript | ~6.0.2 | Type Safety |
| Vite | 8.0.12 | Build Tool |
| TailwindCSS | 4.3.0 | Styling |
| React Router | 7.17.0 | Routing |
| TanStack Query | 5.101.0 | Server State |
| Zustand | 5.0.14 | Client State |
| Leaflet | 1.9.4 | Maps |
| React Hook Form | 7.78.0 | Form Handling |
| Zod | 4.4.3 | Validation |
| Axios | 1.17.0 | HTTP Client |
| Lucide React | 1.17.0 | Icons |

## Project Structure

```
src/
├── apis/                    # API endpoints
│   ├── index.ts            # Main API client
│   └── settings.api.ts     # Settings API
├── components/
│   ├── common/             # Shared components
│   │   ├── Header.tsx
│   │   └── TableSettings.tsx
│   └── rescue-team/        # Rescue team specific
│       ├── LocationPickerMap.tsx
│       ├── RescueTeamDashboardMap.tsx
│       ├── RescueTeamListPanel.tsx
│       └── StatsSummaryCards.tsx
├── config/
│   ├── featureFlags.ts     # Feature toggles
│   └── menu.ts            # Navigation menu
├── constants/
│   ├── index.ts
│   └── rescueTeam.constants.ts
├── layouts/
│   └── MainLayout.tsx     # Main app layout
├── pages/
│   ├── auth/              # Authentication
│   ├── categories/        # User & Role management
│   ├── dashboard/         # Dashboard
│   ├── disaster/          # Disaster management
│   ├── donation/          # Donation management
│   ├── household/         # Household tracking
│   ├── rescue-team/       # Rescue team management
│   ├── settings/          # System settings
│   └── under-construction/
├── routes.tsx             # Route definitions
└── index.css             # Global styles
```

## Pages & Features

### Authentication
- **LoginPage** - User authentication
- **RegisterPage** - User registration

### Dashboard
- **DashboardPage** - Main dashboard with overview

### Rescue Team Management
- **RescueTeamListPage** - List all rescue teams with map view
- **RescueTeamCreatePage** - Create new rescue team
- **RescueTeamDetailPage** - View rescue team details
- **RescueTeamDashboardPage** - Dashboard with team statistics and map
- **TeamSpecializationListPage** - Manage team specializations

### Household Management
- **HouseholdListPage** - List households
- **HouseholdCreatePage** - Create household
- **HouseholdDetailPage** - View household details

### Disaster Management
- **DisasterListPage** - List disasters
- **DisasterDetailPage** - View disaster details

### Donation Management
- **DonationListPage** - List donations
- **DonationCampaignPage** - Donation campaigns

### User & Role Management
- **UserListPage** - List users
- **RoleListPage** - Role management
- **UserFormModal** - User form modal

### System Settings
- **SystemSettingsPage** - Main settings page with tabs:
  - GeneralTab - General configuration
  - MapTab - Map settings
  - ThemeTab - Theme customization
  - NotificationTab - Notification settings
  - EmailTab - Email configuration
  - SecurityTab - Security settings
  - ApiTab - API configuration
  - BackupTab - Backup management
  - AuditTab - Audit logs
  - RbacTab - Role-based access control
  - CategoryTab - Category management
  - SosTab - SOS settings

## Progress Timeline

### 2026-06-20 - Latest Update
**Commit:** `0e25ca1` - feat: update rescue team pages, settings, UI improvements and new documentation

- Added complete rescue team management pages with map integration
- Added comprehensive settings page with 12 different configuration tabs
- Added TableSettings component for customizable tables
- Added new rescue team components (LocationPickerMap, RescueTeamDashboardMap, RescueTeamListPanel, StatsSummaryCards)
- Updated Header, MainLayout, routes, feature flags
- Optimized rescue map page layout with white theme and satellite maps
- Added BE_API_MISSING, DEVELOPMENT_RULES, UI_RULES documentation

### 2026-06-19
**Commit:** `510be68` - feat: optimize rescue map page layout, white theme background, collapsible filter sidebar, and satellite maps

- Improved rescue map page with white theme
- Added collapsible filter sidebar
- Enabled satellite map view

### 2026-06-18
**Commit:** `c5badee` - fix(fe): resolve user list compilation error, standardise tailwind borders, decouple header general search state

- Fixed user list compilation errors
- Standardized Tailwind borders across components
- Decoupled header general search state

### 2026-06-17
**Commit:** `07ab51a` - feat: update rescue team UI and pages

- Updated rescue team user interface
- Improved page layouts

### 2026-06-16
**Commit:** `0cbe4a4` - feat: rescue team UI - update list, create pages, header, toast, image upload

- Added rescue team list page
- Added rescue team create page
- Updated header component
- Added toast notifications
- Added image upload functionality

### 2026-06-15
**Commit:** `709ae81` - feat(fe): implement high-fidelity rescue team dashboard UI and connect live API

- Implemented rescue team dashboard
- Connected to live API

### 2024 (Initial Setup)
**Commit:** `bf60534` - feat: initialize frontend project with Vite, TypeScript, TailwindCSS and React routing

- Initial project setup with Vite
- TypeScript configuration
- TailwindCSS integration
- React Router setup

## Key Features

1. **Map Integration** - Leaflet maps for location picking and team visualization
2. **Responsive Design** - Mobile-first with TailwindCSS
3. **Type Safety** - Full TypeScript coverage
4. **Form Validation** - React Hook Form + Zod
5. **Server State** - TanStack Query for API data
6. **Client State** - Zustand for UI state
7. **Feature Flags** - Configurable features
8. **RBAC** - Role-based access control
9. **Toast Notifications** - User feedback
10. **Image Upload** - Media handling

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Recent Activity

| Date | Commit | Description |
|------|--------|-------------|
| 2026-06-20 | 0e25ca1 | Update rescue team pages, settings, UI improvements |
| 2026-06-19 | 510be68 | Optimize rescue map page layout |
| 2026-06-18 | c5badee | Fix user list compilation error |
| 2026-06-17 | 07ab51a | Update rescue team UI and pages |
| 2026-06-16 | 0cbe4a4 | Rescue team UI - list, create, header, toast, image upload |
| 2026-06-15 | 709ae81 | Implement rescue team dashboard UI |
| 2024 | bf60534 | Initial project setup |

## Documentation Files

- `BE_API_MISSING.md` - Missing backend API documentation
- `DEVELOPMENT_RULES.md` - Development guidelines
- `UI_RULES.md` - UI/UX guidelines
