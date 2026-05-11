# Frontend API Integration - Implementation Guide

## Quick Start

### Step 1: Import API modules
```typescript
import { shipmentPlansAPI, ordersAPI, authAPI, handleApiError } from '../services';
```

### Step 2: Use the useApi hook for data fetching
```typescript
import { useApi } from '../utils/useApi';

export function MyPage() {
  const { data, loading, error, refetch } = useApi(
    () => shipmentPlansAPI.getAll()
  );

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  
  return <div>/* Display data */</div>;
}
```

### Step 3: Use the useApiMutation hook for create/update/delete
```typescript
import { useApiMutation } from '../utils/useApi';

export function CreatePlanForm() {
  const { execute, loading, error, success } = useApiMutation(
    (data) => shipmentPlansAPI.create(data)
  );

  const handleSubmit = async (formData) => {
    const result = await execute(formData);
    if (result) {
      console.log('Plan created!', result);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">Başarılı!</div>}
      {/* form fields */}
    </form>
  );
}
```

---

## Complete Example: Shipment Plans Page

```typescript
import React, { useState } from 'react';
import { useApi, useApiMutation } from '../utils/useApi';
import { shipmentPlansAPI } from '../services';
import type { ShipmentPlanResponse, CreateShipmentPlanRequest } from '../services';

export function ShipmentPlansPage() {
  // Fetch all plans
  const { data: plans, loading, error, refetch } = useApi(
    () => shipmentPlansAPI.getAll()
  );

  // Create mutation
  const { execute: createPlan, loading: creating, error: createError } = 
    useApiMutation<CreateShipmentPlanRequest, ShipmentPlanResponse>(
      (data) => shipmentPlansAPI.create(data)
    );

  // Update mutation
  const { execute: updatePlan, loading: updating } = 
    useApiMutation<UpdateShipmentPlanRequest, ShipmentPlanResponse>(
      (data) => shipmentPlansAPI.update(selectedId, data)
    );

  // Delete mutation
  const { execute: deletePlan, loading: deleting } = 
    useApiMutation<string, void>(
      (id) => shipmentPlansAPI.delete(id)
    );

  const handleCreate = async (formData: CreateShipmentPlanRequest) => {
    const result = await createPlan(formData);
    if (result) {
      refetch(); // Refresh list
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sil?')) {
      await deletePlan(id);
      refetch();
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sevkiyat Planları</h1>
      
      {/* Create form */}
      <CreatePlanForm 
        onSubmit={handleCreate}
        loading={creating}
        error={createError}
      />

      {/* Plans list */}
      <div className="mt-8 grid gap-4">
        {plans?.map(plan => (
          <PlanCard 
            key={plan.id} 
            plan={plan}
            onDelete={() => handleDelete(plan.id)}
            onEdit={(data) => updatePlan(data)}
            loading={deleting || updating}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Complete Example: Dashboard with Multiple APIs

```typescript
import React from 'react';
import { useApi } from '../utils/useApi';
import { shipmentPlansAPI, ordersAPI, vehiclesAPI } from '../services';

export function DashboardPage() {
  // Parallel API calls
  const { data: dashboardStats } = useApi(() => shipmentPlansAPI.getDashboard());
  const { data: pendingOrders } = useApi(() => ordersAPI.getPendingShipment());
  const { data: availableVehicles } = useApi(() => vehiclesAPI.getAvailable());

  return (
    <div className="grid gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          title="Toplam Sevkiyat" 
          value={dashboardStats?.total_shipments} 
        />
        <StatCard 
          title="Gecikenler" 
          value={dashboardStats?.delayed} 
        />
        <StatCard 
          title="Araç Doluluk" 
          value={`${dashboardStats?.vehicle_utilization}%`} 
        />
        <StatCard 
          title="Personel Verimliliği" 
          value={`${dashboardStats?.personnel_efficiency}%`} 
        />
      </div>

      {/* Pending Orders */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Bekleyen Siparişler</h2>
        <OrdersList orders={pendingOrders} />
      </section>

      {/* Available Vehicles */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Müsait Araçlar</h2>
        <VehiclesList vehicles={availableVehicles} />
      </section>
    </div>
  );
}
```

---

## Error Handling Best Practices

```typescript
import { handleApiError } from '../services';

try {
  const data = await shipmentPlansAPI.getAll();
} catch (error) {
  // Always use handleApiError for user-friendly messages
  const message = handleApiError(error);
  console.error(message);
  // Show to user
  showNotification(message, 'error');
}
```

---

## Authentication Flow

```typescript
import { authAPI } from '../services';

export function LoginPage() {
  const { execute: login, loading, error } = useApiMutation(
    (credentials) => authAPI.login(credentials)
  );

  const handleLogin = async (email: string, password: string) => {
    const result = await login({ email, password });
    if (result) {
      // Token and user are automatically stored
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {error && <ErrorAlert message={error} />}
      {/* form fields */}
    </form>
  );
}
```

---

## Form Submission with File Validation

```typescript
import { useApiMutation } from '../utils/useApi';
import { shipmentPlansAPI } from '../services';

export function CreateShipmentForm() {
  const [formData, setFormData] = useState<CreateShipmentPlanRequest>({
    shipment_no: '',
    order_no: '',
    due_date: '',
    shipment_date: '',
    destination_name: '',
    delivery_address: '',
    country_type: 'DOMESTIC',
    city: '',
  });

  const { execute: create, loading, error } = useApiMutation(
    (data) => shipmentPlansAPI.create(data)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.shipment_no) {
      alert('Sevkiyat numarası gerekli');
      return;
    }

    const result = await create(formData);
    if (result) {
      alert('Başarıyla oluşturuldu!');
      // Reset form or navigate
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.shipment_no}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          shipment_no: e.target.value
        }))}
        disabled={loading}
      />
      {error && <p className="text-red-500">{error}</p>}
      <button disabled={loading} type="submit">
        {loading ? 'Gönderiliyor...' : 'Gönder'}
      </button>
    </form>
  );
}
```

---

## Search/Filter Implementation

```typescript
import { useApiSearch } from '../utils/useApi';

export function CustomerSearchPage() {
  const { query, setQuery, results, loading } = useApiSearch(
    async (q) => {
      // Assuming your API has a search endpoint
      return customersAPI.search(q);
    },
    300 // debounce 300ms
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Müşteri ara..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {loading && <p>Aranıyor...</p>}
      
      <ul>
        {results.map(customer => (
          <li key={customer.id}>{customer.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Reports Page Integration

```typescript
import { useApi } from '../utils/useApi';
import { reportsAPI } from '../services';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: '2026-05-01',
    endDate: '2026-05-31',
  });

  const { data: dailyReports } = useApi(
    () => reportsAPI.getDaily(dateRange.startDate, dateRange.endDate),
    [dateRange]
  );

  const { data: vehicleUtilization } = useApi(
    () => reportsAPI.getVehicleUtilization(dateRange.startDate, dateRange.endDate),
    [dateRange]
  );

  return (
    <div>
      <div className="mb-6">
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({...prev, startDate: e.target.value}))}
        />
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({...prev, endDate: e.target.value}))}
        />
      </div>

      {/* Daily chart */}
      <div>
        <h2>Günlük Rapor</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyReports}>
            <CartesianGrid />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="shipments_processed" stroke="#3b82f6" />
            <Line type="monotone" dataKey="on_time_delivery_rate" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Vehicle utilization table */}
      <div>
        <h2>Araç Kullanımı</h2>
        <table>
          <thead>
            <tr>
              <th>Araç</th>
              <th>Sürücü</th>
              <th>Kullanım %</th>
              <th>Seyahat Sayısı</th>
            </tr>
          </thead>
          <tbody>
            {vehicleUtilization?.map(vehicle => (
              <tr key={vehicle.vehicle_id}>
                <td>{vehicle.plate}</td>
                <td>{vehicle.driver_name}</td>
                <td>{vehicle.utilization_percentage}%</td>
                <td>{vehicle.trips_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Tips & Tricks

### 1. Refresh data after mutations
```typescript
const { execute: create } = useApiMutation(...);
const { refetch } = useApi(...);

const handleCreate = async (data) => {
  const result = await create(data);
  if (result) refetch(); // Reload list
};
```

### 2. Conditional API calls
```typescript
const { data } = useApi(
  () => selectedId ? shipmentPlansAPI.getById(selectedId) : Promise.resolve(null),
  [selectedId]
);
```

### 3. Multiple errors handling
```typescript
const { data: plans, error: plansError } = useApi(...);
const { data: vehicles, error: vehiclesError } = useApi(...);

const allErrors = [plansError, vehiclesError].filter(Boolean);
```

### 4. Caching with useMemo
```typescript
const memoizedData = useMemo(() => 
  orders?.filter(o => o.status === 'PENDING'),
  [orders]
);
```

---

## Testing API Integration

```typescript
import { vi } from 'vitest';
import * as services from '../services';

describe('ShipmentPlansPage', () => {
  it('should load and display plans', async () => {
    vi.spyOn(services.shipmentPlansAPI, 'getAll').mockResolvedValue([
      { id: '1', shipment_no: 'SHIP-001', /* ... */ }
    ]);

    // render and test
  });
});
```

---

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your backend URL:
   ```
   VITE_API_URL=http://localhost:3001/api/v1
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

---

## Troubleshooting

### 401 Unauthorized errors
- Check if token is stored in localStorage
- Ensure auth token is valid and not expired
- Try logging out and logging back in

### CORS errors
- Verify backend CORS configuration
- Check if API URL is correct in .env file
- Ensure backend is running on the correct port

### Network errors
- Check if backend is running
- Verify API URL in browser DevTools Network tab
- Check network connectivity

### Type errors
- Import correct types from services
- Ensure API responses match type definitions
- Run `npm run build` to catch TypeScript errors

---

## Next Steps

1. Update each page with appropriate API calls
2. Remove mock data generation from pages
3. Test all endpoints with the backend
4. Add loading/error states to all pages
5. Implement proper error notifications
6. Add request/response logging for debugging
