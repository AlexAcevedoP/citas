# 🏗️ Arquitectura de la Plataforma Multi-Negocio

## 📐 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                      │
│                          (Vue.js 3)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Business    │  │ Appointment  │  │  Dashboard   │         │
│  │  Selector    │  │  Calendar    │  │  Component   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                           │                                      │
├───────────────────────────┼──────────────────────────────────────┤
│                    CAPA DE ESTADO                                │
│                        (Pinia)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐          ┌──────────────────┐            │
│  │  Business Store  │◄────────►│ Appointments    │            │
│  │                  │          │     Store        │            │
│  │ - businesses[]   │          │ - appointments[] │            │
│  │ - currentBusiness│          │ - filters        │            │
│  │ - businessTypes  │          │ - stats          │            │
│  └────────┬─────────┘          └────────┬─────────┘            │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          │                                       │
├──────────────────────────┼───────────────────────────────────────┤
│                   CAPA DE DATOS                                  │
│                    (Firebase SDK)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Firebase Firestore Database                  │  │
│  │                                                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ businesses │  │appointments│  │  customers │         │  │
│  │  │ collection │  │ collection │  │ collection │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │                                                            │  │
│  │  ┌────────────┐  ┌────────────┐                          │  │
│  │  │   users    │  │  reviews   │                          │  │
│  │  │ collection │  │ collection │                          │  │
│  │  └────────────┘  └────────────┘                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

### 1. Selección de Negocio

```
Usuario → BusinessSelector → BusinessStore.setCurrentBusiness()
                                     ↓
                        currentBusiness actualizado
                                     ↓
                        UI se actualiza automáticamente
```

### 2. Creación de Cita

```
Usuario → AppointmentForm → Validación
                                ↓
                    AppointmentsStore.addAppointment()
                                ↓
                        Firebase Firestore
                                ↓
                    onSnapshot detecta cambio
                                ↓
                    Store actualiza appointments[]
                                ↓
                    UI se actualiza automáticamente
```

### 3. Tiempo Real

```
Firebase Firestore (cambio) → onSnapshot listener
                                     ↓
                            Store actualiza estado
                                     ↓
                            Vue reactivity trigger
                                     ↓
                            Componentes se re-renderizan
```

## 🎯 Patrones de Diseño Utilizados

### 1. **Store Pattern (Pinia)**

- Centralización del estado
- Computed properties para derivación de datos
- Actions para lógica de negocio

### 2. **Observer Pattern**

- Firebase onSnapshot para actualizaciones en tiempo real
- Vue reactivity system

### 3. **Repository Pattern**

- Stores actúan como repositories
- Abstracción de acceso a datos

### 4. **Composition API Pattern**

- Reutilización de lógica
- Mejor organización del código

## 📊 Modelo de Datos Relacional

```
┌─────────────────┐
│   businesses    │
│─────────────────│
│ id (PK)         │
│ name            │
│ businessType    │◄────┐
│ services[]      │     │
│ employees[]     │     │
└─────────────────┘     │
         △              │
         │              │
         │ businessId   │
         │              │
┌─────────────────┐     │
│  appointments   │     │
│─────────────────│     │
│ id (PK)         │     │
│ businessId (FK) │─────┘
│ client{}        │─────┐
│ service{}       │     │
│ employee{}      │     │
│ date            │     │
│ time            │     │
│ status          │     │ client.phone
└─────────────────┘     │
                        │
                        ▼
                ┌─────────────────┐
                │   customers     │
                │─────────────────│
                │ id (PK)         │
                │ businessId (FK) │
                │ phone           │
                │ email           │
                │ preferences{}   │
                └─────────────────┘
```

## 🔐 Capas de Seguridad

### 1. **Firestore Rules**

```javascript
// Reglas básicas de seguridad
- Usuario debe estar autenticado
- Solo puede acceder a datos de sus negocios
- Validación de estructura de datos
```

### 2. **Validación en Frontend**

```javascript
// Validación de formularios
// Prevención de conflictos de horario
// Validación de permisos de usuario
```

### 3. **Cloud Functions** (Futuro)

```javascript
// Validación server-side
// Procesamiento de pagos
// Envío de notificaciones
```

## 🚀 Escalabilidad

### Estrategias Implementadas:

1. **Indexación**
   - Índices compuestos en Firestore
   - Optimización de consultas

2. **Paginación**
   - Límite de resultados
   - Cursor-based pagination

3. **Caching**
   - Firestore local persistence
   - Computed properties para evitar recálculos

4. **Lazy Loading**
   - Componentes cargados bajo demanda
   - Imágenes lazy-loaded

## 📱 Responsividad

```
Desktop (>992px)
├── Sidebar + Main Content
│   └── Grids de 3-4 columnas

Tablet (768px - 992px)
├── Navbar colapsable
│   └── Grids de 2 columnas

Mobile (<768px)
├── Menu hamburguesa
│   └── Layout de 1 columna
```

## 🔧 Extensibilidad

### Agregar Nuevo Tipo de Negocio:

1. **En `business.js` store:**

```javascript
businessTypes.value.newType = {
  name: 'Nuevo Tipo',
  icon: 'bi-icon',
  color: '#COLOR',
  services: ['Servicio 1', 'Servicio 2'],
  features: ['Feature 1'],
  defaultDuration: 60,
}
```

2. **Crear componente específico (opcional):**

```javascript
// components/NewTypeFeatures.vue
```

3. **Actualizar dashboard para mostrar features específicas**

### Agregar Nueva Funcionalidad:

1. **Crear nueva acción en store**
2. **Crear componente UI**
3. **Actualizar tipos en Firestore**
4. **Agregar rutas si es necesario**

## 🎨 Temas y Personalización

```javascript
// Cada negocio puede tener:
config: {
  color: '#HEX',        // Color primario
  logo: 'URL',          // Logo personalizado
  theme: 'light/dark',  // Tema
  customCSS: '...'      // CSS personalizado
}
```

## 📈 Métricas y Analytics (Futuro)

```
┌─────────────────────────────────┐
│  Google Analytics / Mixpanel    │
└─────────────────────────────────┘
              ↑
              │
┌─────────────────────────────────┐
│     Analytics Service Layer     │
├─────────────────────────────────┤
│ - Track page views              │
│ - Track user actions            │
│ - Track conversions             │
│ - Custom events                 │
└─────────────────────────────────┘
```

## 🧪 Testing Strategy

### Unit Tests

- Stores (Pinia)
- Utilities
- Composables

### Integration Tests

- Componentes con stores
- Flujos de datos completos

### E2E Tests

- Cypress para flujos críticos
- Creación de citas
- Gestión de negocios

## 🌐 Internacionalización (i18n)

```
src/
├── locales/
│   ├── es.json
│   ├── en.json
│   └── pt.json
```

## 💾 Backup y Recuperación

1. **Firebase Automatic Backups**
2. **Export/Import functionality**
3. **Version control de configuraciones**

---

## 📚 Recursos Adicionales

- [Vue.js 3 Docs](https://vuejs.org/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Bootstrap 5 Docs](https://getbootstrap.com/)
