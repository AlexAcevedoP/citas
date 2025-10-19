<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore'

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

// Estado
const activeSection = ref('overview') // overview | appointments | financial | staff | clients
const loading = ref(false)
const dateRange = ref('30') // 7 | 30 | 90 | 365 | custom
const customStartDate = ref('')
const customEndDate = ref('')

// Datos
const appointments = ref([])
const payments = ref([])
const customers = ref([])
const services = ref([])
const staff = ref([])

let unsubscribeAppointments = null
let unsubscribePayments = null

// Computed - Rango de fechas
const startDate = computed(() => {
  if (dateRange.value === 'custom') {
    return (
      customStartDate.value ||
      new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    )
  }
  const days = parseInt(dateRange.value)
  return new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0]
})

const endDate = computed(() => {
  if (dateRange.value === 'custom') {
    return customEndDate.value || new Date().toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
})

// Filtrar datos por rango de fechas
const filteredAppointments = computed(() => {
  return appointments.value.filter(
    (apt) =>
      apt.businessId === props.business.id &&
      apt.date >= startDate.value &&
      apt.date <= endDate.value,
  )
})

const filteredPayments = computed(() => {
  return payments.value.filter((p) => p.date >= startDate.value && p.date <= endDate.value)
})

// ===== OVERVIEW METRICS =====
const overviewMetrics = computed(() => {
  const apts = filteredAppointments.value
  const pays = filteredPayments.value.filter((p) => p.status === 'completed')

  const totalRevenue = pays.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalAppointments = apts.length
  const completedApts = apts.filter((a) => a.status === 'completed').length
  const cancelledApts = apts.filter((a) => a.status === 'cancelled').length
  const pendingApts = apts.filter((a) => a.status === 'pending').length

  // Clientes únicos en el periodo
  const uniqueClients = new Set(apts.map((a) => a.client?.phone || a.client?.email).filter(Boolean))

  return {
    totalRevenue,
    totalAppointments,
    completedApts,
    cancelledApts,
    pendingApts,
    activeClients: uniqueClients.size,
    avgTicket: pays.length > 0 ? totalRevenue / pays.length : 0,
    completionRate: totalAppointments > 0 ? (completedApts / totalAppointments) * 100 : 0,
    cancellationRate: totalAppointments > 0 ? (cancelledApts / totalAppointments) * 100 : 0,
  }
})

// ===== APPOINTMENTS ANALYTICS =====
const appointmentsAnalytics = computed(() => {
  const apts = filteredAppointments.value

  // Por estado
  const byStatus = {
    pending: apts.filter((a) => a.status === 'pending').length,
    confirmed: apts.filter((a) => a.status === 'confirmed').length,
    completed: apts.filter((a) => a.status === 'completed').length,
    cancelled: apts.filter((a) => a.status === 'cancelled').length,
  }

  // Por servicio
  const byService = {}
  apts.forEach((a) => {
    const service = a.service?.name || 'Sin servicio'
    byService[service] = (byService[service] || 0) + 1
  })

  // Por día de la semana
  const byDayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  apts.forEach((a) => {
    const day = new Date(a.date).getDay()
    byDayOfWeek[day]++
  })

  // Por hora del día
  const byHour = {}
  apts.forEach((a) => {
    const hour = parseInt(a.time?.split(':')[0] || 0)
    byHour[hour] = (byHour[hour] || 0) + 1
  })

  // Horarios pico (top 3)
  const peakHours = Object.entries(byHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))

  return {
    byStatus,
    byService: Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    byDayOfWeek,
    byHour,
    peakHours,
  }
})

// ===== FINANCIAL ANALYTICS =====
const financialAnalytics = computed(() => {
  const pays = filteredPayments.value.filter((p) => p.status === 'completed')

  // Por método de pago
  const byMethod = {
    cash: pays.filter((p) => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0),
    card: pays.filter((p) => p.method === 'card').reduce((sum, p) => sum + p.amount, 0),
    transfer: pays.filter((p) => p.method === 'transfer').reduce((sum, p) => sum + p.amount, 0),
  }

  // Por servicio
  const byService = {}
  pays.forEach((p) => {
    const service = p.serviceName || 'Otro'
    byService[service] = (byService[service] || 0) + p.amount
  })

  // Tendencia diaria
  const dailyRevenue = {}
  pays.forEach((p) => {
    dailyRevenue[p.date] = (dailyRevenue[p.date] || 0) + p.amount
  })

  // Pagos pendientes
  const pendingPayments = filteredPayments.value.filter((p) => p.status === 'pending')
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  return {
    byMethod,
    byService: Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    dailyRevenue: Object.entries(dailyRevenue).sort((a, b) => a[0].localeCompare(b[0])),
    pendingPayments: pendingPayments.length,
    pendingAmount,
  }
})

// ===== STAFF PERFORMANCE =====
const staffPerformance = computed(() => {
  const apts = filteredAppointments.value
  const pays = filteredPayments.value.filter((p) => p.status === 'completed')

  const staffStats = {}

  // Por especialista
  apts.forEach((a) => {
    const specialist = a.specialist?.name || 'Sin asignar'
    if (!staffStats[specialist]) {
      staffStats[specialist] = {
        appointments: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0,
      }
    }
    staffStats[specialist].appointments++
    if (a.status === 'completed') staffStats[specialist].completed++
    if (a.status === 'cancelled') staffStats[specialist].cancelled++

    // Buscar pago correspondiente
    const payment = pays.find((p) => p.appointmentId === a.id)
    if (payment) {
      staffStats[specialist].revenue += payment.amount
    }
  })

  return Object.entries(staffStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
})

// ===== CLIENT ANALYTICS =====
const clientAnalytics = computed(() => {
  const apts = filteredAppointments.value
  const allApts = appointments.value.filter((a) => a.businessId === props.business.id)

  // Clientes por frecuencia
  const clientFrequency = {}
  allApts.forEach((a) => {
    const clientId = a.client?.phone || a.client?.email || a.client?.name
    if (clientId) {
      clientFrequency[clientId] = {
        name: a.client?.name || 'Cliente',
        count: (clientFrequency[clientId]?.count || 0) + 1,
        lastVisit: a.date,
      }
    }
  })

  // Nuevos vs recurrentes en el periodo
  const clientsInPeriod = new Set(
    apts.map((a) => a.client?.phone || a.client?.email).filter(Boolean),
  )
  const newClients = Array.from(clientsInPeriod).filter((clientId) => {
    const firstApt = allApts
      .filter((a) => a.client?.phone === clientId || a.client?.email === clientId)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
    return firstApt && firstApt.date >= startDate.value
  })

  // Top clientes por visitas en el periodo
  const topClients = Object.entries(clientFrequency)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalClients: clientsInPeriod.size,
    newClients: newClients.length,
    returningClients: clientsInPeriod.size - newClients.length,
    topClients,
    retentionRate:
      clientsInPeriod.size > 0
        ? ((clientsInPeriod.size - newClients.length) / clientsInPeriod.size) * 100
        : 0,
  }
})

// Lifecycle
onMounted(async () => {
  loading.value = true

  try {
    // Listener de citas
    const appointmentsRef = collection(db, 'appointments')
    const qApts = query(
      appointmentsRef,
      where('businessId', '==', props.business.id),
      orderBy('date', 'desc'),
    )
    unsubscribeAppointments = onSnapshot(qApts, (snapshot) => {
      appointments.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    })

    // Listener de pagos
    const paymentsRef = collection(db, `businesses/${props.business.id}/payments`)
    const qPays = query(paymentsRef, orderBy('date', 'desc'))
    unsubscribePayments = onSnapshot(qPays, (snapshot) => {
      payments.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    })

    // Cargar servicios y staff
    const servicesSnap = await getDocs(collection(db, `businesses/${props.business.id}/services`))
    services.value = servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    const staffSnap = await getDocs(collection(db, `businesses/${props.business.id}/staff`))
    staff.value = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    // Cargar clientes
    const customersSnap = await getDocs(
      query(collection(db, 'customers'), where('businessId', '==', props.business.id)),
    )
    customers.value = customersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error cargando datos:', e)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (unsubscribeAppointments) unsubscribeAppointments()
  if (unsubscribePayments) unsubscribePayments()
})

// Utilidades
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

const formatPercent = (value) => {
  return `${value.toFixed(1)}%`
}

const getDayName = (dayIndex) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return days[dayIndex]
}

const exportReport = () => {
  // Generar CSV básico
  const headers = ['Métrica', 'Valor']
  const rows = [
    ['Periodo', `${startDate.value} a ${endDate.value}`],
    ['Total Citas', overviewMetrics.value.totalAppointments],
    ['Ingresos Totales', overviewMetrics.value.totalRevenue],
    ['Ticket Promedio', overviewMetrics.value.avgTicket.toFixed(2)],
    ['Clientes Activos', overviewMetrics.value.activeClients],
    ['Tasa Completado', formatPercent(overviewMetrics.value.completionRate)],
    ['Tasa Cancelación', formatPercent(overviewMetrics.value.cancellationRate)],
  ]

  const csvContent =
    'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csvContent))
  link.setAttribute('download', `reporte_${startDate.value}_${endDate.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="reports-manager">
    <!-- Header con selector de periodo -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h5 class="mb-0">
              <i class="bi bi-graph-up-arrow text-primary"></i>
              Reportes y Análisis
            </h5>
            <small class="text-muted">{{ startDate }} a {{ endDate }}</small>
          </div>
          <div class="col-md-6">
            <div class="d-flex gap-2 justify-content-md-end">
              <select
                v-model="dateRange"
                class="form-select form-select-sm"
                style="max-width: 150px"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="365">Último año</option>
                <option value="custom">Personalizado</option>
              </select>
              <button class="btn btn-sm btn-outline-primary" @click="exportReport">
                <i class="bi bi-download"></i>
                Exportar
              </button>
            </div>
          </div>
        </div>

        <!-- Fechas personalizadas -->
        <div v-if="dateRange === 'custom'" class="row mt-3">
          <div class="col-md-6">
            <label class="form-label small">Desde</label>
            <input v-model="customStartDate" type="date" class="form-control form-control-sm" />
          </div>
          <div class="col-md-6">
            <label class="form-label small">Hasta</label>
            <input v-model="customEndDate" type="date" class="form-control form-control-sm" />
          </div>
        </div>
      </div>
    </div>

    <!-- Navegación de secciones -->
    <ul class="nav nav-pills mb-4">
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeSection === 'overview' }"
          @click="activeSection = 'overview'"
        >
          <i class="bi bi-speedometer2"></i> Resumen
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeSection === 'appointments' }"
          @click="activeSection = 'appointments'"
        >
          <i class="bi bi-calendar-check"></i> Citas
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeSection === 'financial' }"
          @click="activeSection = 'financial'"
        >
          <i class="bi bi-cash-stack"></i> Financiero
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeSection === 'staff' }"
          @click="activeSection = 'staff'"
        >
          <i class="bi bi-people"></i> Personal
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeSection === 'clients' }"
          @click="activeSection = 'clients'"
        >
          <i class="bi bi-person-hearts"></i> Clientes
        </button>
      </li>
    </ul>

    <!-- Loading -->
    <div v-if="loading && appointments.length === 0" class="text-center py-5">
      <span class="spinner-border text-primary"></span>
      <p class="mt-2 text-muted">Cargando datos...</p>
    </div>

    <!-- SECCIÓN: RESUMEN -->
    <div v-else-if="activeSection === 'overview'" class="overview-section">
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="card stat-card border-primary">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="text-muted mb-2">Ingresos</h6>
                  <h3 class="mb-0 text-primary">
                    {{ formatCurrency(overviewMetrics.totalRevenue) }}
                  </h3>
                  <small class="text-muted">{{ overviewMetrics.completedApts }} pagos</small>
                </div>
                <i class="bi bi-currency-dollar fs-2 text-primary opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card stat-card border-success">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="text-muted mb-2">Citas Totales</h6>
                  <h3 class="mb-0 text-success">{{ overviewMetrics.totalAppointments }}</h3>
                  <small class="text-success"
                    >{{ formatPercent(overviewMetrics.completionRate) }} completadas</small
                  >
                </div>
                <i class="bi bi-calendar-check fs-2 text-success opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card stat-card border-info">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="text-muted mb-2">Clientes Activos</h6>
                  <h3 class="mb-0 text-info">{{ overviewMetrics.activeClients }}</h3>
                  <small class="text-muted">{{ filteredAppointments.length }} visitas</small>
                </div>
                <i class="bi bi-people fs-2 text-info opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card stat-card border-warning">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="text-muted mb-2">Ticket Promedio</h6>
                  <h3 class="mb-0 text-warning">{{ formatCurrency(overviewMetrics.avgTicket) }}</h3>
                  <small class="text-muted">Por transacción</small>
                </div>
                <i class="bi bi-receipt fs-2 text-warning opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-pie-chart"></i> Estado de Citas</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span>Completadas</span>
                  <strong class="text-success">{{ overviewMetrics.completedApts }}</strong>
                </div>
                <div class="progress" style="height: 8px">
                  <div
                    class="progress-bar bg-success"
                    :style="{
                      width:
                        overviewMetrics.totalAppointments > 0
                          ? (overviewMetrics.completedApts / overviewMetrics.totalAppointments) *
                              100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span>Pendientes</span>
                  <strong class="text-warning">{{ overviewMetrics.pendingApts }}</strong>
                </div>
                <div class="progress" style="height: 8px">
                  <div
                    class="progress-bar bg-warning"
                    :style="{
                      width:
                        overviewMetrics.totalAppointments > 0
                          ? (overviewMetrics.pendingApts / overviewMetrics.totalAppointments) *
                              100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Canceladas</span>
                  <strong class="text-danger">{{ overviewMetrics.cancelledApts }}</strong>
                </div>
                <div class="progress" style="height: 8px">
                  <div
                    class="progress-bar bg-danger"
                    :style="{
                      width:
                        overviewMetrics.totalAppointments > 0
                          ? (overviewMetrics.cancelledApts / overviewMetrics.totalAppointments) *
                              100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-bar-chart"></i> Métricas Clave</h6>
            </div>
            <div class="card-body">
              <div
                class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom"
              >
                <div>
                  <div class="text-muted small">Tasa de Completado</div>
                  <h5 class="mb-0 text-success">
                    {{ formatPercent(overviewMetrics.completionRate) }}
                  </h5>
                </div>
                <i class="bi bi-check-circle fs-3 text-success"></i>
              </div>
              <div
                class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom"
              >
                <div>
                  <div class="text-muted small">Tasa de Cancelación</div>
                  <h5 class="mb-0 text-danger">
                    {{ formatPercent(overviewMetrics.cancellationRate) }}
                  </h5>
                </div>
                <i class="bi bi-x-circle fs-3 text-danger"></i>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">Citas por Cliente</div>
                  <h5 class="mb-0 text-info">
                    {{
                      overviewMetrics.activeClients > 0
                        ? (filteredAppointments.length / overviewMetrics.activeClients).toFixed(1)
                        : 0
                    }}
                  </h5>
                </div>
                <i class="bi bi-arrow-repeat fs-3 text-info"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN: CITAS -->
    <div v-else-if="activeSection === 'appointments'" class="appointments-section">
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-bar-chart-line"></i> Top Servicios</h6>
            </div>
            <div class="card-body">
              <div
                v-if="appointmentsAnalytics.byService.length === 0"
                class="text-center text-muted py-3"
              >
                Sin datos
              </div>
              <div v-else>
                <div
                  v-for="[service, count] in appointmentsAnalytics.byService"
                  :key="service"
                  class="mb-3"
                >
                  <div class="d-flex justify-content-between mb-1">
                    <span class="small">{{ service }}</span>
                    <strong>{{ count }}</strong>
                  </div>
                  <div class="progress" style="height: 6px">
                    <div
                      class="progress-bar bg-primary"
                      :style="{
                        width:
                          filteredAppointments.length > 0
                            ? (count / filteredAppointments.length) * 100 + '%'
                            : '0%',
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-calendar-week"></i> Citas por Día de Semana</h6>
            </div>
            <div class="card-body">
              <div v-for="day in 7" :key="day" class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <span class="small">{{ getDayName(day % 7) }}</span>
                  <strong>{{ appointmentsAnalytics.byDayOfWeek[day % 7] }}</strong>
                </div>
                <div class="progress" style="height: 6px">
                  <div
                    class="progress-bar bg-success"
                    :style="{
                      width:
                        filteredAppointments.length > 0
                          ? (appointmentsAnalytics.byDayOfWeek[day % 7] /
                              filteredAppointments.length) *
                              100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-clock-history"></i> Horarios Pico</h6>
            </div>
            <div class="card-body">
              <div
                v-if="appointmentsAnalytics.peakHours.length === 0"
                class="text-center text-muted py-3"
              >
                Sin datos
              </div>
              <div v-else class="row">
                <div
                  v-for="peak in appointmentsAnalytics.peakHours"
                  :key="peak.hour"
                  class="col-md-4"
                >
                  <div class="text-center p-3 border rounded">
                    <i class="bi bi-alarm fs-1 text-warning"></i>
                    <h4 class="mt-2 mb-0">{{ peak.hour }}</h4>
                    <small class="text-muted">{{ peak.count }} citas</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN: FINANCIERO -->
    <div v-else-if="activeSection === 'financial'" class="financial-section">
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-wallet2"></i> Ingresos por Método de Pago</h6>
            </div>
            <div class="card-body">
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-cash-coin text-success fs-3 me-3"></i>
                    <span>Efectivo</span>
                  </div>
                  <strong class="text-success">{{
                    formatCurrency(financialAnalytics.byMethod.cash)
                  }}</strong>
                </div>
                <div class="progress" style="height: 8px">
                  <div
                    class="progress-bar bg-success"
                    :style="{
                      width:
                        overviewMetrics.totalRevenue > 0
                          ? (financialAnalytics.byMethod.cash / overviewMetrics.totalRevenue) *
                              100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-credit-card text-primary fs-3 me-3"></i>
                    <span>Tarjeta</span>
                  </div>
                  <strong class="text-primary">{{
                    formatCurrency(financialAnalytics.byMethod.card)
                  }}</strong>
                </div>
                <div class="progress" style="height: 8px">
                  <div
                    class="progress-bar bg-primary"
                    :style="{
                      width:
                        overviewMetrics.totalRevenue > 0
                          ? (financialAnalytics.byMethod.card / overviewMetrics.totalRevenue) *
                              100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-bank text-info fs-3 me-3"></i>
                    <span>Transferencia</span>
                  </div>
                  <strong class="text-info">{{
                    formatCurrency(financialAnalytics.byMethod.transfer)
                  }}</strong>
                </div>
                <div class="progress" style="height: 8px">
                  <div
                    class="progress-bar bg-info"
                    :style="{
                      width:
                        overviewMetrics.totalRevenue > 0
                          ? (financialAnalytics.byMethod.transfer / overviewMetrics.totalRevenue) *
                              100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-graph-up"></i> Top Servicios por Ingresos</h6>
            </div>
            <div class="card-body">
              <div
                v-if="financialAnalytics.byService.length === 0"
                class="text-center text-muted py-3"
              >
                Sin datos
              </div>
              <div v-else>
                <div
                  v-for="[service, revenue] in financialAnalytics.byService.slice(0, 5)"
                  :key="service"
                  class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom"
                >
                  <span>{{ service }}</span>
                  <strong class="text-success">{{ formatCurrency(revenue) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-exclamation-triangle"></i> Pagos Pendientes</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-hourglass-split fs-1 text-warning me-3"></i>
                    <div>
                      <h4 class="mb-0">{{ financialAnalytics.pendingPayments }}</h4>
                      <small class="text-muted">Pagos pendientes</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-currency-dollar fs-1 text-warning me-3"></i>
                    <div>
                      <h4 class="mb-0">{{ formatCurrency(financialAnalytics.pendingAmount) }}</h4>
                      <small class="text-muted">Monto pendiente</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN: PERSONAL -->
    <div v-else-if="activeSection === 'staff'" class="staff-section">
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-trophy"></i> Rendimiento del Personal</h6>
        </div>
        <div class="card-body p-0">
          <div v-if="staffPerformance.length === 0" class="p-4 text-center text-muted">
            Sin datos de personal
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Especialista</th>
                  <th class="text-center">Citas</th>
                  <th class="text-center">Completadas</th>
                  <th class="text-center">Canceladas</th>
                  <th class="text-end">Ingresos</th>
                  <th class="text-center">Tasa Éxito</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in staffPerformance" :key="s.name">
                  <td class="fw-semibold">{{ s.name }}</td>
                  <td class="text-center">{{ s.appointments }}</td>
                  <td class="text-center">
                    <span class="badge bg-success">{{ s.completed }}</span>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-danger">{{ s.cancelled }}</span>
                  </td>
                  <td class="text-end fw-bold text-success">{{ formatCurrency(s.revenue) }}</td>
                  <td class="text-center">
                    <span class="badge bg-info">
                      {{
                        s.appointments > 0
                          ? formatPercent((s.completed / s.appointments) * 100)
                          : '0%'
                      }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN: CLIENTES -->
    <div v-else-if="activeSection === 'clients'" class="clients-section">
      <div class="row g-4 mb-4">
        <div class="col-md-4">
          <div class="card stat-card border-primary">
            <div class="card-body text-center">
              <i class="bi bi-person-plus fs-1 text-primary mb-2"></i>
              <h3 class="mb-0">{{ clientAnalytics.newClients }}</h3>
              <small class="text-muted">Nuevos Clientes</small>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card stat-card border-success">
            <div class="card-body text-center">
              <i class="bi bi-arrow-repeat fs-1 text-success mb-2"></i>
              <h3 class="mb-0">{{ clientAnalytics.returningClients }}</h3>
              <small class="text-muted">Clientes Recurrentes</small>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card stat-card border-info">
            <div class="card-body text-center">
              <i class="bi bi-heart fs-1 text-info mb-2"></i>
              <h3 class="mb-0">{{ formatPercent(clientAnalytics.retentionRate) }}</h3>
              <small class="text-muted">Tasa de Retención</small>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-star"></i> Top Clientes</h6>
        </div>
        <div class="card-body p-0">
          <div v-if="clientAnalytics.topClients.length === 0" class="p-4 text-center text-muted">
            Sin datos de clientes
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th class="text-center">Visitas</th>
                  <th>Última Visita</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(client, index) in clientAnalytics.topClients" :key="client.id">
                  <td>
                    <span
                      class="badge"
                      :class="
                        index === 0
                          ? 'bg-warning'
                          : index === 1
                            ? 'bg-secondary'
                            : 'bg-light text-dark'
                      "
                    >
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td class="fw-semibold">{{ client.name }}</td>
                  <td class="text-center">
                    <span class="badge bg-primary">{{ client.count }}</span>
                  </td>
                  <td>{{ new Date(client.lastVisit).toLocaleDateString('es-MX') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-manager {
  height: 100%;
}

.stat-card {
  border-top: 3px solid;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-pills .nav-link {
  color: #6c757d;
  border-radius: 0.5rem;
}

.nav-pills .nav-link:hover {
  background-color: #e9ecef;
}

.nav-pills .nav-link.active {
  background-color: #0d6efd;
}

.table td,
.table th {
  vertical-align: middle;
}

.card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
}

.card-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
}

.progress {
  background-color: #e9ecef;
  border-radius: 10px;
}

.progress-bar {
  border-radius: 10px;
}
</style>
