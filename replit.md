# Chrona Workflow - Business Management Application

## Overview

This is a comprehensive, production-ready business management application designed for multi-platform use (desktop web and mobile). The system provides complete workflow management for businesses of any industry, featuring worker time tracking via QR codes, client management, project oversight, invoicing, and reporting capabilities. Built with modern web technologies, the application is cloud-based and designed for scalability and future feature expansion.

## Recent Changes

**August 14, 2025**: Complete Multi-Tenant Authentication System + Customizable Dashboard Widgets
- ✅ COMPLETED: Successfully migrated from Replit OAuth to custom JWT-based multi-tenant authentication
- ✅ COMPLETED: Created separate database tables for businesses, business_users, and admin_users with complete data isolation
- ✅ COMPLETED: Implemented business registration and login system with automatic business creation
- ✅ COMPLETED: Created admin authentication system for platform oversight
- ✅ COMPLETED: Updated all backend API routes to use business-scoped operations with proper authentication middleware
- ✅ COMPLETED: Designed new landing page with separate business and admin access paths
- ✅ COMPLETED: Created dedicated business authentication page with login/registration tabs
- ✅ COMPLETED: Created dedicated admin authentication page for platform administrators
- ✅ COMPLETED: Updated frontend authentication hook to support multi-tenant user types
- ✅ COMPLETED: Fixed logout functionality to use new authentication endpoints
- ✅ COMPLETED: Completed database schema migration with all required multi-tenant tables
- ✅ COMPLETED: Updated routing system to handle business vs admin user flows
- ✅ COMPLETED: Implemented customizable dashboard widget system with drag-and-drop functionality
- ✅ COMPLETED: Created multiple widget types: Workers Overview, Time Tracking, Projects Status, Revenue Tracking
- ✅ COMPLETED: Added widget customization dialog for enabling/disabling widgets
- ✅ COMPLETED: Implemented local storage persistence for widget configurations
- ✅ COMPLETED: Designed responsive widget grid layout with different widget sizes
- 🎯 CURRENT STATUS: Application fully tested and ready for production deployment
- ✅ COMPLETED: Comprehensive diagnostic check confirming all database connections and UI elements working
- ✅ COMPLETED: Full functionality testing of authentication, CRUD operations, and business management features
- ✅ COMPLETED: Multi-tenant authentication system fully operational with customizable dashboard
- ✅ COMPLETED: Database schema fixes for business_id columns across all tables
- ✅ COMPLETED: Deployment initiated - application ready for live production use
- Each business now has complete data isolation with independent worker, client, project, and invoice management
- Platform administrators can access separate admin dashboard for business oversight
- Business users can customize their dashboard with relevant widgets and metrics
- All core features tested and confirmed working: worker management, QR time tracking, client management, project oversight, invoicing, and dashboard analytics

**August 13, 2025**: Application Rebranded to "Chrona Workflow" and Custom Domain Acquired
- ✅ COMPLETED: Rebranded entire application from "Fidi WorkFlow" to "Chrona Workflow"  
- ✅ COMPLETED: Custom domain ChronaWorkflow.com purchased and ready for configuration
- Updated all UI text, branding, and documentation to reflect new name
- Added comprehensive Worker Location Map feature with GPS tracking
- Created interactive map interface showing worker QR scan locations
- Implemented location filters for active/inactive workers and time periods
- Fixed QR code generation and scanning with real libraries (qrcode, jsQR)
- Updated deployment documentation with custom domain setup instructions
- All core features remain fully operational: time tracking, invoicing, worker management

**August 12, 2025**: Complete system validation and error resolution
- Successfully resolved all invoice creation validation errors
- Fixed date handling between frontend and backend (string to Date conversion)
- Eliminated all TypeScript compilation errors across the codebase
- Resolved nested Link component warnings in dashboard
- Confirmed all core features working: worker management, QR time tracking, client management, and invoice creation
- System is now fully operational and error-free

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and maintainability
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **Authentication**: Replit OIDC integration with Passport.js strategy
- **API Design**: RESTful API endpoints with consistent error handling and logging middleware

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Session Storage**: PostgreSQL table for secure session management
- **Database Features**: UUID primary keys, timestamps, enums for status fields, decimal precision for financial data

### Authentication and Authorization
- **Authentication Provider**: Replit OIDC (OpenID Connect) for secure user authentication
- **Session Strategy**: Server-side session storage with PostgreSQL persistence
- **Authorization**: Role-based access control with user roles stored in database
- **Security**: HTTP-only cookies, secure session configuration, CSRF protection

### Core Business Logic Components

#### Worker Management
- Unique QR code generation for each worker
- Time tracking with clock-in/out functionality
- GPS location verification for time entries
- Hourly rate management and payroll calculations

#### Time Tracking System
- QR code scanner integration using device camera
- Real-time time log creation and management
- Supervisor approval workflow for time entries
- Automatic calculation of work hours and overtime

#### Client and Project Management
- Comprehensive client contact and project history storage
- Project status tracking with workflow states
- Project-worker assignment capabilities
- Budget tracking and progress monitoring

#### Invoicing System
- Multi-line item invoice creation
- Tax calculation and discount application
- PDF generation capabilities for invoice export
- Integration points for payment processors (Stripe, PayPal)
- Invoice status tracking (pending, paid, overdue)

#### Reporting and Analytics
- Dashboard with key business metrics
- Time log summaries and payroll reports
- Project progress and financial reporting
- Export capabilities for accounting integration

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: ws library for Neon database connections

### Authentication Services
- **Replit OIDC**: Identity provider for user authentication
- **OpenID Client**: Standard OIDC client implementation

### UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Lucide React**: Consistent icon library
- **React Hook Form**: Form state management and validation
- **date-fns**: Date manipulation and formatting utilities

### Development and Build Tools
- **Vite**: Build tool with hot module replacement and optimized bundling
- **TypeScript**: Static type checking across the entire application
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Drizzle Kit**: Database schema management and migration tools

### Payment Integration (Planned)
- **Stripe**: Credit card processing and subscription management
- **PayPal**: Alternative payment processing option
- **Bank Transfer**: Direct bank transfer integration capabilities

### Mobile and Camera Features
- **QR Code Scanning**: Browser-based camera access for QR code recognition
- **GPS Geolocation**: Browser geolocation API for location verification
- **Progressive Web App**: PWA capabilities for mobile-like experience

### Monitoring and Development
- **Replit Integration**: Development environment integration with cartographer plugin
- **Error Handling**: Comprehensive error boundaries and logging
- **Session Management**: Secure session handling with automatic cleanup