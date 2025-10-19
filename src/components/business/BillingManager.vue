<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../../firebase/config'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

// Estado principal
const activeTab = ref('payments') // payments | reports
const payments = ref([])
const appointments = ref([])
const loading = ref(false)
const error = ref(null)

// Filtros
const filters = ref({
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  method: 'all', // all | cash | card | transfer
  status: 'all', // all | pending | completed | cancelled | refunded
  search: '',
})

// Modal de pago
const showPaymentModal = ref(false)
const editingId = ref(null)
const form = ref({
  appointmentId: '',
  amount: 0,
  method: 'cash',
  status: 'completed',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  customerName: '',
  serviceName: '',
})
const formErrors = ref({})

let unsubscribePayments = null
let unsubscribeAppointments = null

// Computed
const paymentsRef = computed(() => collection(db, `businesses/${props.business.id}/payments`))

const filteredPayments = computed(() => {
  let list = payments.value

  // Filtro por fechas
  list = list.filter((p) => {
    const paymentDate = p.date
    return paymentDate >= filters.value.startDate && paymentDate <= filters.value.endDate
  })

  // Filtro por método
  if (filters.value.method !== 'all') {
    list = list.filter((p) => p.method === filters.value.method)
  }

  // Filtro por estado
  if (filters.value.status !== 'all') {
    list = list.filter((p) => p.status === filters.value.status)
  }

  // Búsqueda por cliente o servicio
  if (filters.value.search.trim()) {
    const term = filters.value.search.toLowerCase()
    list = list.filter(
      (p) =>
        p.customerName?.toLowerCase().includes(term) || p.serviceName?.toLowerCase().includes(term),
    )
  }

  return list.sort((a, b) => {
    if (a.date === b.date) {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    }
    return b.date.localeCompare(a.date)
  })
})

// Estadísticas
const stats = computed(() => {
  const filtered = filteredPayments.value
  const completed = filtered.filter((p) => p.status === 'completed')

  const totalRevenue = completed.reduce((sum, p) => sum + (p.amount || 0), 0)

  const byMethod = {
    cash: completed.filter((p) => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0),
    card: completed.filter((p) => p.method === 'card').reduce((sum, p) => sum + p.amount, 0),
    transfer: completed
      .filter((p) => p.method === 'transfer')
      .reduce((sum, p) => sum + p.amount, 0),
  }

  const pending = filtered.filter((p) => p.status === 'pending')
  const pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0)

  return {
    totalRevenue,
    totalPayments: completed.length,
    byMethod,
    pending: pending.length,
    pendingAmount,
    averageTicket: completed.length > 0 ? totalRevenue / completed.length : 0,
  }
})

// Lifecycle
onMounted(async () => {
  loading.value = true

  // Listener de pagos
  const qPayments = query(paymentsRef.value, orderBy('date', 'desc'))
  unsubscribePayments = onSnapshot(
    qPayments,
    (snapshot) => {
      payments.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      loading.value = false
    },
    (err) => {
      error.value = err.message
      loading.value = false
    },
  )

  // Cargar citas para vincular pagos
  try {
    const appointmentsRef = collection(db, 'appointments')
    const qAppts = query(appointmentsRef, where('businessId', '==', props.business.id))
    const apptsSnap = await getDocs(qAppts)
    appointments.value = apptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.warn('No se pudieron cargar las citas:', e)
  }
})

onUnmounted(() => {
  if (unsubscribePayments) unsubscribePayments()
  if (unsubscribeAppointments) unsubscribeAppointments()
})

// Funciones
const openCreateModal = () => {
  editingId.value = null
  form.value = {
    appointmentId: '',
    amount: 0,
    method: 'cash',
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    customerName: '',
    serviceName: '',
  }
  formErrors.value = {}
  showPaymentModal.value = true
}

const openEditModal = (payment) => {
  editingId.value = payment.id
  form.value = {
    appointmentId: payment.appointmentId || '',
    amount: payment.amount || 0,
    method: payment.method || 'cash',
    status: payment.status || 'completed',
    date: payment.date || new Date().toISOString().split('T')[0],
    notes: payment.notes || '',
    customerName: payment.customerName || '',
    serviceName: payment.serviceName || '',
  }
  formErrors.value = {}
  showPaymentModal.value = true
}

const selectAppointment = () => {
  const apt = appointments.value.find((a) => a.id === form.value.appointmentId)
  if (apt) {
    form.value.amount = apt.service?.price || 0
    form.value.customerName = apt.client?.name || ''
    form.value.serviceName = apt.service?.name || ''
    form.value.date = apt.date || form.value.date
  }
}

const validate = () => {
  const e = {}
  if (!form.value.amount || form.value.amount <= 0) e.amount = 'Ingresa un monto válido'
  if (!form.value.method) e.method = 'Selecciona un método de pago'
  if (!form.value.date) e.date = 'Selecciona una fecha'
  formErrors.value = e
  return Object.keys(e).length === 0
}

const savePayment = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const payload = {
      appointmentId: form.value.appointmentId || null,
      amount: parseFloat(form.value.amount),
      method: form.value.method,
      status: form.value.status,
      date: form.value.date,
      notes: form.value.notes,
      customerName: form.value.customerName,
      serviceName: form.value.serviceName,
      updatedAt: serverTimestamp(),
    }

    if (editingId.value) {
      await updateDoc(
        doc(db, `businesses/${props.business.id}/payments/${editingId.value}`),
        payload,
      )
    } else {
      await addDoc(paymentsRef.value, {
        ...payload,
        createdAt: serverTimestamp(),
      })
    }

    showPaymentModal.value = false
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const deletePayment = async (id) => {
  if (!confirm('¿Eliminar este pago?')) return
  loading.value = true
  try {
    await deleteDoc(doc(db, `businesses/${props.business.id}/payments/${id}`))
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const getMethodLabel = (method) => {
  const labels = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
  }
  return labels[method] || method
}

const getMethodIcon = (method) => {
  const icons = {
    cash: 'bi-cash-coin',
    card: 'bi-credit-card',
    transfer: 'bi-bank',
  }
  return icons[method] || 'bi-wallet2'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    completed: 'Completado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  }
  return labels[status] || status
}

const getStatusBadge = (status) => {
  const badges = {
    pending: 'bg-warning',
    completed: 'bg-success',
    cancelled: 'bg-secondary',
    refunded: 'bg-info',
  }
  return badges[status] || 'bg-secondary'
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

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

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')

  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csvContent))
  link.setAttribute('download', `pagos_${filters.value.startDate}_${filters.value.endDate}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="billing-manager">
    <!-- Pestañas -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'payments' }"
          @click="activeTab = 'payments'"
        >
          <i class="bi bi-cash-stack"></i>
          Pagos
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'reports' }"
          @click="activeTab = 'reports'"
        >
          <i class="bi bi-graph-up"></i>
          Reportes
        </button>
      </li>
    </ul>

    <!-- Tab: Pagos -->
    <div v-if="activeTab === 'payments'">
      <!-- Filtros y acciones -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-2">
              <label class="form-label small">Desde</label>
              <input v-model="filters.startDate" type="date" class="form-control form-control-sm" />
            </div>
            <div class="col-md-2">
              <label class="form-label small">Hasta</label>
              <input v-model="filters.endDate" type="date" class="form-control form-control-sm" />
            </div>
            <div class="col-md-2">
              <label class="form-label small">Método</label>
              <select v-model="filters.method" class="form-select form-select-sm">
                <option value="all">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label small">Estado</label>
              <select v-model="filters.status" class="form-select form-select-sm">
                <option value="all">Todos</option>
                <option value="completed">Completado</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelado</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label small">Buscar</label>
              <input
                v-model="filters.search"
                type="text"
                class="form-control form-control-sm"
                placeholder="Cliente o servicio"
              />
            </div>
            <div class="col-md-2 d-flex align-items-end gap-2">
              <button class="btn btn-primary btn-sm flex-grow-1" @click="openCreateModal">
                <i class="bi bi-plus-circle"></i>
                Nuevo
              </button>
              <button
                class="btn btn-outline-secondary btn-sm"
                @click="exportToCSV"
                title="Exportar"
              >
                <i class="bi bi-download"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de pagos -->
      <div class="card">
        <div class="card-body p-0">
          <div v-if="loading && payments.length === 0" class="p-4 text-center text-muted">
            <span class="spinner-border text-primary"></span>
          </div>
          <div v-else-if="filteredPayments.length === 0" class="p-4 text-center text-muted">
            No hay pagos para mostrar
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Notas</th>
                  <th style="width: 120px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in filteredPayments" :key="p.id">
                  <td class="small">{{ formatDate(p.date) }}</td>
                  <td class="fw-semibold">{{ p.customerName || '—' }}</td>
                  <td class="text-muted small">{{ p.serviceName || '—' }}</td>
                  <td class="fw-bold text-success">{{ formatCurrency(p.amount) }}</td>
                  <td>
                    <i :class="getMethodIcon(p.method)" class="me-1"></i>
                    <span class="small">{{ getMethodLabel(p.method) }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadge(p.status)">
                      {{ getStatusLabel(p.status) }}
                    </span>
                  </td>
                  <td class="text-muted small">{{ p.notes || '—' }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(p)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deletePayment(p.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Reportes -->
    <div v-else-if="activeTab === 'reports'">
      <div class="row g-4">
        <!-- Tarjetas de estadísticas -->
        <div class="col-md-3">
          <div class="card stat-card border-success">
            <div class="card-body">
              <h6 class="text-muted mb-2">Ingresos Totales</h6>
              <h3 class="mb-0 text-success">{{ formatCurrency(stats.totalRevenue) }}</h3>
              <small class="text-muted">{{ stats.totalPayments }} pagos</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card border-warning">
            <div class="card-body">
              <h6 class="text-muted mb-2">Pendientes</h6>
              <h3 class="mb-0 text-warning">{{ formatCurrency(stats.pendingAmount) }}</h3>
              <small class="text-muted">{{ stats.pending }} pagos</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card border-info">
            <div class="card-body">
              <h6 class="text-muted mb-2">Ticket Promedio</h6>
              <h3 class="mb-0 text-info">{{ formatCurrency(stats.averageTicket) }}</h3>
              <small class="text-muted">Por transacción</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card border-primary">
            <div class="card-body">
              <h6 class="text-muted mb-2">Periodo</h6>
              <h3 class="mb-0 text-primary">{{ filteredPayments.length }}</h3>
              <small class="text-muted">Transacciones</small>
            </div>
          </div>
        </div>

        <!-- Por método de pago -->
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="bi bi-wallet2"></i>
                Por Método de Pago
              </h6>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center">
                  <i class="bi bi-cash-coin text-success fs-4 me-3"></i>
                  <span>Efectivo</span>
                </div>
                <strong class="text-success">{{ formatCurrency(stats.byMethod.cash) }}</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center">
                  <i class="bi bi-credit-card text-primary fs-4 me-3"></i>
                  <span>Tarjeta</span>
                </div>
                <strong class="text-primary">{{ formatCurrency(stats.byMethod.card) }}</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <i class="bi bi-bank text-info fs-4 me-3"></i>
                  <span>Transferencia</span>
                </div>
                <strong class="text-info">{{ formatCurrency(stats.byMethod.transfer) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen visual -->
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="bi bi-pie-chart"></i>
                Distribución
              </h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span class="small">Efectivo</span>
                  <span class="small fw-bold">
                    {{
                      stats.totalRevenue > 0
                        ? Math.round((stats.byMethod.cash / stats.totalRevenue) * 100)
                        : 0
                    }}%
                  </span>
                </div>
                <div class="progress" style="height: 10px">
                  <div
                    class="progress-bar bg-success"
                    :style="{
                      width:
                        (stats.totalRevenue > 0
                          ? (stats.byMethod.cash / stats.totalRevenue) * 100
                          : 0) + '%',
                    }"
                  ></div>
                </div>
              </div>
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span class="small">Tarjeta</span>
                  <span class="small fw-bold">
                    {{
                      stats.totalRevenue > 0
                        ? Math.round((stats.byMethod.card / stats.totalRevenue) * 100)
                        : 0
                    }}%
                  </span>
                </div>
                <div class="progress" style="height: 10px">
                  <div
                    class="progress-bar bg-primary"
                    :style="{
                      width:
                        (stats.totalRevenue > 0
                          ? (stats.byMethod.card / stats.totalRevenue) * 100
                          : 0) + '%',
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="small">Transferencia</span>
                  <span class="small fw-bold">
                    {{
                      stats.totalRevenue > 0
                        ? Math.round((stats.byMethod.transfer / stats.totalRevenue) * 100)
                        : 0
                    }}%
                  </span>
                </div>
                <div class="progress" style="height: 10px">
                  <div
                    class="progress-bar bg-info"
                    :style="{
                      width:
                        (stats.totalRevenue > 0
                          ? (stats.byMethod.transfer / stats.totalRevenue) * 100
                          : 0) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de pago -->
    <div
      v-if="showPaymentModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Editar Pago' : 'Registrar Pago' }}</h5>
            <button type="button" class="btn-close" @click="showPaymentModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <!-- Vincular cita (opcional) -->
              <div class="mb-3">
                <label class="form-label">Cita (opcional)</label>
                <select
                  v-model="form.appointmentId"
                  @change="selectAppointment"
                  class="form-select"
                >
                  <option value="">Sin cita vinculada</option>
                  <option v-for="apt in appointments" :key="apt.id" :value="apt.id">
                    {{ apt.date }} - {{ apt.time }} | {{ apt.client?.name }} |
                    {{ apt.service?.name }}
                  </option>
                </select>
                <small class="text-muted"> Selecciona una cita para auto-completar datos </small>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Cliente</label>
                  <input
                    v-model="form.customerName"
                    type="text"
                    class="form-control"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Servicio</label>
                  <input
                    v-model="form.serviceName"
                    type="text"
                    class="form-control"
                    placeholder="Nombre del servicio"
                  />
                </div>
              </div>

              <div class="row g-3 mt-1">
                <div class="col-md-4">
                  <label class="form-label">Monto</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input
                      v-model.number="form.amount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-control"
                      :class="{ 'is-invalid': formErrors.amount }"
                    />
                  </div>
                  <div class="invalid-feedback" v-if="formErrors.amount">
                    {{ formErrors.amount }}
                  </div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Método</label>
                  <select
                    v-model="form.method"
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.method }"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                  <div class="invalid-feedback" v-if="formErrors.method">
                    {{ formErrors.method }}
                  </div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Estado</label>
                  <select v-model="form.status" class="form-select">
                    <option value="completed">Completado</option>
                    <option value="pending">Pendiente</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </div>
              </div>

              <div class="mb-3 mt-3">
                <label class="form-label">Fecha</label>
                <input
                  v-model="form.date"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.date }"
                />
                <div class="invalid-feedback" v-if="formErrors.date">{{ formErrors.date }}</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Notas</label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  class="form-control"
                  placeholder="Observaciones adicionales"
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showPaymentModal = false">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" @click="savePayment" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.billing-manager {
  height: 100%;
}

.stat-card {
  border-top: 3px solid;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.table td,
.table th {
  vertical-align: middle;
}

.nav-tabs .nav-link {
  color: #6c757d;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  font-weight: 600;
}

.nav-tabs .nav-link:hover {
  color: #0d6efd;
}
</style>
