# Bill Express

[![CI](https://github.com/DhaatuTheGamer/bill-express/actions/workflows/ci.yml/badge.svg)](https://github.com/DhaatuTheGamer/bill-express/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.8.2-blue.svg)
![Vite](https://img.shields.io/badge/vite-6.2.0-brightgreen.svg)
![Express](https://img.shields.io/badge/express-4.21.2-lightgrey.svg)

A modern, full-stack Point of Sale (POS) and billing application designed to streamline customer, product, and invoice management. Bill Express simplifies daily retail operations, offering intuitive dashboard analytics, inventory tracking, and seamless invoice generation with built-in GST calculations.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage Examples](#usage-examples)
- [Contributing](#contributing)
- [Tests](#tests)
- [License](#license)

## Features
- **Dashboard Analytics**: Get real-time insights on sales, top products, and low-stock items.
- **Product Management**: Create, update, and manage inventory with HSN codes, GST rates, and dynamic stock tracking.
- **Customer Management**: Maintain a directory of clients including GSTIN details and track their lifetime value.
- **Invoice Generation**: Generate and manage B2B/B2C invoices, handle discounts, auto-calculate SGST/CGST/IGST, and track payment status. Cancel invoices to automatically restore item stock.
- **AI Integration**: Powered by `@google/genai` to easily bring smart insights into your workflow.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS (v4), React Router DOM, Recharts, Framer Motion, Lucide React.
- **Backend**: Express.js (Node.js) coupled with Vite middleware.
- **Database**: SQLite3 via `better-sqlite3`.
- **Language**: TypeScript (`tsx` for execution).

## Prerequisites
Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- npm (v9 or higher recommended)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DhaatuTheGamer/bill-express
   cd bill-express
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   This command starts the backend Express server alongside the Vite frontend development server at `http://localhost:3000`.

## Usage Examples

**1. Creating a Product (API)**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"code": "P001", "name": "Wireless Mouse", "category": "Electronics", "unit": "pcs", "price_ex_gst": 500, "gst_rate": 18, "hsn_code": "8471", "stock": 50}'
```

**2. Fetching Dashboard Analytics (API)**
```bash
curl http://localhost:3000/api/dashboard/analytics
```

**3. Frontend Usage**
- Navigate to `http://localhost:3000` in your browser.
- Login to access the dashboard.
- Create a new bill from the "New Bill" section by adding products to the cart and selecting a customer. 
- The application will automatically calculate the subtotal, taxes (CGST/SGST/IGST), and the final total for the invoice.

## Contributing
We welcome contributions to Bill Express! Here's how you can help:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

Please ensure your code follows the existing style, run type definitions checks (`npm run lint`), and keep commits atomic and descriptive.

## Tests
The project uses Vitest for unit and integration testing, and the CI/CD pipeline ensures all tests are passing. To run the test suite locally:
```bash
npm run test
```

## License
This project is licensed under the MIT License. See the `LICENSE` file for full details.
