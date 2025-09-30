# Changelog

All notable changes to the Real Estate Investment ROI App are documented in this file.

## [2.0.0] - September 30, 2025

### 🚨 Critical Production Fix

**Volume Synchronization Issue Resolved**

- **Fixed**: Critical database inconsistency causing login failures in production
- **Root Cause**: Multiple Fly.io volumes with identical names attached to different machines
- **Impact**: Users unable to log in due to "The table `main.users` does not exist" error
- **Solution**: 
  - Identified active machine (`7815103f24d1d8`) using incorrect volume
  - Successfully migrated schema to correct volume via SSH
  - Seeded database with admin users and sample data
  - Cleaned up unused machine and volume resources

### Production Status

- ✅ Application now fully functional at https://real-estate-roi-app.fly.dev
- ✅ Login functionality working with admin credentials
- ✅ Database contains 118KB of seeded production data
- ✅ All 29 test suites (180 tests) continue passing
- ✅ Clean single-machine deployment with proper volume attachment

### Deployment Process Improvements

- Enhanced troubleshooting documentation for volume synchronization issues
- Added step-by-step SSH debugging procedures
- Implemented resource cleanup protocols to prevent future conflicts

## [1.5.0] - September 2025

### Major Deployment Fixes

- **Fixed**: TypeScript seed script error (converted `seed.tsx` to `seed.js`)
- **Fixed**: Missing bcryptjs module in production Docker image
- **Fixed**: Database schema mismatch with User.active column migration
- **Enhanced**: Production deployment reliability and error handling

### Testing & Quality Assurance

- All tests passing (29 test suites, 180 tests)
- TDD approach maintained throughout deployment fixes
- Comprehensive validation of production functionality

## [1.4.0] - September 2025

### Walk-Through Notes Features

- **Added**: Complete walk-through notes system with CRUD operations
- **Added**: 5-star rating system for property assessments
- **Added**: Admin access to all user notes
- **Added**: Overall rating aggregation API fields
- **Enhanced**: Comprehensive test coverage for all note functionality

### Admin Features

- **Fixed**: Admin access bug allowing admins to view all walk-through notes
- **Enhanced**: Complete data export including all database tables
- **Added**: User account activation/deactivation controls

### UI/UX Improvements

- **Added**: Mobile hamburger menu with role-based navigation
- **Enhanced**: Modern error handling and user feedback
- **Improved**: Responsive design across all components

## [1.3.0] - August 2025

### Archive Management

- **Added**: Soft delete/archive functionality for properties
- **Added**: Undo operations with visual indicators
- **Added**: Bulk archive operations
- **Enhanced**: Property filtering and state management

### Admin Wiki

- **Added**: Complete documentation management system
- **Added**: Tag filtering and search functionality
- **Added**: Export/import capabilities (JSON, CSV)
- **Fixed**: Duplicate search bars and improved UI consistency

## [1.2.0] - July 2025

### Core Features

- **Added**: 30-year financial projections toggle
- **Added**: Comprehensive ROI calculation engine
- **Added**: Property comparison and analysis tools
- **Enhanced**: User authentication and authorization

### Technical Infrastructure

- **Added**: Prisma ORM with SQLite database
- **Added**: Docker containerization
- **Added**: Fly.io deployment configuration
- **Enhanced**: Test coverage and CI/CD pipeline

## [1.1.0] - June 2025

### Foundation

- **Added**: Next.js 14 application framework
- **Added**: TypeScript and modern tooling
- **Added**: Tailwind CSS and shadcn/ui components
- **Added**: Initial property analysis calculations

## [1.0.0] - May 2025

### Initial Release

- **Added**: Basic property ROI calculations
- **Added**: User interface for property data entry
- **Added**: Financial analysis reporting
- **Added**: Initial deployment infrastructure

---

## Type Definitions

- 🚨 **Critical**: Production-breaking issues requiring immediate attention
- **Fixed**: Bug fixes and error corrections
- **Added**: New features and functionality
- **Enhanced**: Improvements to existing features
- **Changed**: Modifications to existing behavior
- **Removed**: Deprecated or deleted functionality
- **Security**: Security-related changes

---

*Last updated: September 30, 2025*