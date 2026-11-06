# SubSync — Modern Full-Stack Subscription & Membership Management Platform

![SubSync Logo](frontend/public/logo.svg)

SubSync is an enterprise-grade SaaS subscription and membership management platform built with the MERN stack (MongoDB, Express, React, Node.js), Tailwind CSS, Razorpay Test Integration, and server-side quota enforcement.

---

## 🌟 1. Project Overview & Membership Tiers

SubSync provides tiered membership access to digital resources, real-time download quota tracking, automated GST tax invoicing, support ticketing, and an administrative control panel.

### The 4 Membership Levels

| Tier | Monthly Price | Quarterly Price | Yearly Price | Daily Quota | Monthly Quota | Features Included |
|---|---|---|---|---|---|---|
| **Free** | ₹0 | ₹0 | ₹0 | 3 assets/day | 20 assets/mo | Standard Dashboard, Starter Knowledge Base |
| **Bronze** | ₹499 | ₹1,299 | ₹4,499 | 15 assets/day | 120 assets/mo | Developer SDKs, Microservices Boilerplates, 24h Ticket SLA |
| **Silver** *(Recommended)* | ₹999 | ₹2,599 | ₹8,999 | 50 assets/day | 450 assets/mo | Figma UI Kits, Design Tokens, Priority Support (< 4h SLA) |
| **Gold** *(VIP)* | ₹2,499 | ₹6,499 | ₹22,499 | 200 assets/day | 3,000 assets/mo | SOC2 & ISO Compliance Suites, AI Swarm Frameworks, 24/7 Concierge |

---

## 🛠️ 2. Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS (Navy `#0f172a` & Elegant Teal `#0d9488` color palette)
- **Icons**: Lucide React
- **Routing**: React Router DOM v7
- **Analytics**: Recharts (Interactive Area & Pie Charts)
- **HTTP Client**: Axios with JWT Interceptors

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database & ODM**: MongoDB & Mongoose
- **Authentication**: JSON Web Tokens (JWT) + bcryptjs password hashing
- **Security**: Helmet, CORS, Express Rate Limit, NoSQL injection prevention
- **Payment Gateway**: Razorpay (Test Mode with cryptographic HMAC-SHA256 signature verification)
- **Resilient Engine**: Integrated MongoDB with automated MongoMemoryServer fallback for instant zero-config evaluation.

---

## 📂 3. Repository Architecture

```text
subsync/
│
├── frontend/
│   ├── public/
│   │   └── logo.svg                 # Brand SVG logo
│   ├── src/
│   │   ├── components/
│   │   │   └── common/              # Navbar, Footer, ProtectedRoute, AdminRoute, Badges
│   │   ├── pages/
│   │   │   ├── public/              # LandingPage (Hero, Features, FAQs, Plans, Testimonials)
│   │   │   ├── auth/                # LoginPage, RegisterPage, ForgotPasswordPage
│   │   │   ├── user/                # UserDashboard, PlansPage, ResourcesPage, BillingPage, SupportPage, ProfileSettingsPage
│   │   │   └── admin/               # AdminDashboard (Metrics, Users, Plans, Assets, Payments, Tickets)
│   │   ├── context/                 # AuthContext, NotificationContext
│   │   ├── services/                # Axios API client
│   │   ├── App.jsx                  # Main application routing
│   │   ├── index.css                # Global styles & Tailwind directives
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── config/                      # db.js (MongoDB Atlas & local fallback engine)
│   ├── controllers/                 # auth, plan, subscription, payment, invoice, resource, notification, support, admin
│   ├── middleware/                  # auth.js, errorHandler.js
│   ├── models/                      # 10 Mongoose schemas (User, Plan, Subscription, Payment, Invoice, etc.)
│   ├── routes/                      # REST API routing definitions
│   ├── services/                    # Razorpay, Invoicing, Notifications, Activity auditing
│   ├── utils/                       # seed.js (Automated database seeder)
│   ├── server.js                    # Core Express server
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── .env.example
├── README.md
└── package.json
```

---

## 🗄️ 4. Database Collections (10 Mongoose Models)

1. **User**: Name, email, phone, hashed password, role (`user`/`admin`), verification, quota tracking.
2. **SubscriptionPlan**: Tier levels (0-3), dynamic pricing (monthly, quarterly, yearly), quotas, features, recommendation flag.
3. **Subscription**: Status (`Active`, `Pending`, `Expired`, `Cancelled`, `Payment Failed`), start/end dates, cycle, renewal state.
4. **Payment**: Order ID, payment ID, signature, amount, currency, status (`Successful`, `Failed`, `Pending`, `Refunded`).
5. **Invoice**: Unique invoice number (`INV-2026-XXXX`), itemized GST breakdown (18%), billing metadata, printable view.
6. **Resource**: Title, description, category, tier requirement (Free/Bronze/Silver/Gold), payload, download counter.
7. **DownloadHistory**: Timestamped audit logs for every file download to enforce daily & monthly limits.
8. **Notification**: In-app alerts, unread counters, subscription milestones, and quota warnings.
9. **ActivityLog**: Security audit log tracking user logins, password modifications, cancellations, and upgrades.
10. **SupportTicket**: Ticket number, category, priority, status (`Open`, `In Progress`, `Resolved`, `Closed`), and messaging thread.

---

## 🚀 5. Getting Started & Running Locally

### Step 1: Clone or Open Workspace
Navigate to the project root directory.

### Step 2: Environment Variables
Create `.env` in `backend/` (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/subsync
JWT_SECRET=subsync_dev_secret_key_92817346182390123
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_placeholder_key_id
RAZORPAY_KEY_SECRET=placeholder_secret_key
```

### Step 3: Start Backend
```bash
cd backend
npm install
npm run dev
```
*Note: If no local or Atlas MongoDB is active, SubSync automatically boots a MongoMemoryServer engine and populates all initial plans, admin users, demo accounts, and digital assets.*

### Step 4: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

---

## 🔑 6. Default Demo Credentials

For quick evaluation, pre-seeded accounts are ready to use immediately:

### 👤 Demo Member Account (Silver Plan)
- **Email**: `user@subsync.com`
- **Password**: `User@1234`
- **Permissions**: Silver Pro member with 50 daily downloads, active Razorpay invoice, and support ticket history.

### 🛡️ Admin Console Account
- **Email**: `admin@subsync.com`
- **Password**: `Admin@1234`
- **Permissions**: Full platform administrator access (`/admin`) for telemetry, user moderation, plan pricing adjustments, asset uploading, refunds, and ticket replies.

---

## 💳 7. Payment Verification Architecture

SubSync integrates Razorpay test mode with strict server-side integrity:
1. Client calls `POST /api/payments/create-order` with the selected plan and billing cycle.
2. Backend computes true pricing from MongoDB, generates an order, and records a `Pending` payment.
3. Razorpay checkout opens on the client.
4. On callback, client submits `orderId`, `paymentId`, and `signature` to `POST /api/payments/verify`.
5. Backend recalculates HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`.
6. Only upon valid signature does the backend activate the subscription, compute new expiration dates, reset quotas, generate a GST tax invoice, and notify the user.

---

## 📄 8. License & Attribution

SubSync is developed as an independent, standalone enterprise subscription management platform under the MIT License.
