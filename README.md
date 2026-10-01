# Admin Dashboard - Course Platform

React + Vite + Tailwind CSS admin panel connected to the Node/Express API.

## Features

- Admin Login (JWT)
- Dashboard with live stats
- Manage Platforms (CRUD)
- Manage Courses + Videos (CRUD)
- Manage Customers (view, block/unblock, delete)
- Responsive design
- Toast notifications

## Setup

```bash
cd admin-dashboard
npm install
npm run dev
```

Dashboard runs on: **http://localhost:3000**

Make sure the backend API is running on **http://localhost:5000**

## Default Login

- Email: `admin@example.com`
- Password: `admin123`

## API Configuration

The API base URL is set in `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Vite also proxies `/api` and `/uploads` to the backend during development.
