# Clothing Rental Admin Dashboard

A modern, responsive admin dashboard built with Next.js, TypeScript, and Tailwind CSS for managing a clothing rental business.

## Features

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (Admin only)
- Protected routes
- Secure token management

### 📊 Dashboard Analytics
- Real-time statistics and metrics
- Interactive charts and graphs
- Revenue tracking
- User and order analytics
- Quick action buttons

### 👥 User Management
- View all users with pagination
- Search and filter users
- Toggle user activation status
- Delete users
- Role management

### 🛍️ Product Management (Coming Soon)
- Add, edit, and delete products
- Category management
- Image upload with Cloudinary
- Inventory tracking
- Product status management

### 📦 Order Management (Coming Soon)
- View all orders with filtering
- Update order status
- Order details and tracking
- Payment status management
- Order analytics

### 🏷️ Category Management (Coming Soon)
- Create and manage product categories
- Category image upload
- Category sorting and organization

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI + Heroicons
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see cloths-backend)

## Installation

1. **Clone the repository**
   ```bash
   cd cloth-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── users/             # Users management page
│   ├── products/          # Products management (coming soon)
│   ├── categories/        # Categories management (coming soon)
│   ├── orders/            # Orders management (coming soon)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard home page
├── components/            # Reusable components
│   ├── Layout.tsx         # Main layout with sidebar
│   ├── ProtectedRoute.tsx # Authentication wrapper
│   └── ...                # Other components
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── services/              # API services
│   └── api.ts            # API client and endpoints
├── types/                 # TypeScript type definitions
│   └── index.ts          # All type interfaces
└── utils/                 # Utility functions
```

## API Integration

The admin dashboard connects to the backend API with the following endpoints:

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users with pagination
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/toggle-status` - Toggle user status
- `GET /api/users/stats/summary` - User statistics

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/stats/summary` - Order statistics

### Categories & Products (Coming Soon)
- Full CRUD operations for categories and products
- Image upload integration
- Advanced filtering and search

## Key Components

### Layout Component
The main layout includes:
- Responsive sidebar navigation
- Top bar with user profile
- Mobile-friendly design
- Logout functionality

### ProtectedRoute Component
- Wraps all admin pages
- Checks authentication status
- Redirects to login if not authenticated
- Shows loading state during auth check

### AuthContext
- Manages user authentication state
- Handles login/logout
- Stores JWT tokens securely
- Provides user data throughout the app

## Styling

The dashboard uses Tailwind CSS for styling with:
- Responsive design
- Dark/light mode support (coming soon)
- Consistent color scheme
- Modern UI components
- Smooth animations and transitions

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks (coming soon)

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Phase 1 (Current)
- ✅ Authentication system
- ✅ Dashboard with basic stats
- ✅ User management
- ✅ Basic layout and navigation

### Phase 2 (Coming Soon)
- 🔄 Product management
- 🔄 Category management
- 🔄 Order management
- 🔄 Advanced filtering and search

### Phase 3 (Future)
- 📋 Advanced analytics
- 📋 Reporting and exports
- 📋 Email notifications
- 📋 Mobile app
- 📋 Multi-language support

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the backend API documentation

## License


This project is licensed under the MIT License - see the LICENSE file for details.
