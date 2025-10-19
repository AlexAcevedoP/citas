# Módulo de Facturación y Pagos

## 📋 Descripción General

El módulo de **Facturación y Pagos** permite a los negocios gestionar y rastrear todos los pagos recibidos, con reportes financieros detallados y múltiples métodos de pago.

## 🎯 Características Implementadas

### 1. Registro de Pagos

- ✅ Creación manual de pagos
- ✅ Vinculación opcional con citas
- ✅ Auto-completado de datos desde citas
- ✅ Múltiples métodos de pago
- ✅ Estados de pago configurables
- ✅ Notas y observaciones

### 2. Métodos de Pago Soportados

| Método            | Icono | Descripción                        |
| ----------------- | ----- | ---------------------------------- |
| **Efectivo**      | 💵    | Pago en efectivo                   |
| **Tarjeta**       | 💳    | Pago con tarjeta de crédito/débito |
| **Transferencia** | 🏦    | Transferencia bancaria             |

### 3. Estados de Pago

| Estado          | Color    | Descripción                |
| --------------- | -------- | -------------------------- |
| **Pendiente**   | Amarillo | Pago aún no realizado      |
| **Completado**  | Verde    | Pago recibido exitosamente |
| **Cancelado**   | Gris     | Pago cancelado             |
| **Reembolsado** | Azul     | Pago devuelto al cliente   |

### 4. Filtros y Búsqueda

- 📅 Filtro por rango de fechas (desde/hasta)
- 💰 Filtro por método de pago
- 📊 Filtro por estado
- 🔍 Búsqueda por nombre de cliente o servicio
- 📥 Exportación a CSV

### 5. Reportes y Estadísticas

#### Métricas Principales

- **Ingresos Totales**: Suma de todos los pagos completados
- **Pagos Pendientes**: Total de pagos pendientes de cobrar
- **Ticket Promedio**: Ingreso promedio por transacción
- **Total de Transacciones**: Cantidad de pagos en el periodo

#### Análisis por Método de Pago

- Distribución de ingresos por método
- Porcentajes visuales con barras de progreso
- Comparativa entre efectivo, tarjeta y transferencia

## 🗂️ Estructura de Datos en Firestore

### Colección: `businesses/{businessId}/payments`

```javascript
{
  id: "auto-generated-id",
  appointmentId: "ref-to-appointment", // opcional - vincula con una cita
  amount: 800, // monto del pago
  method: "card", // cash | card | transfer
  status: "completed", // pending | completed | cancelled | refunded
  date: "2025-10-18", // fecha del pago (YYYY-MM-DD)
  customerName: "Juan Pérez", // nombre del cliente
  serviceName: "Limpieza Facial", // servicio pagado
  notes: "Pago con tarjeta de crédito", // observaciones
  createdAt: Timestamp, // fecha de creación del registro
  updatedAt: Timestamp // última actualización
}
```

## 🎨 Interfaz de Usuario

### Pestaña: Pagos

1. **Barra de Filtros**
   - Rango de fechas (últimos 30 días por defecto)
   - Selector de método de pago
   - Selector de estado
   - Campo de búsqueda
   - Botones: "Nuevo Pago" y "Exportar"

2. **Tabla de Pagos**
   - Columnas: Fecha, Cliente, Servicio, Monto, Método, Estado, Notas
   - Acciones: Editar, Eliminar
   - Ordenamiento por fecha descendente

3. **Modal de Pago**
   - Selector de cita (opcional, auto-completa datos)
   - Campos: Cliente, Servicio, Monto, Método, Estado, Fecha, Notas
   - Validaciones en tiempo real

### Pestaña: Reportes

1. **Tarjetas de Estadísticas**
   - 4 tarjetas con métricas principales
   - Colores diferenciados por tipo

2. **Panel "Por Método de Pago"**
   - Lista con iconos y montos por método
   - Total acumulado por cada método

3. **Panel "Distribución"**
   - Barras de progreso con porcentajes
   - Visualización clara de la distribución

## 🔧 Funcionalidades Técnicas

### Real-time Updates

```javascript
const qPayments = query(paymentsRef.value, orderBy('date', 'desc'))
unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
  payments.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
})
```

### Vinculación con Citas

```javascript
const selectAppointment = () => {
  const apt = appointments.value.find((a) => a.id === form.value.appointmentId)
  if (apt) {
    form.value.amount = apt.service?.price || 0
    form.value.customerName = apt.client?.name || ''
    form.value.serviceName = apt.service?.name || ''
    form.value.date = apt.date || form.value.date
  }
}
```

### Exportación a CSV

```javascript
const exportToCSV = () => {
  const headers = ['Fecha', 'Cliente', 'Servicio', 'Monto', 'Método', 'Estado', 'Notas']
  const rows = filteredPayments.value.map((p) => [
    p.date,
    p.customerName || '—',
    p.serviceName || '—',
    p.amount,
    getMethodLabel(p.method),
    getStatusLabel(p.status),
    p.notes || '',
  ])
  // Generar y descargar archivo CSV
}
```

## 📊 Casos de Uso

### 1. Registrar Pago al Finalizar Cita

```
1. Desde el módulo de Facturación, clic en "Nuevo Pago"
2. Seleccionar la cita del dropdown
3. Datos se auto-completan (cliente, servicio, monto)
4. Seleccionar método de pago
5. Confirmar "Completado"
6. Guardar
```

### 2. Registrar Pago Manual (Sin Cita)

```
1. Clic en "Nuevo Pago"
2. Dejar "Sin cita vinculada"
3. Ingresar manualmente: Cliente, Servicio, Monto
4. Seleccionar método y estado
5. Agregar notas si es necesario
6. Guardar
```

### 3. Consultar Ingresos del Mes

```
1. Ir a pestaña "Reportes"
2. Ajustar filtro de fechas al mes actual
3. Ver métricas principales y distribución
4. Analizar por método de pago
```

### 4. Exportar Reporte de Pagos

```
1. Aplicar filtros deseados (fecha, método, estado)
2. Clic en botón "Exportar" (icono de descarga)
3. Se descarga archivo CSV con los datos filtrados
```

## 🔐 Seguridad y Reglas

### Reglas de Firestore Recomendadas

```javascript
match /businesses/{businessId}/payments/{paymentId} {
  // Permitir lectura a usuarios autenticados del negocio
  allow read: if request.auth != null &&
    exists(/databases/$(database)/documents/businesses/$(businessId)/users/$(request.auth.uid));

  // Permitir escritura solo a admins y recepcionistas
  allow create, update: if request.auth != null &&
    get(/databases/$(database)/documents/businesses/$(businessId)/users/$(request.auth.uid)).data.role in ['admin', 'receptionist'];

  // Permitir eliminación solo a admins
  allow delete: if request.auth != null &&
    get(/databases/$(database)/documents/businesses/$(businessId)/users/$(request.auth.uid)).data.role == 'admin';
}
```

## 🚀 Mejoras Futuras

### Corto Plazo

- [ ] Integrar badge de estado de pago en citas
- [ ] Recordatorio automático de pagos pendientes
- [ ] Notificación al cliente al registrar pago

### Mediano Plazo

- [ ] Generación de recibos en PDF
- [ ] Integración con pasarelas de pago (Stripe, Mercado Pago)
- [ ] Facturación electrónica (CFDI México)
- [ ] Programar pagos recurrentes (membresías)

### Largo Plazo

- [ ] Dashboard financiero avanzado con gráficas
- [ ] Proyecciones de ingresos
- [ ] Comparativas año vs año
- [ ] Integración contable (exportar a sistemas contables)

## 📝 Notas Técnicas

- **Real-time**: Los pagos se actualizan en tiempo real usando `onSnapshot`
- **Performance**: Se carga la lista de citas una sola vez al montar el componente
- **Validación**: Validación en el frontend antes de guardar
- **Formato de moneda**: Usa `Intl.NumberFormat` para formato correcto en MXN
- **Filtros**: Los filtros se aplican en el frontend (considerar backend para grandes volúmenes)

## 🐛 Problemas Conocidos

- [ ] Al tener muchos pagos (>1000), considerar paginación
- [ ] Exportación CSV no incluye formato de moneda (solo números)
- [ ] No hay límite de rango de fechas (puede afectar rendimiento)

## 📞 Soporte

Para dudas o sugerencias sobre este módulo:

- Crear issue en el repositorio
- Contactar al equipo de desarrollo
