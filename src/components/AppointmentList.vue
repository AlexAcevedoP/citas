<template>
  <div class="appointment-list">
    <!-- Header con título y controles -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="text-primary">
        <i class="bi bi-list-ul"></i>
        Lista de Citas
      </h2>
      <button class="btn btn-success" @click="showNewAppointmentModal">
        <i class="bi bi-plus-circle"></i>
        Nueva Cita
      </button>
    </div>

    <!-- Filtros y búsqueda -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <!-- Búsqueda -->
          <div class="col-md-4">
            <label for="search" class="form-label">Buscar</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-search"></i>
              </span>
              <input
                type="text"
                class="form-control"
                id="search"
                v-model="searchTerm"
                placeholder="Buscar por cliente, título..."
              >
            </div>
          </div>

          <!-- Filtro por estado -->
          <div class="col-md-3">
            <label for="statusFilter" class="form-label">Estado</label>
            <select class="form-select" id="statusFilter" v-model="statusFilter">
              <option value="">Todos los estados</option>
              <option value="confirmed">Confirmadas</option>
              <option value="pending">Pendientes</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <!-- Filtro por fecha -->
          <div class="col-md-3">
            <label for="dateFilter" class="form-label">Fecha</label>
            <input
              type="date"
              class="form-control"
              id="dateFilter"
              v-model="dateFilter"
            >
          </div>

          <!-- Botón limpiar filtros -->
          <div class="col-md-2 d-flex align-items-end">
            <button class="btn btn-outline-secondary w-100" @click="clearFilters">
              <i class="bi bi-x-circle"></i>
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando citas...</span>
      </div>
      <p class="mt-2 text-muted">Cargando citas...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      Error al cargar las citas: {{ error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredAppointments.length === 0" class="text-center py-5">
      <div class="mb-3">
        <i class="bi bi-calendar-x text-muted" style="font-size: 4rem;"></i>
      </div>
      <h4 class="text-muted">{{ searchTerm || statusFilter || dateFilter ? 'No se encontraron citas' : 'No hay citas registradas' }}</h4>
      <p class="text-muted mb-4">
        {{ searchTerm || statusFilter || dateFilter 
          ? 'Intenta modificar los filtros de búsqueda' 
          : 'Comienza creando tu primera cita' 
        }}
      </p>
      <button v-if="!searchTerm && !statusFilter && !dateFilter" class="btn btn-primary" @click="showNewAppointmentModal">
        <i class="bi bi-plus-circle"></i>
        Crear Primera Cita
      </button>
    </div>

    <!-- Lista de citas -->
    <div v-else>
      <!-- Vista de tabla para pantallas grandes -->
      <div class="d-none d-lg-block">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th>Título</th>
                <th>Duración</th>
                <th>Estado</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="appointment in filteredAppointments" :key="appointment.id">
                <td>
                  <div class="fw-bold">{{ formatDate(appointment.date) }}</div>
                  <small class="text-muted">{{ appointment.time }}</small>
                </td>
                <td>
                  <div class="fw-bold">{{ appointment.clientName }}</div>
                </td>
                <td>
                  <div class="fw-bold">{{ appointment.title }}</div>
                  <small class="text-muted">{{ appointment.description }}</small>
                </td>
                <td>{{ appointment.duration }} min</td>
                <td>
                  <span class="badge" :class="getStatusClass(appointment.status)">
                    {{ getStatusText(appointment.status) }}
                  </span>
                </td>
                <td>
                  <div class="small">
                    <div><i class="bi bi-telephone"></i> {{ appointment.clientPhone }}</div>
                    <div v-if="appointment.clientEmail">
                      <i class="bi bi-envelope"></i> {{ appointment.clientEmail }}
                    </div>
                  </div>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button
                      class="btn btn-outline-primary"
                      @click="editAppointment(appointment)"
                      title="Editar"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      v-if="appointment.status === 'pending'"
                      class="btn btn-outline-success"
                      @click="confirmAppointment(appointment.id)"
                      title="Confirmar"
                    >
                      <i class="bi bi-check-circle"></i>
                    </button>
                    <button
                      class="btn btn-outline-danger"
                      @click="deleteAppointment(appointment)"
                      title="Eliminar"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Vista de cards para pantallas pequeñas -->
      <div class="d-lg-none">
        <div class="row">
          <div v-for="appointment in filteredAppointments" :key="appointment.id" class="col-12 mb-3">
            <div class="card appointment-card">
              <div class="card-body">
                <div class="row">
                  <div class="col-8">
                    <h6 class="card-title mb-1">{{ appointment.title }}</h6>
                    <p class="card-text text-muted small mb-2">{{ appointment.description }}</p>
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-person-fill text-primary me-2"></i>
                      <strong>{{ appointment.clientName }}</strong>
                    </div>
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-calendar3 text-primary me-2"></i>
                      <span>{{ formatDate(appointment.date) }} - {{ appointment.time }}</span>
                    </div>
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-clock text-primary me-2"></i>
                      <span>{{ appointment.duration }} minutos</span>
                    </div>
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-telephone text-primary me-2"></i>
                      <span>{{ appointment.clientPhone }}</span>
                    </div>
                    <div v-if="appointment.clientEmail" class="d-flex align-items-center">
                      <i class="bi bi-envelope text-primary me-2"></i>
                      <span class="small">{{ appointment.clientEmail }}</span>
                    </div>
                  </div>
                  <div class="col-4 text-end">
                    <span class="badge mb-3" :class="getStatusClass(appointment.status)">
                      {{ getStatusText(appointment.status) }}
                    </span>
                    <div class="d-grid gap-1">
                      <button
                        class="btn btn-sm btn-outline-primary"
                        @click="editAppointment(appointment)"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button
                        v-if="appointment.status === 'pending'"
                        class="btn btn-sm btn-outline-success"
                        @click="confirmAppointment(appointment.id)"
                      >
                        <i class="bi bi-check-circle"></i>
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="deleteAppointment(appointment)"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginación (si hay muchas citas) -->
      <nav v-if="filteredAppointments.length > 10" class="mt-4">
        <ul class="pagination justify-content-center">
          <li class="page-item">
            <a class="page-link" href="#" aria-label="Anterior">
              <span aria-hidden="true">&laquo;</span>
            </a>
          </li>
          <li class="page-item active"><a class="page-link" href="#">1</a></li>
          <li class="page-item"><a class="page-link" href="#">2</a></li>
          <li class="page-item"><a class="page-link" href="#">3</a></li>
          <li class="page-item">
            <a class="page-link" href="#" aria-label="Siguiente">
              <span aria-hidden="true">&raquo;</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Estadísticas resumen -->
    <div class="row mt-4">
      <div class="col-6 col-md-3">
        <div class="card text-center border-0 bg-light">
          <div class="card-body py-2">
            <h6 class="card-title text-muted mb-0">Total</h6>
            <h4 class="text-primary">{{ filteredAppointments.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center border-0 bg-light">
          <div class="card-body py-2">
            <h6 class="card-title text-muted mb-0">Confirmadas</h6>
            <h4 class="text-success">{{ confirmedCount }}</h4>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center border-0 bg-light">
          <div class="card-body py-2">
            <h6 class="card-title text-muted mb-0">Pendientes</h6>
            <h4 class="text-warning">{{ pendingCount }}</h4>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center border-0 bg-light">
          <div class="card-body py-2">
            <h6 class="card-title text-muted mb-0">Canceladas</h6>
            <h4 class="text-danger">{{ cancelledCount }}</h4>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de formulario -->
    <AppointmentModal
      :show="showModalForm"
      :appointment="selectedAppointment"
      @close="closeModal"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppointmentsStore } from '../stores/appointments'
import AppointmentModal from './AppointmentModal.vue'

// Store
const appointmentsStore = useAppointmentsStore()

// Acceder directamente a las propiedades reactivas del store
const appointments = computed(() => appointmentsStore.appointments)
const loading = computed(() => appointmentsStore.loading)
const error = computed(() => appointmentsStore.error)

// Asegurar que appointments sea siempre un array
const safeAppointments = computed(() => appointments.value || [])

// Estado reactivo
const searchTerm = ref('')
const statusFilter = ref('')
const dateFilter = ref('')
const showModalForm = ref(false)
const selectedAppointment = ref(null)

// Computed properties
const filteredAppointments = computed(() => {
  let filtered = safeAppointments.value

  // Filtrar por término de búsqueda
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(apt => 
      apt.title.toLowerCase().includes(term) ||
      apt.clientName.toLowerCase().includes(term) ||
      apt.description.toLowerCase().includes(term) ||
      apt.clientPhone.includes(term) ||
      (apt.clientEmail && apt.clientEmail.toLowerCase().includes(term))
    )
  }

  // Filtrar por estado
  if (statusFilter.value) {
    filtered = filtered.filter(apt => apt.status === statusFilter.value)
  }

  // Filtrar por fecha
  if (dateFilter.value) {
    filtered = filtered.filter(apt => apt.date === dateFilter.value)
  }

  return filtered
})

const confirmedCount = computed(() => 
  filteredAppointments.value.filter(apt => apt.status === 'confirmed').length
)

const pendingCount = computed(() => 
  filteredAppointments.value.filter(apt => apt.status === 'pending').length
)

const cancelledCount = computed(() => 
  filteredAppointments.value.filter(apt => apt.status === 'cancelled').length
)

// Métodos
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { 
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'confirmed':
      return 'bg-success'
    case 'pending':
      return 'bg-warning text-dark'
    case 'cancelled':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada'
    case 'pending':
      return 'Pendiente'
    case 'cancelled':
      return 'Cancelada'
    default:
      return 'Desconocido'
  }
}

const clearFilters = () => {
  searchTerm.value = ''
  statusFilter.value = ''
  dateFilter.value = ''
}

const showNewAppointmentModal = () => {
  selectedAppointment.value = null
  showModalForm.value = true
}

const editAppointment = (appointment) => {
  selectedAppointment.value = appointment
  showModalForm.value = true
}

const confirmAppointment = async (id) => {
  try {
    await appointmentsStore.confirmAppointment(id)
  } catch (err) {
    console.error('Error al confirmar cita:', err)
    alert('Error al confirmar la cita')
  }
}

const deleteAppointment = async (appointment) => {
  if (!confirm(`¿Estás seguro de eliminar la cita "${appointment.title}" con ${appointment.clientName}?`)) {
    return
  }

  try {
    await appointmentsStore.deleteAppointment(appointment.id)
  } catch (err) {
    console.error('Error al eliminar cita:', err)
    alert('Error al eliminar la cita')
  }
}

const closeModal = () => {
  showModalForm.value = false
  selectedAppointment.value = null
}

const handleFormSuccess = () => {
  showModalForm.value = false
  selectedAppointment.value = null
}

// Lifecycle
onMounted(() => {
  // Siempre inicializar el listener (es seguro llamarlo múltiples veces)
  appointmentsStore.initializeRealtimeListener()
})

onUnmounted(() => {
  // No hacer cleanup aquí ya que otros componentes pueden usar el store
})
</script>

<style scoped>
.appointment-list {
  max-width: 1200px;
  margin: 0 auto;
}

.appointment-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.table th {
  font-weight: 600;
  color: #495057;
  border-top: none;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

@media (max-width: 576px) {
  .appointment-card .card-body {
    padding: 1rem;
  }
  
  .btn-group-sm .btn {
    padding: 0.2rem 0.4rem;
    font-size: 0.8rem;
  }
}
</style>