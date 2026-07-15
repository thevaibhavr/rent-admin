# rent-admin

Active admin dashboard for Rent The Moment (replaces the deprecated `rent-moment-admin`). Next.js 15 (App Router) + React 19 + TypeScript (strict), Tailwind CSS 4 (PostCSS-based, no `tailwind.config`). Forms with react-hook-form + zod; UI from Headless UI, Heroicons, lucide-react; charts via recharts; bookings calendar via react-big-calendar. Package name is `cloth-admin`; README is stale (says Next 14, lists existing pages as "Coming Soon").

**This app hosts the platform's admin/authed REST API** under `src/app/api/**` (moved here from the deprecated `rent-moment-admin`; originally ported from the retired Express `rent-moment-backend`): auth, users, merchants, customers, products, categories, supercategories, orders, bookings, upload (base64 → Cloudinary), beauty-products, and a generic `[categoryType]` handler serving the 8 legacy clone-category paths (`winter-categories`, `summer-categories`, … mapped in `src/lib/categoryTypes.ts`). Route handlers connect directly to MongoDB via Mongoose.

## Server layer (`src/lib/`)

- `db.ts` — cached global mongoose connection (`connectDB()`), requires `MONGODB_URI` (no fallback).
- `models/*.ts` — all 17 Mongoose models (mongoose 9; `mongoose.models.X ||` hot-reload guard). **Duplicated** in `rent-moment-frontend/src/lib/models/` (`Product`, `Category`, `Order`, `Merchant`) — schema changes must be applied in both repos.
- `auth.ts` — `signToken`, `requireAuth`, `requireAdmin`, `optionalAuth` (JWT Bearer; requires `JWT_SECRET`, throws if unset). The legacy `beautyAdmin` no-token backdoor was **deliberately not ported** — all writes require a real admin token.
- `apiResponse.ts` — `ok`/`fail`/`serverError` keeping the legacy `{ success, data|message, errors? }` envelope byte-compatible.
- `cloudinary.ts` — `uploadImage`/`deleteImage`/`uploadMultipleImages`.
- Server env (`.env.local`): `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build` / `npm run start` / `npm run lint`
- No test framework. Root `test-*.js` files are standalone scripts run with `node <file>`.

## Structure (`src/`)

- `app/` — flat App Router routes, one `'use client'` `page.tsx` per feature: dashboard (`/`), `login`, `users`, `customers`, `merchants`, `products`, `categories`, `orders`, `highlighted`, `bookings` (+ `bookings/add`, `bookings/view`), and beauty vertical: `beauty`, `beauty-categories`, `beauty-products`.
- `components/` — `Layout.tsx`, `ClothsLayout.tsx`, `BeautyLayout.tsx` (sidebar shells per vertical), `ProtectedRoute.tsx` (client-side auth gate — wrap every authed page), `BookingForm`, `BookingsCalendar`, `HighlightedProducts`, `ImageUpload`, `MultiImageUpload`.
- `contexts/AuthContext.tsx` — auth provider + `useAuth`.
- `services/api.ts` — single axios `ApiService` class (singleton `apiService`, ~90 methods across auth, products, categories, orders, users, merchants, customers, bookings, highlighted, supercategories, beauty/routine/winter/summer/cloth/woman-care categories).
- `types/index.ts` — all shared TS interfaces.
- Path alias: `@/*` → `./src/*`.

## API & auth

- Base URL: `NEXT_PUBLIC_API_URL`, defaulting to `/api` (this app's own same-origin App Router routes). Set it only to target an external backend during migration testing.
- Expected response envelope: `{ success, data: { <resource>: T } }`; lists use `PaginatedResponse<T>`; client unwraps `response.data.data`.
- JWT in `localStorage` (`admin_token` + `admin_user`). Request interceptor injects the Bearer token; 401 response clears storage and redirects to `/login`.
- Login enforces `role === 'admin'` client-side only — **no `middleware.ts`, no server-side protection**.
- The old `AuthContext.tsx` login backdoor (`moment@gmail.com` / `1234567` → mock admin token) has been **removed** — all logins go through `/api/auth/login`. Don't reintroduce the pattern. Note: `Layout`/`BeautyLayout`/`ClothsLayout` still route the beauty vertical by `user.email === 'moment@gmail.com'`, so the beauty dashboard is only reachable if a real admin user with that email exists in the DB.
- ⚠️ Image uploads bypass the API: `ImageUpload`/`MultiImageUpload` POST **directly to Cloudinary** as unsigned uploads with hardcoded `cloud_name='djrdmqjir'`, `upload_preset='cloths'` (no env var).

## Root test/seed scripts

All standalone `node <file>` scripts using axios against **hardcoded `http://localhost:5000/api`** (the old local Express backend — they do not respect `NEXT_PUBLIC_API_URL`), logging in as `admin@clothingrental.com` / `testadmin123`:

- `comprehensive-booking-test.js` — end-to-end booking flow (login → category → products → booking → payment)
- `test-booking-calculations.js` — booking amount/advance/discount/security math (needs a real token + dressId edited in first)
- `test-customer-functionality.js` — customer create/search/cleanup
- `test-dashboard.js` — stats/summary endpoints
- `populate-test-data.js` — seeds a category + 8 sample products

## Conventions / gotchas

- New page = `src/app/<feature>/page.tsx` with `'use client'`, wrapped in `<ProtectedRoute>`, plus a nav entry in the relevant layout (`ClothsLayout` or `BeautyLayout`).
- Add API methods to `services/api.ts` and types to `types/index.ts`; don't fetch inline.
- `next.config.ts` image `remotePatterns` allow any host; real images come from Cloudinary.
