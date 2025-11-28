# Natural Products E-Commerce Platform

## Overview

This project is a comprehensive e-commerce platform specializing in natural and organic products. It features a React-based Single Page Application (SPA) for the storefront and a Node.js/Express backend. The platform aims to provide a seamless online shopping experience for customers, complemented by robust administrative tools for managing products, orders, and customer data. Key capabilities include a role-based access control system (supporting administrators, marketers, consultants, and customers) and integrations with external services for payments, delivery, and email verification. The business vision is to capture a significant share of the natural products market by offering a user-friendly and efficient online retail solution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- React 18 with TypeScript, utilizing Wouter for client-side routing.
- Single Page Application (SPA) with `React.lazy()` and `Suspense` for code splitting and adaptive prefetching.

**UI & Styling:**
- Shadcn UI component library and Tailwind CSS for a utility-first approach.
- Custom color palette (green, beige, gold accents) with a mobile-first responsive design.
- Typography: Open Sans for body, Playfair Display/Lora for headings.
- Supports light and dark modes.

**State Management:**
- Zustand for global state.
- TanStack Query (React Query v5) for server state management and caching.
- React Hook Form with Zod validation for form handling.

### Backend Architecture

**Server Framework:**
- Node.js with Express.js, developed in TypeScript.
- RESTful API endpoints under `/api`.

**Authentication & Authorization:**
- Session-based authentication with PostgreSQL session store and `bcrypt` for password hashing.
- Role-based access control (RBAC) via middleware for Customer, Consultant, Marketer, and Admin roles.
- Backend strictly enforces all authorization checks.

**File Upload:**
- `Multer` middleware handles `multipart/form-data` for product images and chat attachments (JPEG, PNG, WEBP) stored in `/uploads`.

**Real-time Communication:**
- WebSocket server (`ws` library) for real-time notifications, especially for support chat.
- Targeted broadcast for notifications; message persistence handled by REST API.

### Data Storage Solutions

**Database:**
- PostgreSQL as the primary database, with Neon serverless PostgreSQL for cloud deployment.
- Drizzle ORM for type-safe queries and migrations.

**Schema Design:**
- Comprehensive schema covering Users, Roles, Products, Categories, Orders, Cart, Wishlist, Support Messages, Payment Cards, and Addresses.
- Features include UUID primary keys, timestamps, soft delete patterns, and optimized indexing.

### Business Logic

**Bonus System:**
- Initial bonus for new users, tiered cashback, not combinable with promocodes, max percentage payable with bonuses.

**Promocode System:**
- Percentage-based discounts with configurable min/max order amounts, expiration dates, usage limits, and active/inactive statuses. Promocodes are normalized to uppercase.

**Order Processing:**
- Multi-step checkout (address, delivery, payment, confirmation).
- Integrations with delivery services for cost calculation.
- Supports multiple payment methods and order status tracking.

**Support Chat System:**
- Customer-facing widget with privacy consent.
- Admin interface for active conversations and customer info.
- Real-time message delivery via WebSocket notifications.
- REST API for message persistence with RBAC.
- Three-tiered conversation status: Open, Archived (reopenable), Closed (permanent, stored per 152-ФЗ with 3-year retention).
- Admin panel features tabs for each status and a search interface for closed conversations.
- Compact UI design for admin panel and customer widget, with improved positioning and visibility logic.

## External Dependencies

-   **Payment Integration:** YooKassa SDK
-   **Delivery Services:** CDEK API, Boxberry API
-   **Email Service:** Nodemailer
-   **Database Service:** Neon serverless PostgreSQL
-   **Development Tools:** Vite, Drizzle Kit, ESBuild