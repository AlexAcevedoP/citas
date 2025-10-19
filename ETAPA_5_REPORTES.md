# Módulo de Reportes y Análisis

## 📋 Descripción General

El módulo de **Reportes y Análisis** proporciona insights detallados sobre el rendimiento del negocio a través de múltiples dimensiones: citas, finanzas, personal y clientes.

## 🎯 Características Implementadas

### 1. Selector de Periodo

- **Periodos predefinidos**:
  - Últimos 7 días
  - Últimos 30 días
  - Últimos 90 días
  - Último año
  - Personalizado (con rango de fechas)

- **Exportación**: Descarga de reporte resumen en formato CSV

### 2. Secciones de Análisis

#### 📊 Resumen General (Overview)

**Métricas Principales:**

- **Ingresos Totales**: Suma de todos los pagos completados
- **Citas Totales**: Cantidad total de citas en el periodo
- **Clientes Activos**: Clientes únicos que visitaron
- **Ticket Promedio**: Ingreso promedio por transacción

**Visualizaciones:**

- Estado de citas (completadas, pendientes, canceladas) con barras de progreso
- Tasa de completado vs cancelación
- Citas promedio por cliente

#### 📅 Análisis de Citas (Appointments)

**Métricas:**

- **Top Servicios**: Servicios más solicitados con distribución porcentual
- **Citas por Día de Semana**: Distribución de lunes a domingo
- **Horarios Pico**: Top 3 horarios con más citas agendadas

**Utilidad:**

- Identificar servicios más populares
- Optimizar horarios de atención
- Planificar staffing según demanda

#### 💰 Análisis Financiero (Financial)

**Métricas:**

- **Ingresos por Método de Pago**:
  - Efectivo
  - Tarjeta
  - Transferencia
  - Con porcentajes de distribución

- **Top Servicios por Ingresos**: Servicios que generan más revenue
- **Pagos Pendientes**: Cantidad y monto de pagos por cobrar

**Utilidad:**

- Entender flujo de efectivo
- Identificar servicios más rentables
- Monitorear cuentas por cobrar

#### 👥 Rendimiento del Personal (Staff)

**Métricas por Especialista:**

- Total de citas atendidas
- Citas completadas
- Citas canceladas
- Ingresos generados
- Tasa de éxito (% completadas)

**Utilidad:**

- Evaluar desempeño individual
- Identificar top performers
- Distribuir incentivos
- Detectar necesidades de capacitación

#### 💙 Análisis de Clientes (Clients)

**Métricas:**

- **Nuevos Clientes**: Clientes que visitaron por primera vez
- **Clientes Recurrentes**: Clientes que regresaron
- **Tasa de Retención**: Porcentaje de clientes recurrentes
- **Top Clientes**: Ranking por número de visitas

**Utilidad:**

- Medir efectividad de marketing
- Evaluar satisfacción del cliente
- Identificar clientes VIP
- Estrategias de fidelización

## 🗂️ Estructura de Datos

El módulo consume datos de múltiples fuentes:

```javascript
// Datos utilizados
{
  appointments: [], // Collection: appointments (filtradas por businessId)
  payments: [],     // Collection: businesses/{id}/payments
  customers: [],    // Collection: customers (filtradas por businessId)
  services: [],     // Collection: businesses/{id}/services
  staff: []         // Collection: businesses/{id}/staff
}
```

## 📊 Cálculos y Algoritmos

### Ingresos Totales

```javascript
const totalRevenue = filteredPayments
  .filter((p) => p.status === 'completed')
  .reduce((sum, p) => sum + p.amount, 0)
```

### Clientes Únicos

```javascript
const uniqueClients = new Set(
  appointments.map((a) => a.client?.phone || a.client?.email).filter(Boolean),
)
```

### Tasa de Retención

```javascript
const retentionRate = (returningClients / totalClients) * 100
```

### Ticket Promedio

```javascript
const avgTicket = totalRevenue / completedPayments.length
```

### Tasa de Completado

```javascript
const completionRate = (completedApts / totalApts) * 100
```

### Top Servicios

```javascript
const byService = {}
appointments.forEach((a) => {
  const service = a.service?.name || 'Sin servicio'
  byService[service] = (byService[service] || 0) + 1
})
// Ordenar descendente y tomar top 10
```

### Horarios Pico

```javascript
const byHour = {}
appointments.forEach((a) => {
  const hour = parseInt(a.time?.split(':')[0] || 0)
  byHour[hour] = (byHour[hour] || 0) + 1
})
// Top 3 horarios con más citas
```

### Performance del Personal

```javascript
staffStats[specialist] = {
  appointments: totalCitas,
  completed: citasCompletadas,
  cancelled: citasCanceladas,
  revenue: sumaPagosRecibidos,
  successRate: (completed / appointments) * 100,
}
```

## 🎨 Interfaz de Usuario

### Componentes Visuales

1. **Tarjetas de Métricas (Stat Cards)**
   - Icono representativo
   - Valor principal (grande)
   - Valor secundario (pequeño)
   - Color según tipo
   - Efecto hover con elevación

2. **Barras de Progreso**
   - Altura: 6-8px
   - Bordes redondeados
   - Colores según contexto
   - Porcentaje calculado dinámicamente

3. **Tablas de Datos**
   - Headers con fondo claro
   - Hover en filas
   - Badges de colores para estados
   - Alineación por tipo de dato

4. **Navegación por Pills**
   - 5 secciones principales
   - Iconos descriptivos
   - Estado activo resaltado

### Esquema de Colores

| Elemento | Color    | Uso                   |
| -------- | -------- | --------------------- |
| Primary  | Azul     | Ingresos, general     |
| Success  | Verde    | Completado, positivo  |
| Warning  | Amarillo | Pendiente, alerta     |
| Danger   | Rojo     | Cancelado, negativo   |
| Info     | Cyan     | Información, clientes |

## 🔧 Funcionalidades Técnicas

### Real-time Updates

```javascript
// Listeners de Firestore
unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
  appointments.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
})

unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
  payments.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
})
```

### Filtrado por Fechas

```javascript
const filteredAppointments = computed(() => {
  return appointments.value.filter(
    (apt) => apt.date >= startDate.value && apt.date <= endDate.value,
  )
})
```

### Exportación CSV

```javascript
const exportReport = () => {
  const headers = ['Métrica', 'Valor']
  const rows = [
    ['Periodo', `${startDate.value} a ${endDate.value}`],
    ['Total Citas', overviewMetrics.value.totalAppointments],
    ['Ingresos Totales', overviewMetrics.value.totalRevenue],
    // ... más métricas
  ]

  const csvContent =
    'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  // Descargar archivo
  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csvContent))
  link.setAttribute('download', `reporte_${startDate.value}_${endDate.value}.csv`)
  link.click()
}
```

## 📊 Casos de Uso

### 1. Análisis Mensual de Ingresos

```
1. Ir a módulo "Reportes"
2. Seleccionar "Últimos 30 días"
3. Ver sección "Resumen"
4. Analizar ingresos totales y ticket promedio
5. Ir a "Financiero" para desglose por método
6. Exportar reporte si es necesario
```

### 2. Identificar Mejores Horarios

```
1. Ir a sección "Citas"
2. Ver "Citas por Día de Semana"
3. Ver "Horarios Pico"
4. Ajustar horarios de personal según demanda
```

### 3. Evaluar Desempeño del Personal

```
1. Ir a sección "Personal"
2. Revisar tabla de rendimiento
3. Ordenar por ingresos o tasa de éxito
4. Identificar top performers
5. Detectar especialistas con alta cancelación
```

### 4. Análisis de Retención de Clientes

```
1. Ir a sección "Clientes"
2. Ver nuevos vs recurrentes
3. Revisar tasa de retención
4. Analizar top clientes
5. Crear estrategias de fidelización
```

### 5. Comparar Periodos

```
1. Seleccionar primer periodo (ej: últimos 30 días)
2. Anotar métricas clave
3. Cambiar a otro periodo (ej: 30 días anteriores)
4. Comparar cambios en métricas
5. Identificar tendencias
```

## 📈 Insights y Recomendaciones

### Basado en Tasa de Cancelación

- **< 10%**: Excelente gestión
- **10-20%**: Normal, pero puede mejorar
- **> 20%**: Investigar causas (recordatorios, anticipos, etc.)

### Basado en Ticket Promedio

- **Menor al esperado**: Promover servicios premium o combos
- **Alto**: Mantener estrategia, focus en satisfacción
- **Variable**: Analizar por servicio y ajustar precios

### Basado en Retención

- **> 60%**: Excelente fidelización
- **40-60%**: Normal para la industria
- **< 40%**: Mejorar experiencia del cliente

### Basado en Horarios Pico

- Asignar más personal en horarios de alta demanda
- Ofrecer promociones en horarios de baja demanda
- Optimizar duración de servicios según flujo

## 🚀 Mejoras Futuras

### Corto Plazo

- [ ] Gráficas de línea para tendencias temporales
- [ ] Comparación automática con periodo anterior
- [ ] Alertas de métricas críticas
- [ ] Filtros adicionales (por servicio, por especialista)

### Mediano Plazo

- [ ] Dashboard predictivo (machine learning)
- [ ] Exportación a PDF con gráficas
- [ ] Reportes programados por email
- [ ] Benchmarking con otros negocios similares
- [ ] Análisis de sentimiento (si hay reviews)

### Largo Plazo

- [ ] BI avanzado con Tableau/Power BI
- [ ] Integración con Google Analytics
- [ ] Predicción de demanda
- [ ] Recomendaciones automáticas de optimización
- [ ] App móvil con reportes en tiempo real

## 🎯 KPIs Clave del Negocio

| KPI                 | Fórmula                       | Meta Típica |
| ------------------- | ----------------------------- | ----------- |
| Tasa de Completado  | (Completadas / Total) × 100   | > 85%       |
| Tasa de Cancelación | (Canceladas / Total) × 100    | < 15%       |
| Ticket Promedio     | Ingresos / Transacciones      | Variable    |
| Tasa de Retención   | (Recurrentes / Total) × 100   | > 50%       |
| Citas por Cliente   | Total Citas / Clientes Únicos | > 1.5       |
| Ingresos por Staff  | Ingresos / # Especialistas    | Variable    |

## 📝 Notas Técnicas

- **Reactive**: Todos los cálculos se actualizan automáticamente con cambios en datos
- **Performance**: Se cargan todos los datos una vez, filtrado en frontend
- **Escalabilidad**: Para grandes volúmenes (>10k registros), considerar agregaciones en backend
- **Caché**: Los datos se mantienen en memoria durante la sesión
- **Formato**: Usa `Intl.NumberFormat` para formato de moneda localizado (MXN)

## 🐛 Problemas Conocidos

- [ ] Sin gráficas visuales (solo métricas numéricas)
- [ ] Exportación CSV es básica (sin formato avanzado)
- [ ] No hay comparación automática entre periodos
- [ ] Rendimiento puede degradarse con muchos datos (>5000 registros)
- [ ] No hay persistencia de filtros seleccionados

## 💡 Tips de Uso

1. **Análisis Semanal**: Usa "Últimos 7 días" para monitoreo continuo
2. **Reportes Mensuales**: "Últimos 30 días" para revisiones ejecutivas
3. **Planificación**: "Últimos 90 días" para identificar tendencias
4. **Análisis Anual**: "Último año" para reportes de cierre de año
5. **Comparativas**: Usa periodo "Personalizado" para comparar meses específicos

## 📞 Soporte

Para dudas o sugerencias sobre este módulo:

- Crear issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar documentación de Firestore queries
