# ETAPA 7: GESTIÓN DE PRODUCTOS E INVENTARIO

## 🎯 Objetivo
Implementar un módulo completo para la gestión de productos y control de inventario, especialmente útil para negocios que venden productos retail (dermocosmética, salones de belleza, clínicas).

## 📊 Estructura de Datos

### Colección: `businesses/{businessId}/products`
```javascript
{
  // Información básica
  name: string,              // Nombre del producto
  description: string,       // Descripción detallada
  sku: string,              // Código único del producto (opcional)
  
  // Categorización
  category: string,          // dermocosmetics | treatments | accessories | equipment | other
  brand: string,            // Marca o laboratorio
  
  // Precios
  price: number,            // Precio de venta al público
  cost: number,             // Costo de adquisición
  
  // Inventario
  stock: number,            // Cantidad disponible
  minStock: number,         // Stock mínimo (alerta)
  unit: string,             // unidad | ml | gr | caja | paquete
  
  // Estado
  active: boolean,          // Producto activo/inactivo
  
  // Metadatos
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Colección: `businesses/{businessId}/productSales`
```javascript
{
  // Información de la venta
  items: [
    {
      productId: string,
      productName: string,
      quantity: number,
      price: number
    }
  ],
  total: number,            // Total de la venta
  
  // Cliente
  customerName: string,     // Nombre del cliente (opcional)
  
  // Pago
  paymentMethod: string,    // cash | card | transfer
  
  // Referencias
  appointmentId: string,    // Si la venta está asociada a una cita (opcional)
  notes: string,            // Notas adicionales
  
  // Fecha
  date: string,             // YYYY-MM-DD
  createdAt: timestamp
}
```

## 🚀 Funcionalidades Implementadas

### 1. Gestión de Productos (Tab Products)

#### Catálogo de Productos
- **Lista completa** con información clave
- **Búsqueda** por nombre, SKU o marca
- **Filtros** por categoría
- **Estados visuales**: stock bajo, sin stock, en stock
- **CRUD completo**: crear, editar, eliminar productos

#### Formulario de Producto
```vue
Campos:
- Nombre (requerido)
- Descripción
- SKU (código único)
- Categoría (select)
- Marca/Laboratorio
- Precio de venta (requerido)
- Costo de adquisición
- Unidad de medida (select)
- Stock inicial
- Stock mínimo (alerta)
- Estado activo/inactivo
```

#### Alertas de Stock Bajo
- Indicador visual cuando `stock <= minStock`
- Lista específica de productos con stock bajo
- Acceso rápido para ajuste de inventario

### 2. Ventas de Productos (Tab Sales)

#### Registro de Ventas
- **Venta multi-producto**: agregar múltiples productos en una sola transacción
- **Selección de productos**: dropdown con productos activos y stock disponible
- **Cálculo automático**: precio unitario se completa automáticamente
- **Total en tiempo real**: suma automática de todos los items
- **Métodos de pago**: efectivo, tarjeta, transferencia
- **Cliente opcional**: posibilidad de registrar nombre del cliente
- **Asociación con citas**: campo para vincular venta a una cita (opcional)

#### Actualización Automática de Stock
Al registrar una venta:
1. Se descuenta automáticamente el stock de cada producto vendido
2. Se actualiza la base de datos en tiempo real
3. Se registra la transacción completa

#### Historial de Ventas
- Lista cronológica de todas las ventas
- Información resumida: fecha, cliente, cantidad de productos, total
- Método de pago utilizado
- Notas adicionales

### 3. Control de Inventario (Tab Inventory)

#### Dashboard de Inventario
- **Valor total del inventario**: suma de (stock × costo) de todos los productos
- **Productos activos**: contador de productos habilitados
- **Alertas de stock bajo**: productos que requieren reabastecimiento

#### Ajustes de Inventario
Tres tipos de movimientos:
1. **Entrada (in)**: agregar stock
   - Ejemplo: nueva compra de productos
2. **Salida (out)**: reducir stock
   - Ejemplo: merma, donación, uso interno
3. **Ajuste (adjustment)**: establecer cantidad exacta
   - Ejemplo: corrección por conteo físico

Cada movimiento incluye:
- Cantidad
- Motivo (razón del movimiento)
- Referencia (# factura, # pedido, etc.)

### 4. Reportes y Análisis (Tab Reports)

#### Métricas Generales
- **Ventas totales**: suma de todas las transacciones
- **Ticket promedio**: venta total / cantidad de transacciones
- **Productos vendidos**: suma total de unidades vendidas

#### Métodos de Pago
Desglose de ventas por método:
- Efectivo
- Tarjeta
- Transferencia

#### Top 10 Productos Más Vendidos
Ranking con:
- Posición (medallas para top 3)
- Nombre del producto
- Cantidad total vendida
- Ingresos generados

## 🎨 Interfaz de Usuario

### Navegación por Tabs
```
[Productos] [Ventas] [Inventario] [Reportes]
```

### Estados Visuales
```css
Stock Status:
- Sin stock: badge-danger (rojo)
- Stock bajo: badge-warning (amarillo)
- En stock: badge-success (verde)

Categorías: badge-secondary
Estado activo/inactivo: badge-success/secondary
```

### Acciones Rápidas
- Botón "Ajustar stock" directo desde lista de productos
- Editar/Eliminar desde cada fila
- Modal de confirmación para eliminaciones

## 💡 Casos de Uso

### Caso 1: Negocio de Dermocosmética
```
1. Agregar productos:
   - Cremas faciales
   - Serums
   - Protectores solares
   - Limpiadores

2. Durante una cita:
   - Especialista recomienda producto
   - Recepcionista registra venta
   - Venta asociada a la cita
   - Stock se descuenta automáticamente

3. Control de inventario:
   - Alertas cuando productos están por agotarse
   - Reporte de productos más vendidos
   - Análisis de ingresos por productos
```

### Caso 2: Salón de Belleza
```
1. Catálogo de productos:
   - Shampoos profesionales
   - Tratamientos capilares
   - Herramientas (cepillos, planchas)
   - Accesorios

2. Venta al mostrador:
   - Cliente compra productos sin cita
   - Registro rápido con método de pago
   - Actualización de inventario

3. Gestión:
   - Compra de nuevos productos (entrada)
   - Ajuste por conteo físico mensual
   - Identificar productos estrella
```

## 🔗 Integraciones

### Con Módulo de Citas
- Posibilidad de vincular venta a una cita específica
- Campo `appointmentId` en la venta
- Permite análisis de productos vendidos por tratamiento

### Con Módulo de Facturación
- Las ventas de productos pueden integrarse en los reportes financieros
- Suma adicional de ingresos aparte de servicios
- Análisis de rentabilidad por categoría

### Con Módulo de Reportes
- Datos de productos para métricas generales del negocio
- Análisis de preferencias de clientes
- Tendencias de consumo

## 📈 KPIs y Métricas

### Métricas de Inventario
```javascript
// Valor del inventario
totalInventoryValue = Σ(product.stock × product.cost)

// Rotación de inventario
stockTurnover = totalSales / averageStock

// Stock Coverage
coverageDays = currentStock / averageDailySales
```

### Métricas de Ventas
```javascript
// Ticket promedio
averageTicket = totalSales / numberOfTransactions

// Margen de utilidad
profitMargin = ((price - cost) / price) × 100

// Productos por transacción
averageItems = totalItems / numberOfTransactions
```

### Métricas de Productos
```javascript
// Top performers
topProducts = sortByQuantitySold(products).slice(0, 10)

// Productos de baja rotación
slowMoving = products.filter(p => 
  p.lastSale < 90daysAgo && p.stock > 0
)
```

## 🔧 Funciones Principales

### Gestión de Productos
```javascript
// CRUD básico
saveProduct()      // Crear o actualizar producto
deleteProduct(id)  // Eliminar producto

// Validaciones
validateProduct()  // Validar formulario
getStockStatus()   // Determinar estado del stock
```

### Ventas
```javascript
// Proceso de venta
saveSale()            // Registrar venta
updateProductStock()  // Actualizar inventario
onProductSelect()     // Autocompletar precio

// Cálculos
saleTotal()          // Total de la venta
validateSale()       // Validar transacción
```

### Inventario
```javascript
// Movimientos
saveInventoryMovement()  // Registrar ajuste

// Cálculos
totalInventoryValue()    // Valor total del inventario
lowStockProducts()       // Productos con alerta
```

### Reportes
```javascript
// Análisis
salesStats()           // Estadísticas generales
topSellingProducts()   // Ranking de productos
calculateMargin()      // Margen de utilidad
```

## 🎯 Mejoras Futuras

### Nivel 1: Funcionalidades Básicas
- [ ] Códigos de barras para productos (escaneo)
- [ ] Exportar catálogo a Excel/CSV
- [ ] Importar productos desde archivo
- [ ] Fotos de productos
- [ ] Variantes de productos (tallas, colores)

### Nivel 2: Análisis Avanzado
- [ ] Gráficas de ventas por período
- [ ] Predicción de demanda
- [ ] Alertas automáticas por email/SMS
- [ ] Análisis ABC de inventario
- [ ] Comparativa de períodos

### Nivel 3: Integraciones
- [ ] Proveedores (gestión de compras)
- [ ] Órdenes de compra automáticas
- [ ] Integración con facturación electrónica
- [ ] Programa de puntos/lealtad
- [ ] Descuentos y promociones

### Nivel 4: Optimización
- [ ] Historial de movimientos de inventario
- [ ] Trazabilidad de lotes
- [ ] Fechas de caducidad
- [ ] Multi-almacén
- [ ] Transferencias entre sucursales

## 🔐 Consideraciones de Seguridad

### Permisos por Rol
```javascript
admin:
  - CRUD completo de productos
  - Ajustes de inventario
  - Registro de ventas
  - Ver reportes

receptionist:
  - Ver catálogo
  - Registro de ventas
  - Alertas de stock

specialist:
  - Ver catálogo
  - Ver stock disponible
  - (opcional) Registro de ventas
```

### Validaciones
- Stock no puede ser negativo
- Precio de venta debe ser mayor a 0
- Cantidad en ventas debe ser ≤ stock disponible
- SKU único (si se proporciona)

### Auditoría
- Registro de `createdAt` y `updatedAt`
- Rastreo de quién hizo cada movimiento (futura mejora)
- Logs de cambios de stock importantes

## 📝 Notas de Implementación

### Firestore Security Rules
```javascript
// Productos
match /businesses/{businessId}/products/{productId} {
  allow read: if userHasAccessToBusiness(businessId);
  allow write: if userIsAdminOrReceptionist(businessId);
}

// Ventas de productos
match /businesses/{businessId}/productSales/{saleId} {
  allow read: if userHasAccessToBusiness(businessId);
  allow write: if userIsAdminOrReceptionist(businessId);
  allow create: if request.resource.data.createdAt == request.time;
}
```

### Índices Recomendados
```javascript
// products collection
{ businessId, category, name }
{ businessId, active, stock }
{ businessId, sku }

// productSales collection
{ businessId, date }
{ businessId, createdAt }
```

## 🎓 Conclusión

El módulo de Gestión de Productos proporciona:

✅ Control total del inventario
✅ Registro simplificado de ventas
✅ Alertas automáticas de stock
✅ Análisis de productos más rentables
✅ Integración con otros módulos del sistema
✅ Interfaz intuitiva y rápida

Especialmente valioso para negocios que combinan servicios + venta de productos retail.
