# E-Commerce Market Platform

A simple e-commerce platform where customers can view products, see details, place orders, view pickup locations, and make payments.

## Features

- View uploaded products
- Product details with descriptions, prices, and pickup locations
- Place orders for products
- Simulate payment processing

## Tech Stack

- Backend: Node.js with Express and SQLite
- Frontend: HTML, CSS, JavaScript

## Setup

1. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

2. Start the backend server:
   ```
   npm run dev
   ```

3. Open the frontend in a browser:
   - Open `frontend/index.html` in your web browser
   - Or serve it with a local server (e.g., using Python: `python -m http.server 8000` in the frontend directory)

## API Endpoints

- GET /products - Get all products
- GET /products/:id - Get product details
- POST /orders - Place an order
- GET /orders/:id - Get order details
- POST /payment - Process payment (simulated)

## Database

The application uses SQLite with tables for products and orders. Sample products are inserted on startup.
