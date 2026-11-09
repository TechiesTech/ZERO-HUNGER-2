# Zero Hunger — Backend API

Node.js + Express + JavaScript (ES Modules) + MongoDB (Mongoose) REST API for the Zero Hunger platform.

> **Structure only.** `app.js` and `server.js` contain a minimal Express app with a `GET /health` endpoint. All other files are placeholder stubs with clear `TODO:` comments. No business logic or database queries have been implemented yet.

---

## Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express 4.x
- **Format:** JavaScript (ES Modules, `"type": "module"`)
- **Database:** MongoDB via Mongoose (driver ready)
- **CORS:** Configured for frontend (`:5173`) and admin (`:5174`)

---

## Directory Structure

```
backend/
├── src/
│   ├── app.js                     # Express app instance, middleware & router mounting
│   ├── server.js                  # Entry point — starts HTTP server on PORT
│   ├── config/
│   │   └── db.js                  # MongoDB / Mongoose connection stub
│   ├── controllers/
│   │   ├── adminController.js     # Admin stats & management handlers
│   │   ├── mealsController.js     # Meal CRUD handlers
│   │   ├── ordersController.js    # Order lifecycle handlers
│   │   ├── paymentsController.js  # Razorpay integration handlers
│   │   ├── ridersController.js    # Rider management handlers
│   │   └── trackingController.js  # Token tracking handlers
│   ├── middleware/
│   │   ├── errorHandler.js        # Global Express 4-param error handler
│   │   ├── rateLimit.js           # Rate limiter stub
│   │   └── validate.js            # Request validator stub
│   ├── models/
│   │   ├── schemas/
│   │   │   ├── deliverySchema.js  # Delivery Mongoose schema
│   │   │   ├── mealSchema.js      # Meal Mongoose schema
│   │   │   ├── orderSchema.js     # Order Mongoose schema
│   │   │   ├── riderSchema.js     # Rider Mongoose schema
│   │   │   └── tokenSchema.js     # Token Mongoose schema
│   │   ├── Delivery.js            # Delivery Mongoose model
│   │   ├── Meal.js                # Meal Mongoose model
│   │   ├── Order.js               # Order Mongoose model
│   │   ├── Rider.js               # Rider Mongoose model
│   │   └── Token.js               # Token Mongoose model
│   ├── routes/
│   │   ├── admin.js               # Admin-only endpoints
│   │   ├── meals.js               # Catalogue endpoints
│   │   ├── orders.js              # Order endpoints
│   │   ├── payments.js            # Payment endpoints
│   │   ├── riders.js              # Rider endpoints
│   │   └── tracking.js            # Real-time tracking endpoints
│   ├── services/
│   │   ├── notificationService.js # SMS / Push / Email notifications stub
│   │   ├── paymentService.js      # Razorpay payment service stub
│   │   ├── pricingService.js      # Pricing / tax / donation calculation stub
│   │   └── tokenService.js        # Token generation & management stub
│   ├── sockets/
│   │   └── tracking.js            # Socket.io real-time location handler stub
│   ├── utils/
│   │   └── index.js               # Shared backend helper utilities stub
│   └── validators/
│       └── index.js               # Request payload schemas stub
├── .env                           # Environment configuration
├── .gitignore
├── Dockerfile                     # Container image setup
├── package.json
└── README.md
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server with live reload (native node --watch)
npm run dev
# Server running on http://localhost:5000
# Health check: http://localhost:5000/health
```

## Unified Authentication

Admin, kitchen, rider, and customer accounts use the shared `users` collection
and `authToken` cookie. Configure `JWT_SECRET` and `CODE_SECRET` with at least
32 characters each. `MAIL_USER` and `MAIL_APP_PASSWORD` are needed to deliver
email verification and password-reset codes; the server warns when either is
missing.

Before deploying the unified account model, back up the database and run the
migration against a database copy first (from the `backend` directory):

```bash
node scripts/migrateToUsers.js
```

The migration copies accounts from `admins`, `kitchens`, `riders`, and
`customers` into `users`, preserves each `_id`, and leaves the old collections
untouched. It is safe to rerun. Conflicting email addresses or phone numbers
must be resolved before the unique indexes can be created.

`POST /api/auth/login` accepts the following body and returns the account's
`roles` in `data.user`. The former email-key body is also accepted for
compatibility:

```json
{ "identifier": "email-or-phone", "password": "..." }
```

Customer registration uses `/api/auth/register` and email-code verification;
rider registration uses `/api/riders/register`, then the same verification
endpoints, followed by admin approval. Rider login, logout, and profile routes
have moved to the shared `/api/auth` endpoints. Authenticated browser requests
must include cookies (`credentials: 'include'`).

---

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `node --watch src/server.js` | Starts server with live auto-restart on file change |
| `npm start` | `node src/server.js` | Production server start |

---

## Ports Reference

| Project | Port | URL |
|---|---|---|
| Customer frontend | 5173 | http://localhost:5173 |
| Admin dashboard | 5174 | http://localhost:5174 |
| **Backend API** | **5000** | **http://localhost:5000** |
