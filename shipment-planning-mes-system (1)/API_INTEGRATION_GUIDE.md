# API Integration Guide

## Overview
This document describes how to integrate the backend API endpoints with the frontend React application.

## API Configuration

### Base URL
- Default: `http://localhost:3001/api/v1`
- Configurable via environment variable `VITE_API_URL`

### Authentication
- All API calls are automatically intercepted to include the auth token from localStorage
- Token is stored after successful login
- Auth errors (401) automatically redirect to login page

## Available API Modules

### 1. Authentication API (`src/services/authAPI.ts`)

**Login:**
```typescript
import { authAPI } from '../services';

const response = await authAPI.login({ 
  email: 'user@example.com', 
  password: 'password' 
});
// response.token and response.user are automatically stored
```

**Get Profile:**
```typescript
const user = await authAPI.getProfile();
```

**Get Stored User:**
```typescript
const user = authAPI.getStoredUser();
```

**Logout:**
```typescript
await authAPI.logout();
```

---

### 2. Shipment Plans API (`src/services/shipmentPlansAPI.ts`)

**Get All Plans:**
```typescript
import { shipmentPlansAPI } from '../services';

const plans = await shipmentPlansAPI.getAll();
```

**Get Dashboard Stats:**
```typescript
const stats = await shipmentPlansAPI.getDashboard();
// Returns: {
//   total_shipments, delayed, on_time, in_progress,
//   vehicle_utilization, avg_loading_time, personnel_efficiency
// }
```

**Get Plan by ID:**
```typescript
const plan = await shipmentPlansAPI.getById('plan-id');
```

**Create Plan:**
```typescript
const newPlan = await shipmentPlansAPI.create({
  shipment_no: 'SHIP-001',
  order_no: 'ORD-001',
  due_date: '2026-05-15',
  shipment_date: '2026-05-08',
  destination_name: 'Customer Name',
  delivery_address: 'Address',
  country_type: 'DOMESTIC',
  city: 'Istanbul',
  lines: [
    { product_code: 'P001', product_name: 'Product', quantity: 10, unit: 'PC' }
  ]
});
```

**Update Plan:**
```typescript
const updated = await shipmentPlansAPI.update('plan-id', {
  destination_name: 'New Name',
  city: 'New City'
});
```

**Update Status:**
```typescript
const updated = await shipmentPlansAPI.updateStatus('plan-id', {
  status: 'LOADING'
});
```

**Delete Plan:**
```typescript
await shipmentPlansAPI.delete('plan-id');
```

---

### 3. Orders API (`src/services/ordersAPI.ts`)

**Get All Orders:**
```typescript
import { ordersAPI } from '../services';

const orders = await ordersAPI.getAll();
```

**Get Pending Shipments:**
```typescript
const pending = await ordersAPI.getPendingShipment();
```

**Get Order by ID:**
```typescript
const order = await ordersAPI.getById('order-id');
```

---

### 4. Products API (`src/services/productsAPI.ts`)

**Get All Products:**
```typescript
import { productsAPI } from '../services';

const products = await productsAPI.getAll();
```

**Get Stock Levels:**
```typescript
const stock = await productsAPI.getStock();
```

---

### 5. Customers API (`src/services/customersAPI.ts`)

**Get All Customers:**
```typescript
import { customersAPI } from '../services';

const customers = await customersAPI.getAll();
```

---

### 6. Vehicles API (`src/services/vehiclesAPI.ts`)

**Get All Vehicles:**
```typescript
import { vehiclesAPI } from '../services';

const vehicles = await vehiclesAPI.getAll();
```

**Get Available Vehicles:**
```typescript
const available = await vehiclesAPI.getAvailable();
```

**Create Vehicle:**
```typescript
const vehicle = await vehiclesAPI.create({
  plate: 'ABC-1234',
  length_mm: 6000,
  width_mm: 2500,
  height_mm: 2000,
  max_weight: 1500,
  driver_name: 'Driver Name'
});
```

**Update Vehicle Status:**
```typescript
const updated = await vehiclesAPI.updateStatus('vehicle-id', {
  status: 'IN_USE'
});
```

---

### 7. Reports API (`src/services/reportsAPI.ts`)

**Get Daily Reports:**
```typescript
import { reportsAPI } from '../services';

const reports = await reportsAPI.getDaily(
  '2026-05-01', // startDate (optional)
  '2026-05-31'  // endDate (optional)
);
```

**Get Monthly Reports:**
```typescript
const reports = await reportsAPI.getMonthly(
  2026,  // year (optional)
  5      // month (optional)
);
```

**Get Vehicle Utilization:**
```typescript
const utilization = await reportsAPI.getVehicleUtilization(
  '2026-05-01', // startDate (optional)
  '2026-05-31'  // endDate (optional)
);
```

---

## Error Handling

Use the `handleApiError` function to convert API errors to user-friendly messages:

```typescript
import { handleApiError } from '../services';

try {
  const data = await shipmentPlansAPI.getAll();
} catch (error) {
  const errorMessage = handleApiError(error);
  console.error(errorMessage);
}
```

---

## Page Integration Examples

### Dashboard Page
```typescript
import { useEffect, useState } from 'react';
import { shipmentPlansAPI, handleApiError } from '../services';

export function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await shipmentPlansAPI.getDashboard();
        setStats(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  
  return <div>{/* Display stats */}</div>;
}
```

### Shipment Plans Page
```typescript
import { useEffect, useState } from 'react';
import { shipmentPlansAPI, handleApiError } from '../services';

export function ShipmentPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await shipmentPlansAPI.getAll();
        setPlans(data);
      } catch (err) {
        console.error(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // ... rest of component
}
```

### Orders Page
```typescript
import { ordersAPI } from '../services';

export function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadOrders = async () => {
      const data = await ordersAPI.getPendingShipment();
      setOrders(data);
    };
    loadOrders();
  }, []);

  // ... rest of component
}
```

---

## Environment Variables

Create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:3001/api/v1
```

---

## Type Definitions

All API responses are fully typed. Import types for better TypeScript support:

```typescript
import type { 
  ShipmentPlanResponse,
  DashboardResponse,
  Order,
  ProductResponse,
  VehicleResponse
} from '../services';
```

---

## Best Practices

1. **Always use try-catch** when making API calls
2. **Handle loading states** to show users feedback
3. **Display error messages** using `handleApiError`
4. **Use useEffect hooks** for data fetching in components
5. **Store auth token** in localStorage after login
6. **Automatically redirect** to login on 401 errors
7. **Type your responses** with imported interfaces
8. **Consider caching** frequently accessed data

---

## Notes

- The API client automatically includes the auth token in all requests
- Failed requests (401) automatically redirect to the login page
- All endpoints expect JSON request/response format
- Date fields should be in ISO format (YYYY-MM-DD)
