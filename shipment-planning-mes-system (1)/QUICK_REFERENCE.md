# API Integration Quick Reference

## 📍 File Locations

```
📦 API Modules: src/services/
├── authAPI.ts ..................... Login, Profile, Logout
├── shipmentPlansAPI.ts ............ Shipment CRUD + Dashboard
├── ordersAPI.ts ................... Orders & Pending Shipments
├── productsAPI.ts ................. Products & Stock
├── customersAPI.ts ................ Customers List
├── vehiclesAPI.ts ................. Vehicles CRUD
├── reportsAPI.ts .................. Reports
└── index.ts ....................... Exports

🪝 Hooks: src/utils/useApi.ts
├── useApi() ....................... Fetch data
├── usePaginatedApi() .............. Pagination
├── useApiMutation() ............... Create/Update/Delete
└── useApiSearch() ................. Search with debounce
```

---

## 🚀 Common Use Cases

### 1️⃣ Display a List
```typescript
import { useApi } from '../utils/useApi';
import { shipmentPlansAPI } from '../services';

const { data: plans, loading, error } = useApi(
  () => shipmentPlansAPI.getAll()
);

{loading && <Spinner />}
{error && <Error>{error}</Error>}
{plans?.map(p => <Item key={p.id} item={p} />)}
```

### 2️⃣ Show Single Item
```typescript
const { data: plan } = useApi(
  () => planId ? shipmentPlansAPI.getById(planId) : null,
  [planId]
);

return <DetailView plan={plan} />;
```

### 3️⃣ Create Form
```typescript
import { useApiMutation } from '../utils/useApi';
import { shipmentPlansAPI } from '../services';

const { execute, loading, error, success } = useApiMutation(
  (data) => shipmentPlansAPI.create(data)
);

const handleSubmit = async (formData) => {
  const result = await execute(formData);
  if (result) {
    alert('Created!');
    refetch(); // Reload parent list
  }
};
```

### 4️⃣ Delete Item
```typescript
const { execute: deleteItem } = useApiMutation(
  (id) => shipmentPlansAPI.delete(id)
);

const handleDelete = async (id) => {
  if (confirm('Delete?')) {
    await deleteItem(id);
    refetch(); // Reload list
  }
};
```

### 5️⃣ Update Item
```typescript
const { execute: updatePlan } = useApiMutation(
  (data) => shipmentPlansAPI.update(id, data)
);

const handleUpdate = async (newData) => {
  await updatePlan(newData);
  refetch();
};
```

### 6️⃣ Search with Debounce
```typescript
import { useApiSearch } from '../utils/useApi';

const { query, setQuery, results, loading } = useApiSearch(
  async (q) => {
    // Assuming search endpoint exists
    return customersAPI.search(q);
  },
  300 // debounce 300ms
);

<input 
  value={query} 
  onChange={(e) => setQuery(e.target.value)} 
/>
{results.map(r => <Item key={r.id} item={r} />)}
```

---

## 🔑 API Functions Reference

### Auth
```typescript
import { authAPI } from '../services';

authAPI.login({ email, password })          // → Promise<{token, user}>
authAPI.getProfile()                         // → Promise<AuthUser>
authAPI.logout()                             // → Promise<void>
authAPI.getStoredUser()                      // → AuthUser | null
authAPI.getToken()                           // → string | null
```

### Shipment Plans
```typescript
import { shipmentPlansAPI } from '../services';

shipmentPlansAPI.getAll()                    // → Promise<Plan[]>
shipmentPlansAPI.getById(id)                 // → Promise<Plan>
shipmentPlansAPI.getDashboard()              // → Promise<DashboardStats>
shipmentPlansAPI.create(data)                // → Promise<Plan>
shipmentPlansAPI.update(id, data)            // → Promise<Plan>
shipmentPlansAPI.updateStatus(id, {status})  // → Promise<Plan>
shipmentPlansAPI.delete(id)                  // → Promise<void>
```

### Orders
```typescript
import { ordersAPI } from '../services';

ordersAPI.getAll()                           // → Promise<Order[]>
ordersAPI.getPendingShipment()               // → Promise<Order[]>
ordersAPI.getById(id)                        // → Promise<Order>
```

### Products
```typescript
import { productsAPI } from '../services';

productsAPI.getAll()                         // → Promise<Product[]>
productsAPI.getStock()                       // → Promise<StockLevel[]>
```

### Customers
```typescript
import { customersAPI } from '../services';

customersAPI.getAll()                        // → Promise<Customer[]>
```

### Vehicles
```typescript
import { vehiclesAPI } from '../services';

vehiclesAPI.getAll()                         // → Promise<Vehicle[]>
vehiclesAPI.getAvailable()                   // → Promise<Vehicle[]>
vehiclesAPI.create(data)                     // → Promise<Vehicle>
vehiclesAPI.updateStatus(id, {status})       // → Promise<Vehicle>
```

### Reports
```typescript
import { reportsAPI } from '../services';

reportsAPI.getDaily(startDate, endDate)      // → Promise<DailyReport[]>
reportsAPI.getMonthly(year, month)           // → Promise<MonthlyReport[]>
reportsAPI.getVehicleUtilization(...)        // → Promise<VehicleReport[]>
```

---

## 🧪 Testing API Calls

### Quick Test in Component
```typescript
useEffect(() => {
  shipmentPlansAPI.getAll()
    .then(data => console.log('✅ API Works:', data))
    .catch(err => console.error('❌ API Error:', err));
}, []);
```

### Test in Browser Console
```javascript
// After logging in:
import { shipmentPlansAPI } from './services';
shipmentPlansAPI.getAll().then(d => console.log(d));
```

### Mock for Testing
```typescript
import { vi } from 'vitest';
import * as services from '../services';

vi.spyOn(services.shipmentPlansAPI, 'getAll')
  .mockResolvedValue([...]);
```

---

## 🐛 Debugging Checklist

- [ ] Check `.env.local` has `VITE_API_URL`
- [ ] Verify backend running at that URL
- [ ] Open DevTools → Network tab → check API calls
- [ ] Look for response status and data
- [ ] Check browser console for errors
- [ ] Verify token in localStorage after login
- [ ] Check response types match interfaces
- [ ] Try API call directly in console

---

## ⚡ Performance Tips

### Avoid Unnecessary Re-renders
```typescript
// Good - pass callback
const getPlans = useCallback(() => shipmentPlansAPI.getAll(), []);
const { data } = useApi(getPlans);

// Avoid - creates new function every render
const { data } = useApi(() => shipmentPlansAPI.getAll());
```

### Debounce Heavy Operations
```typescript
const { query, setQuery, results } = useApiSearch(api.search, 500);
// Won't call API until user stops typing for 500ms
```

### Lazy Load Data
```typescript
const [expanded, setExpanded] = useState(false);
const { data } = useApi(
  () => expanded ? shipmentPlansAPI.getDetails() : null,
  [expanded]
);
// Only fetches when expanded = true
```

---

## 🎯 Page Implementation Checklist

For each page you update:

```typescript
// 1. Import
import { useApi, useApiMutation } from '../utils/useApi';
import { someAPI, handleApiError } from '../services';

// 2. Fetch data
const { data, loading, error, refetch } = useApi(
  () => someAPI.getAll()
);

// 3. Handle mutations
const { execute: create } = useApiMutation(
  (data) => someAPI.create(data)
);

// 4. Show loading
if (loading) return <LoadingUI />;

// 5. Show error
if (error) return <ErrorUI error={error} />;

// 6. Display data
return <List items={data} />;

// 7. Update after action
const handleCreate = async (formData) => {
  const result = await create(formData);
  if (result) refetch();
};
```

---

## 🔐 Authentication Flow

```
1. User enters email/password
   ↓
2. authAPI.login({ email, password })
   ↓
3. Backend validates, returns token + user
   ↓
4. Token auto-stored in localStorage
   ↓
5. Future requests include token via axios interceptor
   ↓
6. If 401 error → auto redirect to login
   ↓
7. authAPI.logout() clears everything
```

---

## 📊 Error Handling Pattern

```typescript
import { handleApiError } from '../services';

try {
  const data = await shipmentPlansAPI.getAll();
  setState(data);
} catch (error) {
  const message = handleApiError(error);
  // message is user-friendly: "Bir hata oluştu" or specific message
  showNotification(message, 'error');
}

// Or use useApi which handles this automatically:
const { data, error } = useApi(...);
if (error) <div className="text-red-500">{error}</div>;
```

---

## 🏗️ State Management

### Component State (Local)
```typescript
const [localFilter, setLocalFilter] = useState('');
```

### API Data (useApi)
```typescript
const { data, loading, error } = useApi(...);
```

### Store (Zustand) - Keep for local UI state
```typescript
const { currentUser } = useAppStore(); // Still works
```

### Mutations
```typescript
const { execute, success, error } = useApiMutation(...);
```

---

## 📱 Responsive Page Template

```typescript
import { useApi, useApiMutation } from '../utils/useApi';
import { shipmentPlansAPI, handleApiError } from '../services';

export function PageName() {
  const { data, loading, error, refetch } = useApi(
    () => shipmentPlansAPI.getAll()
  );

  const { execute: create, loading: creating, error: createError } = 
    useApiMutation((data) => shipmentPlansAPI.create(data));

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} onRetry={refetch} />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Page Title</h1>
      
      <CreateForm 
        onSubmit={async (data) => {
          const result = await create(data);
          if (result) refetch();
        }}
        loading={creating}
        error={createError}
      />

      <DataGrid 
        data={data} 
        onDelete={async (id) => {
          if (confirm('Delete?')) {
            // implement delete
            refetch();
          }
        }}
      />
    </div>
  );
}
```

---

## 🎨 UI Component Integration

```typescript
// Error Alert
{error && (
  <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
    {error}
  </div>
)}

// Loading Spinner
{loading && (
  <div className="flex justify-center">
    <Loader2 className="animate-spin" />
  </div>
)}

// Success Message
{success && (
  <div className="bg-green-50 border border-green-200 rounded p-4 text-green-800">
    ✅ Başarılı!
  </div>
)}

// Disabled Submit Button During Loading
<button disabled={loading || creating}>
  {loading ? 'Yükleniyor...' : 'Gönder'}
</button>
```

---

## 📋 Comparison: Before vs After

### Before (Mock Data)
```typescript
const { shipments } = useAppStore();
// Shows mock shipments
```

### After (Real API)
```typescript
const { data: shipments, loading, error } = useApi(
  () => shipmentPlansAPI.getAll()
);
// Shows real data from backend
```

---

## 🔗 Useful Links

- Docs: `API_INTEGRATION_GUIDE.md`
- Examples: `IMPLEMENTATION_GUIDE.md`
- Structure: `PROJECT_STRUCTURE.md`
- Status: `COMPLETION_REPORT.md`

---

## 💡 Pro Tips

1. **Always use try-catch** with APIs
2. **Show loading state** so users know something is happening
3. **Display errors** in user-friendly way
4. **Refetch after mutations** to keep UI in sync
5. **Use TypeScript types** for type safety
6. **Test each API call** before considering it done
7. **Check Network tab** when debugging
8. **Log API responses** to understand data structure

---

**Quick Links:**
- Login Page Example: ✅ `src/pages/LoginPage.tsx`
- Dashboard Page Example: ✅ `src/pages/DashboardPage.tsx`
- API Services: `src/services/`
- Hooks: `src/utils/useApi.ts`
