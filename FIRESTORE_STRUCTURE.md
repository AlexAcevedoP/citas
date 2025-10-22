# Estructura de Base de Datos en Firestore

## 📊 Colecciones Principales

### 1. **businesses** (Negocios)

Almacena información de cada negocio registrado en la plataforma.

```javascript
{
  id: "auto-generated-id",
  name: "Barbería El Clásico",
  businessType: "barberia", // barberia | peluqueria | spa | tatuajes | clinica | dental | gym | veterinaria
  address: "Calle Principal #123, Col. Centro",
  phone: "+52 555-1234",
  email: "contacto@barberia.com",
  description: "La mejor barbería de la ciudad",
  logo: "https://...", // URL opcional

  // Horarios de atención
  openingHours: {
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "09:00", close: "14:00", closed: false },
    sunday: { open: "09:00", close: "14:00", closed: true }
  },

  // Servicios ofrecidos
  services: [
    {
      id: "service-1",
      name: "Corte de Cabello",
      duration: 30, // minutos
      price: 150, // pesos
      description: "Corte clásico o moderno"
    },
    {
      id: "service-2",
      name: "Barba",
      duration: 20,
      price: 100,
      description: "Arreglo de barba profesional"
    }
  ],

  // Empleados del negocio
  employees: [
    {
      id: "emp-1",
      name: "Carlos Rodríguez",
      role: "Barbero Senior",
      photo: "https://...",
      specialties: ["Corte", "Barba"],
      schedule: {
        monday: { available: true, start: "09:00", end: "18:00" },
        tuesday: { available: true, start: "09:00", end: "18:00" }
        // ... resto de días
      }
    }
  ],

  // Configuración del negocio
  config: {
    color: "#2C3E50", // Color del tema
    allowOnlineBooking: true,
    requiresDeposit: false,
    cancellationPolicy: "24 horas de anticipación",
    notifications: {
      email: true,
      sms: false,
      whatsapp: true
    }
  },

  // Plan de suscripción
  subscription: {
    plan: "premium", // free | basic | premium
    startDate: Timestamp,
    endDate: Timestamp,
    status: "active" // active | inactive | trial
  },

  status: "active", // active | inactive | suspended
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 📊 Subcolecciones por Negocio

### **businesses/{businessId}/services** (Servicios)

Servicios ofrecidos por el negocio.

```javascript
{
  id: "auto-generated-id",
  name: "Limpieza Facial Profunda",
  description: "Limpieza facial con extracción y mascarilla",
  duration: 60, // minutos
  price: 800,
  category: "diagnostico", // diagnostico | biocompatible | mantenimiento | otros
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **businesses/{businessId}/staff** (Personal)

Personal del negocio.

```javascript
{
  id: "auto-generated-id",
  name: "Dra. María González",
  email: "maria@example.com",
  phone: "+52 555-1234",
  role: "specialist", // admin | specialist | receptionist | employee
  specialties: ["Facial", "Dermocosmética", "Peeling"],
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **businesses/{businessId}/users** (Usuarios del Negocio)

Usuarios con acceso al panel del negocio (vinculados con Firebase Auth).

```javascript
{
  id: "firebase-auth-uid",
  email: "admin@example.com",
  name: "Admin Usuario",
  role: "admin", // admin | specialist | receptionist
  createdAt: Timestamp
}
```

### **businesses/{businessId}/payments** (Pagos)

Registro de pagos realizados en el negocio.

```javascript
{
  id: "auto-generated-id",
  appointmentId: "ref-to-appointment", // opcional
  amount: 800,
  method: "card", // cash | card | transfer
  status: "completed", // pending | completed | cancelled | refunded
  date: "2025-10-18", // YYYY-MM-DD
  customerName: "Juan Pérez",
  serviceName: "Limpieza Facial",
  notes: "Pago con tarjeta de crédito",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **businesses/{businessId}/products** (Productos)

Catálogo de productos para venta retail.

```javascript
{
  id: "auto-generated-id",
  // Información básica
  name: "Crema Hidratante Facial",
  description: "Crema hidratante con ácido hialurónico",
  sku: "PROD-001", // Código único (opcional)
  
  // Categorización
  category: "dermocosmetics", // dermocosmetics | treatments | accessories | equipment | other
  brand: "La Roche-Posay",
  
  // Precios
  price: 450.00, // Precio de venta
  cost: 280.00,  // Costo de adquisición
  
  // Inventario
  stock: 25,      // Cantidad disponible
  minStock: 5,    // Stock mínimo (alerta)
  unit: "unidad", // unidad | ml | gr | caja | paquete
  
  // Estado
  active: true,
  
  // Metadatos
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **businesses/{businessId}/productSales** (Ventas de Productos)

Registro de ventas de productos.

```javascript
{
  id: "auto-generated-id",
  // Items vendidos
  items: [
    {
      productId: "product-id",
      productName: "Crema Hidratante Facial",
      quantity: 2,
      price: 450.00
    }
  ],
  total: 1480.00, // Total de la venta
  
  // Cliente
  customerName: "María González", // Opcional
  
  // Pago
  paymentMethod: "card", // cash | card | transfer
  
  // Referencias
  appointmentId: "appointment-id", // Opcional
  notes: "Cliente frecuente",
  
  // Fecha
  date: "2024-01-15", // YYYY-MM-DD
  createdAt: Timestamp
}
```

---

## 📊 Colecciones Principales (Globales)

### 2. **appointments** (Citas)

Almacena todas las citas de todos los negocios.

```javascript
{
  id: "auto-generated-id",
  businessId: "ref-to-business", // Referencia al negocio

  // Información del cliente
  client: {
    name: "Juan Pérez",
    phone: "+52 555-9876",
    email: "juan@email.com",
    notes: "Primera visita" // Notas adicionales
  },

  // Detalles de la cita
  date: "2025-10-20", // Formato YYYY-MM-DD
  time: "10:00", // Formato HH:MM
  duration: 30, // minutos

  // Servicio y empleado
  service: {
    id: "service-1",
    name: "Corte de Cabello",
    price: 150
  },

  employee: {
    id: "emp-1",
    name: "Carlos Rodríguez"
  },

  // Estado de la cita
  status: "pending", // pending | confirmed | completed | cancelled | no-show

  // Pagos
  payment: {
    amount: 150,
    method: "cash", // cash | card | transfer
    status: "pending", // pending | paid | refunded
    paidAt: Timestamp
  },

  // Notas y comentarios
  notes: "Cliente prefiere corte corto",
  internalNotes: "Cliente frecuente", // Solo visible para el negocio

  // Recordatorios enviados
  reminders: {
    email: { sent: true, sentAt: Timestamp },
    sms: { sent: false, sentAt: null },
    whatsapp: { sent: true, sentAt: Timestamp }
  },

  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Si fue cancelada
  cancelledAt: Timestamp,
  cancellationReason: "Cliente canceló"
}
```

---

### 3. **users** (Usuarios)

Almacena información de usuarios del sistema (opcional, para autenticación).

```javascript
{
  id: "auto-generated-id",
  uid: "firebase-auth-uid", // UID de Firebase Auth
  email: "usuario@email.com",
  name: "María González",
  phone: "+52 555-4321",

  // Rol del usuario
  role: "business-owner", // business-owner | employee | customer | admin

  // Negocios asociados
  businesses: [
    {
      businessId: "ref-to-business",
      role: "owner", // owner | manager | employee
      permissions: ["manage-appointments", "manage-employees", "view-reports"]
    }
  ],

  // Preferencias
  preferences: {
    language: "es",
    timezone: "America/Mexico_City",
    notifications: {
      email: true,
      push: true
    }
  },

  photo: "https://...",
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

---

### 4. **customers** (Clientes)

Base de datos de clientes de cada negocio.

```javascript
{
  id: "auto-generated-id",
  businessId: "ref-to-business",

  name: "Ana López",
  phone: "+52 555-7890",
  email: "ana@email.com",

  // Historial
  totalAppointments: 15,
  lastVisit: Timestamp,
  firstVisit: Timestamp,

  // Preferencias del cliente
  preferences: {
    favoriteEmployee: "emp-1",
    favoriteService: "service-2",
    notes: "Alérgica a ciertos productos"
  },

  // Información adicional (específica por tipo de negocio)
  metadata: {
    // Para veterinaria
    pets: [
      { name: "Max", species: "Perro", breed: "Labrador" }
    ],
    // Para gym
    healthInfo: { weight: 70, height: 170 },
    // Para spa/belleza
    skinType: "sensible"
  },

  status: "active", // active | inactive
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 5. **reviews** (Reseñas) - Opcional

```javascript
{
  id: "auto-generated-id",
  businessId: "ref-to-business",
  appointmentId: "ref-to-appointment",
  customerId: "ref-to-customer",

  rating: 5, // 1-5 estrellas
  comment: "Excelente servicio",

  response: {
    text: "Gracias por tu comentario",
    respondedAt: Timestamp,
    respondedBy: "user-id"
  },

  status: "published", // published | hidden | flagged
  createdAt: Timestamp
}
```

---

## 🔍 Índices Recomendados en Firestore

Para optimizar las consultas, crea estos índices:

1. **appointments**
   - `businessId` + `date` (ASC)
   - `businessId` + `status` (ASC) + `date` (ASC)
   - `businessId` + `employeeId` + `date` (ASC)

2. **customers**
   - `businessId` + `phone` (ASC)
   - `businessId` + `email` (ASC)

3. **businesses**
   - `businessType` + `status` (ASC)

---

## 📝 Reglas de Seguridad Sugeridas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Negocios - Solo usuarios autenticados pueden leer
    match /businesses/{businessId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        get(/databases/$(database)/documents/businesses/$(businessId)).data.ownerId == request.auth.uid;
    }

    // Citas - Usuarios deben tener acceso al negocio
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
      // Agregar lógica más específica según tus necesidades
    }

    // Clientes
    match /customers/{customerId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🚀 Ejemplos de Consultas

### Obtener citas de un negocio en una fecha específica

```javascript
const q = query(
  collection(db, 'appointments'),
  where('businessId', '==', 'negocio-123'),
  where('date', '==', '2025-10-20'),
  orderBy('time', 'asc'),
)
```

### Obtener negocios por tipo

```javascript
const q = query(
  collection(db, 'businesses'),
  where('businessType', '==', 'barberia'),
  where('status', '==', 'active'),
)
```

### Historial de un cliente

```javascript
const q = query(
  collection(db, 'appointments'),
  where('businessId', '==', 'negocio-123'),
  where('client.phone', '==', '+52 555-9876'),
  orderBy('date', 'desc'),
  limit(10),
)
```

---

## 💡 Consejos

1. **Usa referencias cuando sea necesario**: Para evitar duplicación, considera usar referencias de documentos en lugar de copiar toda la información.

2. **Desnormalización estratégica**: En Firestore es común duplicar algunos datos para optimizar consultas.

3. **Paginación**: Para listas grandes, implementa paginación usando `startAfter()` y `limit()`.

4. **Listeners en tiempo real**: Usa `onSnapshot()` para actualizaciones en tiempo real donde sea necesario.

5. **Backup regular**: Configura exportaciones automáticas de tu base de datos.
