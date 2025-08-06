# PromoHub Brasil - Deal Aggregator Platform

## Overview

PromoHub Brasil is a Brazilian deals and coupons aggregation platform built as a full-stack web application. The platform allows users to browse deals across various categories, search for specific products, and access promotional coupons from different stores. The application features a modern React frontend with a Node.js/Express backend, designed to provide users with a seamless deal discovery experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom Brazilian-themed color scheme (green, blue, yellow)
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Forms**: React Hook Form with Zod validation for form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured endpoints for categories, stores, deals, and coupons
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Request Logging**: Custom middleware for API request logging and performance monitoring

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Relational structure with categories, stores, deals, and coupons tables
- **Connection**: Neon Database serverless PostgreSQL for cloud hosting
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development

### Authentication & Session Management
- **Session Storage**: PostgreSQL-based sessions using connect-pg-simple
- **Security**: Session-based authentication with secure cookie configuration

### Development Environment
- **Hot Reload**: Vite dev server with HMR for frontend development
- **Development Server**: Express server with Vite middleware integration
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Build Process**: Separate build pipelines for frontend (Vite) and backend (esbuild)

### Component Architecture
- **Design System**: Comprehensive UI component library based on Radix primitives
- **Accessibility**: WAI-ARIA compliant components with keyboard navigation support
- **Responsiveness**: Mobile-first responsive design with Tailwind breakpoints
- **Theming**: CSS custom properties for consistent color scheme and dark mode support

### API Structure
- **Categories**: CRUD operations for deal categories with slug-based routing
- **Stores**: Store management with verification status and metadata
- **Deals**: Deal aggregation with filtering by category, store, popularity, and search
- **Coupons**: Coupon management with activation tracking and expiration handling
- **Usage Tracking**: Analytics for deal and coupon usage patterns

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM for PostgreSQL operations
- **express**: Web application framework for Node.js backend
- **react**: Frontend UI library for component-based architecture
- **vite**: Build tool and development server for frontend assets

### UI Component Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Server state management and caching solution
- **wouter**: Minimalist routing library for React applications
- **tailwindcss**: Utility-first CSS framework for styling

### Development Tools
- **typescript**: Static type checking for JavaScript
- **drizzle-kit**: Database schema management and migrations
- **esbuild**: Fast JavaScript bundler for backend compilation
- **tsx**: TypeScript execution environment for development

### Utility Libraries
- **zod**: Schema validation for form inputs and API responses
- **react-hook-form**: Performant form library with minimal re-renders
- **date-fns**: Date manipulation and formatting utilities
- **clsx**: Conditional CSS class name utility
- **nanoid**: URL-safe unique ID generator

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation and mapping tools