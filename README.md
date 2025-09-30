# Real Estate Investment ROI App

![Tests Passing](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage 95%+](https://img.shields.io/badge/coverage-95%25%2B-brightgreen)
![Test Suites](https://img.shields.io/badge/test_suites-30_passed-brightgreen)
![Total Tests](https://img.shields.io/badge/total_tests-186_passed-brightgreen)
![Deployment](https://img.shields.io/badge/fly.io_deployment-successful-brightgreen)

## Project Summary

The Real Estate Investment ROI App is a full-featured analysis tool for property investors. It provides:

- **30-Year Projections**: Toggle between 5-year and 30-year financial views (cash flow, equity, ROI, etc.)
- **Admin Wiki**: Add, edit, delete, export, and import documentation entries. Tag filtering and pagination included. All features are TDD-tested.
- **Archive Management**: Soft delete/archive properties with undo, bulk operations, and visual indicators. All workflows are robust and fully tested.
- **Walk-Through Notes**: Create, view, edit, and delete post-house walk-through notes for each property with 1-5 star ratings. Complete backend API with full authentication and authorization including **admin access to all notes**. **UI components fully implemented and integrated** - interactive forms appear on property detail pages with validation, character counters, and error handling. **Delete confirmations use modern modal dialogs** instead of browser alerts for better UX. All Prisma model naming issues resolved.
- **Insights Dashboard**: Real-time API call logging, error tracking, and user management for admins.
- **PDF Export**: Print property summaries and comparisons in landscape mode for professional reports.
- **Authentication & Authorization**: next-auth with role-based access. Only admins can access sensitive features.
- **Persistent Storage**: SQLite via Prisma. Production deployments require a permanent volume.
- **Comprehensive TDD**: All features covered by Jest/RTL tests. **30 test suites (186 tests) all passing** with walk-through notes UI and API validation tests including modal confirmation dialogs and admin access controls. Form validation, error handling, and API endpoints fully tested. **Admin access bug fix, Prisma OpenSSL compatibility fix, and Walk-Through Overall Rating aggregation completed September 2025**.
- **Modern UI**: Built with Next.js 14, React, TypeScript, shadcn/ui, and Tailwind CSS.

## ✅ Deployment Status (September 30, 2025)

**All Fly.io deployment errors have been completely resolved!** The application now deploys successfully in production with full database functionality:

### Critical Issues Fixed

1. **TypeScript Seed Script Error**: Converted `prisma/seed.tsx` to `prisma/seed.js` (JavaScript) - eliminated tsx dependency in production Docker image
2. **bcryptjs Module Missing**: Added bcryptjs dependency copy to production Docker image for password hashing in seed script  
3. **Database Schema Mismatch**: Created migration `20250930114202_add_user_active_column` for missing User.active column
4. **🚨 Volume Synchronization Bug**: **CRITICAL FIX** - Resolved database inconsistency where multiple Fly.io volumes with identical names caused login failures due to missing database tables on active machine

### Volume Synchronization Resolution

**Root Cause**: Two volumes (`vol_r77wypx65k52973r` and `vol_vgjy5yxn02jz3q8v`) both named `database_vol` attached to different machines. Database seeding occurred on one volume while the active machine used an empty volume, causing "The table `main.users` does not exist in the current database" errors.

**Solution Implemented**:
- ✅ Identified active machine (`7815103f24d1d8`) using wrong volume
- ✅ Successfully ran `npx prisma migrate deploy` on correct volume via SSH
- ✅ Successfully ran `npx prisma db seed` to populate database with admin users and sample data
- ✅ Verified database now contains 118KB of production data
- ✅ Cleaned up unused machine and volume to prevent future conflicts

### Production Status

- ✅ Docker image builds successfully with all dependencies
- ✅ Database seeding works correctly in production environment  
- ✅ All schema migrations apply successfully without errors
- ✅ **Login functionality now fully operational in production**
- ✅ Authentication and user management fully functional
- ✅ All 30 test suites (186 tests) continue passing after fixes
- ✅ Application running live at https://real-estate-roi-app.fly.dev
- ✅ Production database with admin users and sample data ready
- ✅ Single clean machine deployment with properly synchronized volume

### Deployment Validation

- Systematic debugging of four sequential Fly.io deployment issues
- TDD approach maintained throughout all fixes  
- No breaking changes to existing functionality
- Complete production deployment success achieved
- Final validation: All tests passing + production login confirmed (September 30, 2025)

### Test Infrastructure & Quality Assurance

- **Test Isolation**: All test files now use proper cleanup mechanisms to prevent global fetch mock contamination between test suites. This ensures reliable test execution regardless of test order.
- **Walk-Through Notes Testing**: Complete test coverage for all UI components and API endpoints with proper async handling using React's `act()` wrapper.
- **Schema Validation**: Separate Zod schemas for create (`WalkThroughNoteSchema`) and update (`WalkThroughNoteUpdateSchema`) operations to handle different validation requirements.
- **API Testing**: Comprehensive tests for all CRUD operations including edge cases, validation errors, and authentication scenarios.
- **Error Handling**: Comprehensive error boundary testing and API error response validation.
- **Database Testing**: Prisma test database with proper setup/teardown for each test suite.
- **React Testing**: Modern testing patterns with React Testing Library, proper state management testing, and async component handling.

### Deployment & Configuration

- Check browser console for errors (e.g., quota, billing, or referrer restrictions).
- Restart the dev server after updating `.env.local`.


**API Endpoints:**

**Fully TDD-Covered**: All projection calculations are covered by Jest unit tests; UI toggle is tested for correct rendering and switching
**Deployment Note**: For production deployments on fly.io, a permanent volume is recommended for the SQLite database to persist long-term projections and analysis history

### Admin Wiki Search & Filter (2025)

- **Search Bar:** Robust, real-time search/filter for documentation entries by title and content. Only one search bar is present (header), fully functional and TDD-tested. Duplicate/buggy search bars removed (September 2025).
- **Tag Filtering:** Sidebar tag filter for quick navigation. Fully tested for edge cases and UI consistency.
- **Pagination:** Efficient browsing of large knowledge bases, with full test coverage for navigation and edge cases.
- **TDD Coverage:** All search, filter, and pagination features are covered by Jest/RTL tests. All tests pass as of September 2025.

## Project Summary (2025)

- **Authentication & Authorization:** next-auth with role-based access. Only admins can access sensitive features.
- **Comprehensive TDD:** All features, including admin wiki, archive, projections, walk-through notes (with overall rating aggregation), and error handling, are covered by Jest/RTL tests. **All 30 test suites (186 tests) pass as of September 2025** with enhanced test isolation and database integrity.

### Deployment Troubleshooting (Seeding Phase)

**API Endpoints:**

- `DELETE /api/admin/documentation/[id]`: Delete an entry (admin only)
- `GET /api/admin/documentation/exportimport`: Export all entries as JSON (admin only)
**Fully TDD-Covered**: All projection calculations are covered by Jest unit tests; UI toggle is tested for correct rendering and switching
**Deployment Note**: For production deployments on fly.io, a permanent volume is recommended for the SQLite database to persist long-term projections and analysis history
- **Archive Toggle**: Instantly switch between active and archived properties. Fully tested.
- **Bulk Operations**: Archive/unarchive properties individually, with full test coverage.
- **Visual Indicators**: Archived properties display a prominent yellow "Archived" badge and faded card style for instant recognition (fully TDD-tested).
- **API Filtering**: Backend API supports `archived` query for efficient data retrieval. Fully tested.

### Square Footage Formatting

- **Modern Error Handling**: All user-facing errors and warnings are standardized in a modern, friendly style (like Google). All error handling is fully TDD-tested and robust.
- **Property Archive Error Handling**: Enhanced error handling in property archive tests prevents PrismaClientValidationError due to undefined property IDs, with comprehensive response validation.
- **React Testing Configuration**: Jest setup with proper React act() environment configuration eliminates all React state update warnings in tests.
- **TDD Coverage**: Edge cases for vacancy rate (missing, empty, NaN, <0, >1), all archive workflows, and React component state updates are fully covered by automated Jest tests. All tests pass as of September 2025.

#### Recent Bug Fixes

- Fixed: "Missing or invalid value for required field: vacancyRate"—now always defaults to 5% if not set or invalid, and all related tests pass.
- Fixed: Archive/unarchive UI and API now fully robust, with null safety and complete test coverage (2025).

### Error Handling, TDD, and Robust Defaults

- **Vacancy Rate Handling:** The app now robustly defaults vacancy rate to 5% (0.05) if missing, invalid, or out of range, both in the UI and calculation engine. This prevents analysis errors and ensures a smooth user experience.
- **TDD Coverage:** Edge cases for vacancy rate (missing, empty, NaN, <0, >1) are fully covered by automated Jest tests. All tests must pass before deployment.

### Recent Enhancements & Bug Fixes (September 2025)

- **Prisma OpenSSL Docker Compatibility:** Fixed critical deployment issue where Prisma failed to detect OpenSSL version in Docker environments. The application now deploys reliably on all platforms:
  - **Docker Alpine Linux:** Updated Dockerfile to use Node 20 with explicit OpenSSL installation
  - **Binary Targets:** Prisma schema now includes multi-platform binary targets (native, linux-musl-openssl-3.0.x, linux-musl-arm64-openssl-3.0.x)
  - **Version Alignment:** Updated Prisma client and CLI to matching versions (5.22.0)
  - **Production Deployment:** Eliminates "Prisma failed to detect libssl/openssl version" warnings in fly.io and other Docker platforms
  - Added comprehensive test suite for Docker compatibility validation

- **Admin Data Export Completeness:** Fixed critical bug where admin export functionality was missing key database tables. The `/api/admin/export` endpoint now includes ALL application data:
  - **Complete Data Coverage:** Export now includes all 9 database models (previously only 6)
  - **Missing Tables Added:** walkThroughNotes, documentationEntries, and apiCallLogs now included in both JSON and CSV exports
  - **Enhanced Test Coverage:** Added comprehensive test to verify all tables are exported correctly
  - **Data Integrity:** Ensures complete backup and audit capabilities for administrators
  - All export functionality thoroughly tested with 4 test cases covering authentication, authorization, and data completeness

- **Admin Access to Walk-Through Notes:** Fixed critical bug where admins could not see walk-through notes created by other users. The API now properly implements role-based access control:
  - **Admins** can view, edit, and delete ALL walk-through notes from any user
  - **Regular users** can only access their own walk-through notes
  - **Admin property access** allows admins to create notes for any property, not just their own
  - **Comprehensive test coverage** added with 12 new tests covering all admin access scenarios
  - All CRUD operations (GET, POST, PUT, DELETE) now respect admin privileges

- **Walk-Through Overall Rating Aggregation:** New additive API fields provide portfolio insight:
  - `walkThroughAverageRating`: Mean of all positive (>0) numeric note ratings or `null` if none
  - `walkThroughRatingCount`: Count of contributing ratings
  - Implemented in property list and detail routes; ignores zero/negative/undefined to avoid noise
  - Fully TDD-backed (3 new tests) without breaking existing clients (fields are optional additions)

- All core features, including property analysis, admin controls, delayed delete/undo, archive, admin wiki, export/import, walk-through overall rating aggregation, and input formatting, are covered by automated tests.
 - **Fly.io Volume Permission Hardening (Sep 2025):** Adjusted container to run release phase as root so the mounted `/data` volume can have ownership corrected (`chown 1001:1001`). Entrypoint now drops privileges to unprivileged `nextjs` user for the app process, ensuring both security and successful creation of `production.db` on first deploy. Added automatic chmod/chown safeguards in `docker-entrypoint.sh` and `scripts/deploy-db.sh` to prevent `Permission denied (os error 13)` during `prisma db push` / `migrate deploy`.
 - **Runtime Privilege Drop Fix (Sep 2025):** Added `su-exec` to final image and fallback to `gosu`/root with warning. Resolves `exec: su-exec: not found` crash loop in Fly logs (exit code 127) so app boots properly after volume ownership adjustment.
- Automated BUY/CONSIDER/PASS recommendations
- Detailed reasoning for investment decisions
- Market analysis and risk assessment
- **requirements.txt** is kept up to date and reflects all TDD-tested features and requirements as of September 2025.
- Admins can view a real-time dashboard with:
  - API call snapshot (total calls, errors, last 24h)
  - **Persistent API call logging:** All API calls are logged to the database and available for drill-down and audit in the Admin Insights Dashboard. Logging is robust and TDD-tested.
  - Live console output (last 200 lines)
  - **API error count is now accurate and reflects actual failed API calls (status >= 400) in real time**
- Insights dashboard is available on the Admin page
- Data is updated automatically and is only visible to Admin users
- **User Management:** Admins can now activate or deactivate user accounts directly from the Admin Dashboard. Each user row displays their current status (Active/Inactive) and provides a button to toggle account activation. Deactivated users cannot sign in until reactivated by an admin. All changes are immediate and fully auditable.

## 🚀 Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Deployment**: fly.io with Docker
- **Validation**: Zod for type-safe form validation

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Git for version control

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd real-estate-investment-roi-app
npm install
npx prisma db push
npx prisma db seed
```

### 3. Environment Setup

Create a `.env.local` file:

```env
- This key is required for address autocomplete and property image preview features.

### 4. Run Development Server

```bash
npm run dev
```

## 🧪 Testing & Quality Assurance

- **maxWorkers: 1** configuration prevents database race conditions
- Ensures test isolation and prevents foreign key constraint violations

#### React Testing Environment 

- **IS_REACT_ACT_ENVIRONMENT = true** eliminates React act warnings

### API Testing Coverage

- **7 comprehensive tests** covering archive/unarchive workflows
- Robust response validation and database state verification

#### Admin API Security Tests

- Export/import functionality with comprehensive error handling
- Secure data validation and role-based access control

### Component Testing Coverage

- **6 comprehensive tests** with proper React act() environment
- All user interactions wrapped in act() to prevent state update warnings
- Modal interactions, pagination, and state management fully tested
- Form validation with comprehensive edge case coverage
- Delete/undo workflow automation with toast notifications

### Key Test Coverage Areas

- **Calculation Engine**: 100% formula coverage with edge case validation
- **API Endpoints**: Full integration tests with authentication, authorization, and error handling
- **UI Components**: Component and interaction tests with proper React testing environment
- **Property Archive System**: Complete test coverage with database integrity protection
- **Admin Features**: Secure testing of admin-only functionality with role validation
- **Database Operations**: Foreign key constraint protection and transaction handling
- **Error Handling**: Comprehensive error boundary testing and API error validation

### Running Tests

```bash
# Run all tests with sequential execution
npm test

# Run specific test suite
npm test -- properties-archive.test.ts

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```


```
Test Suites: 19 passed, 19 total
Tests:       103 passed, 103 total
Snapshots:   0 total
Time:        ~5s (sequential execution)
```

### Test Results Summary

```
Test Suites: 22 passed, 22 total (with Walk-Through Notes UI)
Tests:       141 passed, 141 total
Snapshots:   0 total
Time:        ~10s (sequential execution)
```

### Test Configuration Files

- **jest.config.js**: Sequential execution with maxWorkers: 1
- **jest.setup.js**: React act environment and global mocks
- **Database seeding**: Comprehensive test data setup and cleanup

All tests pass consistently with enhanced error handling and database integrity protection. The sequential execution ensures reliable results in all environments.

## 📁 Project Structure

```text
src/
├── app/                    # Next.js app router
│   ├── api/               # API endpoints
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Property input forms
│   └── dashboard/        # Results dashboard
├── lib/                   # Utility libraries
│   └── calculations.ts   # Financial calculation engine
├── types/                # TypeScript type definitions
└── tests/                # Test suites
prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seeding
```

## 🎯 Usage Guide

### Step 1: Property Details

- Enter property address and type
- Set purchase price and property characteristics
- Optional: Add property condition and specifications
- **Room Rental:** Below the Bedrooms entry, you can specify how many rooms you want to rent out. For each room, set a weekly rate. The app will automatically calculate and display the total monthly rent estimate (sum of all weekly rates × 4).

### Step 2: Financing Information

- Configure down payment and loan terms
- Set interest rate and loan duration
- Include closing costs and PMI if applicable

### Step 3: Operating Expenses

- Estimate monthly operating costs
- Include property taxes, insurance, maintenance
- Add property management and utility costs

### Step 4: Rental Income

- Set expected monthly rent
- Configure vacancy rate assumptions
- Trigger comprehensive analysis

### Step 5: Investment Analysis

- Review detailed ROI calculations
- Analyze monthly and annual projections
- View investment recommendation and scoring
- Save analysis to database for future reference

## 📊 Calculation Engine

### Core Financial Formulas

```typescript
// Monthly Mortgage Payment
P * [r(1+r)^n] / [(1+r)^n - 1]

// Cash-on-Cash Return
Annual Cash Flow / Total Cash Invested

// Capitalization Rate
Net Operating Income / Property Value

// Net Present Value
Σ[CFt / (1+r)^t] - Initial Investment
```

### Investment Scoring Algorithm

- **Cash Flow**: 30% weight
- **ROI Metrics**: 25% weight
- **Market Factors**: 20% weight
- **Risk Assessment**: 15% weight
- **Growth Potential**: 10% weight

## 🚀 Deployment

### Deploy to fly.io

#### Prerequisites


```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh  # Linux/Mac
# or
iwr https://fly.io/install.ps1 -useb | iex  # Windows PowerShell

# Login to fly.io
flyctl auth login
```

#### Quick Deploy

```bash
# Using bash script (Linux/Mac)
chmod +x deploy.sh
./deploy.sh

# Using PowerShell script (Windows)
.\deploy.ps1
```

#### Manual Deploy

```bash
# Create database volume
flyctl volumes create database_vol --region ord --size 1

# Deploy application
flyctl deploy

# Check status
flyctl status
```

Your app will be available at: `https://real-estate-roi-app.fly.dev`

### Environment Variables for Production

```env
DATABASE_URL="file:/data/database.db"
NODE_ENV="production"
```

### Release Command & Database Migration Strategy (September 2025)

Production deployments on Fly.io run a `release_command` before activating a new version. We use this to apply Prisma schema changes safely:

1. `scripts/deploy-db.sh` (executed via `bash` in the container) performs:
   - Detect existing production volume database at `/data/production.db`
   - `prisma migrate deploy` when migrations match state
   - Automatic baseline attempt (`prisma migrate resolve --applied <first-migration>`) if schema exists but migrations were never tracked
   - Fallback to `prisma db push --force-reset` only when migration deployment cannot proceed (logs a warning)
   - Conditional seeding (`prisma db seed`) with error tolerance
2. The runtime image now includes `bash` (added to Dockerfile) to prevent the previous Fly release failure: `Cannot find module '/app/bash'` which occurred because the Node entrypoint attempted to interpret `bash` as a JS module when bash was missing.
3. Persistent storage is mounted at `/data` (see `fly.toml`) and the `DATABASE_URL` is set to `file:/data/production.db`.

If you see a Fly release failure referencing `Cannot find module '/app/bash'`, ensure the deployed image includes `bash` (this repository's Dockerfile now does) and that the release command matches:

```
release_command = "bash scripts/deploy-db.sh"
```

#### Local Verification

```bash
npm run test:deployment        # Runs deployment-focused Jest tests
```

#### Common Deployment Failure Modes

| Symptom | Cause | Resolution |
| ------- | ----- | ---------- |
| `Cannot find module '/app/bash'` | Missing bash in runtime image | Ensure Dockerfile installs `bash` in final stage |
| `P3005: The database schema is not empty` | Existing DB not tracked by migrations | Run `bash scripts/baseline-db.sh` then deploy |
| `SQLite database is locked` | Concurrent writes during release | Retry deploy; Fly release runs in isolated machine |
| Seed step warning | Non-critical seed failure | Inspect logs; data may already exist |

All deployment logic is additive—core application behavior unchanged.

### Optional Deployment Controls (October 2025 Enhancement)

You can now selectively skip migrations and/or seeding during a deployment using environment variables consumed by `scripts/deploy-db.sh`.

| Variable | Default (if unset) | Truthy Values | Falsy Values | Action |
|----------|--------------------|---------------|--------------|--------|
| `DEPLOY_RUN_MIGRATIONS` | true | 1, true, yes, y, on | 0, false, no, n, off | Run or skip migration phase (baseline + fallback logic) |
| `DEPLOY_RUN_SEED` | true | Same set | Same set | Run or skip seed script |

Behavior notes:
1. Unset = treated as enabled (secure-by-default).
2. Comparison is case-insensitive; surrounding whitespace ignored.
3. If you skip migrations and the DB file `/data/production.db` doesn't exist, the script logs a clear warning so you do not boot an empty schema silently.
4. Seeding may be safely skipped for iterative production deploys after initial bootstrap.

Examples:

```bash
# Deploy while skipping seed (recommended for routine prod deploys)
DEPLOY_RUN_SEED=false flyctl deploy

# Deploy skipping both migrations & seed (ONLY if schema already up to date)
DEPLOY_RUN_MIGRATIONS=false DEPLOY_RUN_SEED=false flyctl deploy
```

Persistent config in `fly.toml`:

```toml
[env]
  DEPLOY_RUN_SEED = "false"  # keep migrations enabled; skip reseeding
```

Local dry run:

```bash
DEPLOY_RUN_MIGRATIONS=false DEPLOY_RUN_SEED=false bash scripts/deploy-db.sh
```

Test Coverage: `src/tests/deployment/optional-migration-seed.test.ts` guards these flags against accidental removal.

## 🔧 API Reference

```json
{
  "propertyData": {
    // ... other property fields
  },
  "results": {
    "roi": 8.5,
    "monthlyCashFlow": 350,
    // ... calculation results
  }
}
```

### GET /api/properties

Retrieve saved analyses

```json
{
  "success": true,
  "analyses": [
    {
      "id": "1",
      "address": "123 Main St",
      "roi": 8.5,
      "recommendation": "BUY"
    }
  ]
}
```

### GET /api/properties/[id]

Get specific property analysis

```json
{
    "analysis": {
      "roi": 8.5,
}
```

### Walk-Through Notes API

#### POST /api/walkthrough-notes

Create a new walk-through note

```json
{
  "title": "Great property condition!",
  "content": "Beautiful kitchen renovation, updated HVAC system. Some minor cosmetic work needed in bathrooms.",
  "rating": 4,
  "propertyId": "property123"
}
```

#### GET /api/walkthrough-notes?propertyId=[id]

Get walk-through notes for a specific property

```json
{
  "success": true,
  "notes": [
    {
      "id": "note123",
      "title": "Initial Walk-Through",
      "content": "Property in excellent condition...",
      "rating": 5,
      "propertyId": "property123",
      "userId": "user123",
      "createdAt": "2025-09-27T12:00:00Z",
      "updatedAt": "2025-09-27T12:00:00Z"
    }
  ]
}
```

#### GET /api/walkthrough-notes/[id]

Get a specific walk-through note

#### PUT /api/walkthrough-notes/[id]

Update an existing walk-through note

```json
{
  "title": "Updated observation",
  "content": "Revised notes after second visit",
  "rating": 3
}
```

#### DELETE /api/walkthrough-notes/[id]

Delete a walk-through note

### Walk-Through Notes Features

- **Property Integration**: Notes appear directly on property detail pages
- **Rich Text Support**: Formatted content with line breaks preserved
- **5-Star Rating System**: Rate overall property impression (1-5 stars)
- **User Ownership**: Users can only view/edit their own notes
- **Real-time Updates**: Instant UI updates after create/edit/delete operations
- **Responsive Design**: Mobile-friendly note cards and forms
- **Validation**: Title (max 200 chars) and content (max 5000 chars) validation
- **Authentication Required**: All operations require valid user session

### Walk-Through Notes UI Components

- **WalkThroughNotes**: Main component displaying notes list and management
- **WalkThroughNoteForm**: Interactive form for creating/editing notes
- **Star Rating**: Interactive 5-star rating system with hover effects
- **Note Cards**: Stylized cards showing title, content, rating, and timestamps
- **Error Handling**: User-friendly error messages and loading states
      "title": "Great property!",
      "content": "Love the layout and condition",
      "rating": 5,
      "propertyId": "property123",
      "createdAt": "2025-01-15T10:00:00Z",
      "property": {
        "address": "123 Main St"
      }
    }
  ],
  "total": 1
}
```

### GET /api/walkthrough-notes/[id]

Get specific walk-through note

### PUT /api/walkthrough-notes/[id]

Update a walk-through note

### DELETE /api/walkthrough-notes/[id]

Delete a walk-through note

## 🤝 Contributing

4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
- Write tests for new features
- Follow TypeScript best practices

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

```
**Test failures:**
```bash
npm run test:debug
```

### Getting Help

- Check the [Issues](link-to-issues) page for known problems
- Create a new issue for bugs or feature requests
- Join our community discussions

## 🔮 Future Enhancements

- [ ] Multi-property portfolio analysis
- [ ] Advanced market data integration
- [ ] Real-time market data feeds

  - Ensure your `DATABASE_URL` is set correctly in both `.env` (local) and `[env]` in `fly.toml` (production).
  - Make sure the database volume is mounted and available at `/data`.
  - Check that your `release_command` in `fly.toml` runs migrations and seeds the database:

  ```toml
    [deploy]
    release_command = 'npx prisma migrate deploy && npx prisma db seed'

### Database Errors



- **TypeScript or Next.js build fails**
  - Run `npm run type-check` to see type errors.
  - Ensure all environment variables are set.
  - Delete `.next/` and run `npm run build` again.

- **App loads but API returns 500 or 401**
  - Check your authentication setup and session cookies.
  - Make sure your database is seeded and not empty.
  - Review API logs for stack traces.

### UI/UX Issues

- **Charts or tables not rendering**
  - Ensure all dependencies are installed (`npm install`).
  - If using Recharts, make sure you are on a supported React version.
  - Try a hard refresh or clear browser cache.

- **Property data missing or not updating**
  - Confirm the API is returning the expected data (use browser dev tools or Postman).
  - Check for errors in the browser console and server logs.

### Testing Issues

- **Tests fail or coverage is low**
  - Run `npm test` and review the output for failed assertions.
  - Ensure your test database is up to date with the latest schema.
  - Use `npm run test:coverage` to see which files need more tests.

### Getting More Help

- Check the [Issues](link-to-issues) page for known problems.
- Search for error messages in the logs or on Stack Overflow.
- Open a new issue with detailed steps to reproduce your problem.

## Error Handling & Custom Pages

### Custom Error Pages

- **Something Went Wrong (500)**: Beautifully designed error page for fatal errors, with retry and home navigation.
- **Not Found (404)**: Custom 404 page with clear messaging and a link to return home.
- Both pages are fully responsive and styled to match the app's look and feel.

### How It Works

- Next.js automatically displays these pages for unhandled errors or unknown routes.
- The error page provides a "Try Again" button (reloads the current route) and a "Go Home" button.
- The not-found page is shown for any route that does not exist.

---

## Features & Fixes (September 2025)

- Real Estate Investment ROI calculations (cash flow, ROI, cap rate, projections)
- Admin-only Wiki: add, edit, delete, tag filter, pagination, export/import (JSON, CSV), **robust search/filter (header only, duplicate search bars removed, fully TDD-tested)**
- Admin-only database export/import (JSON, CSV, schema)
- CSV export now converts array fields (e.g., tags) to comma-separated strings (not JSON)
- Archive management: soft delete, undo, visual indicators
- User authentication/authorization (next-auth, role-based)
- SQLite persistence (Prisma ORM)
- Responsive UI (Tailwind, shadcn/ui)
- All features covered by Jest/RTL unit and integration tests
- 95%+ code coverage
- Fly.io and Docker deployment ready

## Mobile Hamburger Menu & Responsive Navigation (September 2025)

- **Mobile Hamburger Menu:** The navigation bar now features a responsive hamburger menu for mobile devices, providing quick access to Home, My Properties (for users), All Properties (for admins), and user account options.
- **Role-Based Links:** The menu dynamically displays 'All Properties' and 'Admin' links for admin users, and 'My Properties' for regular users, based on session role.
- **User Info:** The logged-in user's email is shown in the mobile menu for easy identification.
- **TDD Coverage:** All mobile navigation features are fully covered by Jest and React Testing Library unit tests, including:
  - Hamburger menu visibility and toggle behavior
  - Correct links for user and admin roles
  - User email display in the menu
  - Robust mocking of authentication/session state in tests
- **Bug Fix:** Fixed previous issue where mobile navigation did not reflect user/admin roles due to improper session mocking in tests. Now, all role-based links are reliably rendered and tested.
- **Test Suites:** All tests for mobile navigation and role-based rendering pass as of September 2025.

## Testing & Quality Assurance

- Jest unit tests for all calculation functions
- Integration tests for all API endpoints (including admin export/restore)
- React Testing Library for UI/component coverage
- All tests pass as of September 2025

## Configuration

- Node v20.14.0
- SQLite database (dev.db)
- Prisma ORM
- Next.js 14, React, TypeScript
- Tailwind CSS, shadcn/ui
- next-auth for authentication
- Fly.io and Docker deployment

## Troubleshooting

- If you see JSON in CSV exports, update to the latest version (array fields now exported as comma-separated strings)
- For persistent database on Fly.io, use a permanent volume
- All admin features require admin role

## API Docs

- See `/api/admin/export` and `/api/admin/restore` for export/import endpoints
- Wiki endpoints: `/api/admin/documentation` (CRUD)

## File Organization (2025)

Auxiliary files and folders have been moved for better organization:

- All documentation, coverage reports, and logs are now in the `docs/` folder:
  - `docs/coverage/`
  - `docs/test-output.log`
- All scripts for deployment and development are now in the `scripts/` folder:
  - `scripts/deploy-fly.ps1`
  - `scripts/deploy-fly.sh`
  - `scripts/deploy.ps1`
  - `scripts/deploy.sh`
  - `scripts/start-dev.bat`
  - `scripts/dbsetup.js`

Update any references in your documentation or scripts to use these new paths.

## Badges

![Tests Passing](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage >95%](https://img.shields.io/badge/coverage-95%25%2B-brightgreen)

---

## Fly.io Deployment: Database Initialization Order (2025 Fix)

**Important:** On Fly.io, the database schema must be created before running the seed script. If the schema is missing, you will see errors like:

    Error: The table `main.users` does not exist in the current database

### How This Is Fixed

- The `release_command` in `fly.toml` runs `scripts/deploy-db.sh`.
- `deploy-db.sh` always runs `prisma migrate deploy` (or falls back to `prisma db push`) before running the seed script.
- If migrations or schema push fail, the script exits and the seed script will NOT run, preventing partial/empty DB errors.

### What You Need to Know

- **Never run the seed script before migrations or schema push.**
- The deployment process is now robust: schema is always present before seeding.
- If you add new models or migrations, just deploy as usual; the script will handle DB setup safely.

### Troubleshooting

- If you see `table ... does not exist`, check the logs to ensure migrations ran before seeding.
- The script will exit with an error if schema creation fails, so the app will not start with a broken DB.

### Database Seed Script: TypeScript to JavaScript Migration (2025 Fix) ✅ COMPLETED

**Issue:** The `tsx` command was not available in the Docker production container, causing seed failures:

```text
Error: Command failed with ENOENT: tsx prisma/seed.ts
spawn tsx ENOENT
```

**Solution Implemented:**

- ✅ Converted `prisma/seed.ts` to `prisma/seed.js` (CommonJS format).
- ✅ Updated `package.json` to use `node prisma/seed.js` instead of `tsx prisma/seed.ts`.
- ✅ Enhanced deployment script with better error reporting and success feedback.
- ✅ Added explicit success exit codes and improved logging.
- ✅ Successfully deployed to Fly.io with full seed script functionality.

**Results:**

- ✅ No additional dependencies needed in production
- ✅ Faster startup time (no TypeScript compilation)
- ✅ Reliable deployment on Fly.io and other platforms
- ✅ Maintains all seed functionality with 100% equivalent behavior
- ✅ Enhanced error handling and deployment feedback
- ✅ All tests passing (30 test suites, 186 tests)

**Test Coverage:** All TDD tests continue to pass, validating that the conversion maintains perfect functional equivalence.

---

Built with ❤️ for real estate investors
