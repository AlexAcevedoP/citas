<script setup>
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue'
import { useAppointmentsStore } from '../../stores/appointments'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

// Datos de apoyo (deben estar declarados antes de usarse en computed/watch)
const clients = ref([])
const services = ref([])
const specialists = ref([])

// Estado del calendario
const currentDate = ref(new Date())
const viewMode = ref('month') // month, week, day
const showAppointmentModal = ref(false)
const selectedAppointment = ref(null)
const selectedDate = ref(null)
const selectedTime = ref(null)

// Formulario de cita
const form = ref({
  clientMode: 'existing', // existing | new
  clientId: '',
  client: { name: '', phone: '', email: '' },
  serviceId: '',
  specialistId: '',
  date: '',
  time: '',
  duration: 60,
  price: 0,
  status: 'pending',
  notes: '',
})

const errors = ref({})

const resetForm = () => {
  form.value = {
    clientMode: 'existing',
    clientId: '',
    client: { name: '', phone: '', email: '' },
    serviceId: '',
    specialistId: '',
    date: selectedDate.value || new Date().toISOString().split('T')[0],
    time: selectedTime.value || '10:00',
    duration: 60,
    price: 0,
    status: 'pending',
    notes: '',
  }
  errors.value = {}
}

const hydrateFormFromAppointment = (apt) => {
  form.value = {
    clientMode: 'existing',
    clientId: '',
    client: { ...apt.client },
    serviceId: services.value.find((s) => s.name === apt.service.name)?.id || '',
    specialistId: specialists.value.find((s) => s.name === apt.specialist.name)?.id || '',
    date: apt.date,
    time: apt.time,
    duration: apt.duration,
    price: apt.service.price,
    status: apt.status,
    notes: apt.notes || '',
  }
}

// Auto-completar duración/precio cuando cambia el servicio
const selectedService = computed(() => services.value.find((s) => s.id === form.value.serviceId))
watchEffect(() => {
  if (selectedService.value) {
    form.value.duration = selectedService.value.duration
    form.value.price = selectedService.value.price
  }
})

// Filtros
const filters = ref({
  status: 'all', // all, pending, confirmed, completed, cancelled
  specialist: 'all',
  service: 'all',
})

// Store de citas (Firestore)
const apptsStore = useAppointmentsStore()

// Cargar datos de Firestore
onMounted(async () => {
  // Iniciar listener de citas
  apptsStore.initializeRealtimeListener()

  // Cargar clientes del negocio
  try {
    const customersQ = query(
      collection(db, 'customers'),
      where('businessId', '==', props.business.id),
    )
    const customersSnap = await getDocs(customersQ)
    clients.value = customersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.warn('No se pudieron cargar clientes:', e)
  }

  // Cargar servicios desde subcolección del negocio
  try {
    const servicesRef = collection(db, `businesses/${props.business.id}/services`)
    const servicesSnap = await getDocs(servicesRef)
    services.value = servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.warn('No se pudieron cargar servicios:', e)
    services.value = []
  }

  // Cargar personal/especialistas desde subcolección del negocio
  try {
    const staffRef = collection(db, `businesses/${props.business.id}/staff`)
    const staffSnap = await getDocs(staffRef)
    specialists.value = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    // Fallback: si no existe 'staff', intentar cargar desde 'users' con roles
    if (specialists.value.length === 0) {
      const usersRef = collection(db, `businesses/${props.business.id}/users`)
      const usersSnap = await getDocs(usersRef)
      specialists.value = usersSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => ['specialist', 'employee', 'admin'].includes(u.role || ''))
    }
  } catch (e) {
    console.warn('No se pudieron cargar especialistas:', e)
    specialists.value = []
  }
})

onUnmounted(() => {
  apptsStore.stopRealtimeListener()
})

// Computed
const filteredAppointments = computed(() => {
  const base = apptsStore.appointments.filter((apt) => apt.businessId === props.business.id)
  return base.filter((apt) => {
    if (filters.value.status !== 'all' && apt.status !== filters.value.status) {
      return false
    }
    if (filters.value.specialist !== 'all' && apt.specialist.name !== filters.value.specialist) {
      return false
    }
    if (filters.value.service !== 'all' && apt.service.name !== filters.value.service) {
      return false
    }
    return true
  })
})

const todayAppointments = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return filteredAppointments.value.filter((apt) => apt.date === today)
})

// Funciones de navegación del calendario
const previousPeriod = () => {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    newDate.setMonth(newDate.getMonth() - 1)
  } else if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() - 7)
  } else {
    newDate.setDate(newDate.getDate() - 1)
  }
  currentDate.value = newDate
}

const nextPeriod = () => {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    newDate.setMonth(newDate.getMonth() + 1)
  } else if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
  } else {
    newDate.setDate(newDate.getDate() + 1)
  }
  currentDate.value = newDate
}

const goToToday = () => {
  currentDate.value = new Date()
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatTime = (time) => {
  return time
}

const getStatusBadgeClass = (status) => {
  const classes = {
    pending: 'bg-warning',
    confirmed: 'bg-info',
    completed: 'bg-success',
    cancelled: 'bg-danger',
  }
  return classes[status] || 'bg-secondary'
}

const getStatusText = (status) => {
  const texts = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }
  return texts[status] || status
}

// Funciones CRUD
const openCreateModal = (date = null, time = null) => {
  selectedAppointment.value = null
  selectedDate.value = date
  selectedTime.value = time
  resetForm()
  if (date)
    form.value.date = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0]
  if (time) form.value.time = time
  showAppointmentModal.value = true
}

const openEditModal = (appointment) => {
  selectedAppointment.value = appointment
  hydrateFormFromAppointment(appointment)
  showAppointmentModal.value = true
}

const closeModal = () => {
  showAppointmentModal.value = false
  selectedAppointment.value = null
  selectedDate.value = null
  selectedTime.value = null
}

const deleteAppointment = async (id) => {
  if (confirm('¿Estás seguro de eliminar esta cita?')) {
    await apptsStore.deleteAppointment(id)
  }
}

const validateForm = () => {
  const e = {}
  if (form.value.clientMode === 'existing') {
    if (!form.value.clientId) e.clientId = 'Selecciona un cliente'
  } else {
    if (!form.value.client.name?.trim()) e.clientName = 'Ingresa el nombre del cliente'
  }
  if (!form.value.serviceId) e.serviceId = 'Selecciona un servicio'
  if (!form.value.specialistId) e.specialistId = 'Selecciona un especialista'
  if (!form.value.date) e.date = 'Selecciona una fecha'
  if (!form.value.time) e.time = 'Selecciona una hora'
  errors.value = e
  return Object.keys(e).length === 0
}

const saveAppointment = async () => {
  if (!validateForm()) return

  // Resolver entidades seleccionadas
  const service = services.value.find((s) => s.id === form.value.serviceId)
  const specialist = specialists.value.find((s) => s.id === form.value.specialistId)

  let clientData
  if (form.value.clientMode === 'existing') {
    clientData = clients.value.find((c) => c.id === form.value.clientId)
  } else {
    // Crear cliente en Firestore (colección customers)
    const newCustomer = {
      businessId: props.business.id,
      name: form.value.client.name,
      phone: form.value.client.phone || '',
      email: form.value.client.email || '',
      status: 'active',
      createdAt: serverTimestamp(),
    }
    const docRef = await addDoc(collection(db, 'customers'), newCustomer)
    clientData = { id: docRef.id, ...newCustomer, createdAt: new Date() }
    clients.value.push({
      id: docRef.id,
      name: clientData.name,
      phone: clientData.phone,
      email: clientData.email,
    })
  }

  const payload = {
    businessId: props.business.id,
    date: form.value.date,
    time: form.value.time,
    duration: form.value.duration,
    client: { name: clientData.name, phone: clientData.phone, email: clientData.email },
    service: { id: service?.id || '', name: service?.name || '', price: form.value.price },
    specialist: { id: specialist?.id || '', name: specialist?.name || '' },
    status: form.value.status,
    notes: form.value.notes,
  }

  if (selectedAppointment.value?.id) {
    await apptsStore.updateAppointment(selectedAppointment.value.id, payload)
  } else {
    await apptsStore.addAppointment(payload)
  }

  closeModal()
}
</script>

<template>
  <div class="appointments-manager">
    <!-- Header con filtros y acciones -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h5 class="mb-0">
              <i class="bi bi-calendar-check text-primary"></i>
              Gestión de Citas
            </h5>
          </div>
          <div class="col-md-6 text-md-end">
            <button class="btn btn-primary" @click="openCreateModal()">
              <i class="bi bi-plus-circle"></i>
              Nueva Cita
            </button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="row mt-3">
          <div class="col-md-3">
            <label class="form-label small">Estado</label>
            <select v-model="filters.status" class="form-select form-select-sm">
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small">Especialista</label>
            <select v-model="filters.specialist" class="form-select form-select-sm">
              <option value="all">Todos los especialistas</option>
              <option v-for="spec in specialists" :key="spec.id" :value="spec.name">
                {{ spec.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small">Servicio</label>
            <select v-model="filters.service" class="form-select form-select-sm">
              <option value="all">Todos los servicios</option>
              <option v-for="serv in services" :key="serv.id" :value="serv.name">
                {{ serv.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small">Vista</label>
            <div class="btn-group btn-group-sm w-100" role="group">
              <button
                type="button"
                class="btn"
                :class="viewMode === 'day' ? 'btn-primary' : 'btn-outline-primary'"
                @click="viewMode = 'day'"
              >
                Día
              </button>
              <button
                type="button"
                class="btn"
                :class="viewMode === 'week' ? 'btn-primary' : 'btn-outline-primary'"
                @click="viewMode = 'week'"
              >
                Semana
              </button>
              <button
                type="button"
                class="btn"
                :class="viewMode === 'month' ? 'btn-primary' : 'btn-outline-primary'"
                @click="viewMode = 'month'"
              >
                Mes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Calendario -->
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center">
              <button class="btn btn-sm btn-outline-secondary" @click="previousPeriod">
                <i class="bi bi-chevron-left"></i>
              </button>
              <div class="text-center">
                <h6 class="mb-0">{{ formatDate(currentDate) }}</h6>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" @click="goToToday">Hoy</button>
                <button class="btn btn-sm btn-outline-secondary" @click="nextPeriod">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <!-- Vista de lista simplificada por ahora -->
            <div class="appointments-list">
              <div
                v-for="apt in filteredAppointments"
                :key="apt.id"
                class="appointment-item"
                @click="openEditModal(apt)"
              >
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <span class="badge" :class="getStatusBadgeClass(apt.status)">
                        {{ getStatusText(apt.status) }}
                      </span>
                      <strong>{{ formatTime(apt.time) }}</strong>
                      <span class="text-muted small">({{ apt.duration }} min)</span>
                    </div>
                    <div class="mb-1">
                      <i class="bi bi-person"></i>
                      {{ apt.client.name }}
                    </div>
                    <div class="text-muted small">
                      <i class="bi bi-scissors"></i>
                      {{ apt.service.name }} - ${{ apt.service.price }}
                    </div>
                    <div class="text-muted small">
                      <i class="bi bi-person-badge"></i>
                      {{ apt.specialist.name }}
                    </div>
                  </div>
                  <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-primary" @click.stop="openEditModal(apt)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click.stop="deleteAppointment(apt.id)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="filteredAppointments.length === 0" class="text-center py-5 text-muted">
                <i class="bi bi-calendar-x" style="font-size: 3rem"></i>
                <p class="mt-2">No hay citas para mostrar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Citas de hoy -->
      <div class="col-md-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h6 class="mb-0">
              <i class="bi bi-calendar-day"></i>
              Citas de Hoy
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <div
                v-for="apt in todayAppointments"
                :key="apt.id"
                class="list-group-item list-group-item-action"
                @click="openEditModal(apt)"
              >
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="mb-1">{{ formatTime(apt.time) }}</h6>
                    <p class="mb-1 small">{{ apt.client.name }}</p>
                    <small class="text-muted">{{ apt.service.name }}</small>
                  </div>
                  <span class="badge" :class="getStatusBadgeClass(apt.status)">
                    {{ getStatusText(apt.status) }}
                  </span>
                </div>
              </div>
              <div v-if="todayAppointments.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-check-circle" style="font-size: 2rem"></i>
                <p class="mt-2 small">No hay citas para hoy</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen rápido -->
        <div class="card mt-3">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-bar-chart"></i>
              Resumen
            </h6>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Total:</span>
              <strong>{{ filteredAppointments.length }}</strong>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Pendientes:</span>
              <span class="badge bg-warning">
                {{ filteredAppointments.filter((a) => a.status === 'pending').length }}
              </span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Confirmadas:</span>
              <span class="badge bg-info">
                {{ filteredAppointments.filter((a) => a.status === 'confirmed').length }}
              </span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Completadas:</span>
              <span class="badge bg-success">
                {{ filteredAppointments.filter((a) => a.status === 'completed').length }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de cita (placeholder) -->
    <div
      v-if="showAppointmentModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ selectedAppointment ? 'Editar Cita' : 'Nueva Cita' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <!-- Cliente -->
                <div class="col-12">
                  <label class="form-label">Cliente</label>
                  <div class="d-flex gap-2 mb-2">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        id="clientExisting"
                        value="existing"
                        v-model="form.clientMode"
                      />
                      <label class="form-check-label" for="clientExisting">Existente</label>
                    </div>
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        id="clientNew"
                        value="new"
                        v-model="form.clientMode"
                      />
                      <label class="form-check-label" for="clientNew">Nuevo</label>
                    </div>
                  </div>
                  <div v-if="form.clientMode === 'existing'">
                    <select
                      v-model="form.clientId"
                      class="form-select"
                      :class="{ 'is-invalid': errors.clientId }"
                    >
                      <option value="">Selecciona un cliente</option>
                      <option v-for="c in clients" :key="c.id" :value="c.id">
                        {{ c.name }} - {{ c.phone }}
                      </option>
                    </select>
                    <div class="invalid-feedback" v-if="errors.clientId">{{ errors.clientId }}</div>
                  </div>
                  <div v-else class="row g-2">
                    <div class="col-md-4">
                      <input
                        v-model="form.client.name"
                        type="text"
                        class="form-control"
                        placeholder="Nombre completo"
                        :class="{ 'is-invalid': errors.clientName }"
                      />
                      <div class="invalid-feedback" v-if="errors.clientName">
                        {{ errors.clientName }}
                      </div>
                    </div>
                    <div class="col-md-4">
                      <input
                        v-model="form.client.phone"
                        type="tel"
                        class="form-control"
                        placeholder="Teléfono"
                      />
                    </div>
                    <div class="col-md-4">
                      <input
                        v-model="form.client.email"
                        type="email"
                        class="form-control"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                </div>

                <!-- Servicio y Especialista -->
                <div class="col-md-6">
                  <label class="form-label">Servicio</label>
                  <select
                    v-model="form.serviceId"
                    class="form-select"
                    :class="{ 'is-invalid': errors.serviceId }"
                  >
                    <option value="">Selecciona un servicio</option>
                    <option v-for="s in services" :key="s.id" :value="s.id">
                      {{ s.name }} ({{ s.duration }} min)
                    </option>
                  </select>
                  <div class="invalid-feedback" v-if="errors.serviceId">{{ errors.serviceId }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Especialista</label>
                  <select
                    v-model="form.specialistId"
                    class="form-select"
                    :class="{ 'is-invalid': errors.specialistId }"
                  >
                    <option value="">Selecciona un especialista</option>
                    <option v-for="sp in specialists" :key="sp.id" :value="sp.id">
                      {{ sp.name }}
                    </option>
                  </select>
                  <div class="invalid-feedback" v-if="errors.specialistId">
                    {{ errors.specialistId }}
                  </div>
                </div>

                <!-- Fecha y hora -->
                <div class="col-md-4">
                  <label class="form-label">Fecha</label>
                  <input
                    v-model="form.date"
                    type="date"
                    class="form-control"
                    :class="{ 'is-invalid': errors.date }"
                  />
                  <div class="invalid-feedback" v-if="errors.date">{{ errors.date }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Hora</label>
                  <input
                    v-model="form.time"
                    type="time"
                    class="form-control"
                    :class="{ 'is-invalid': errors.time }"
                  />
                  <div class="invalid-feedback" v-if="errors.time">{{ errors.time }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Duración (min)</label>
                  <input
                    v-model.number="form.duration"
                    type="number"
                    min="15"
                    step="5"
                    class="form-control"
                  />
                </div>

                <!-- Precio y estado -->
                <div class="col-md-6">
                  <label class="form-label">Precio</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input
                      v-model.number="form.price"
                      type="number"
                      min="0"
                      step="50"
                      class="form-control"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Estado</label>
                  <select v-model="form.status" class="form-select">
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                <!-- Notas -->
                <div class="col-12">
                  <label class="form-label">Notas</label>
                  <textarea
                    v-model="form.notes"
                    rows="3"
                    class="form-control"
                    placeholder="Observaciones, indicaciones, etc."
                  ></textarea>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="saveAppointment">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appointments-manager {
  height: 100%;
}

.appointments-list {
  max-height: 600px;
  overflow-y: auto;
}

.appointment-item {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s;
}

.appointment-item:hover {
  background-color: #f8f9fa;
}

.appointment-item:last-child {
  border-bottom: none;
}

.modal {
  display: block;
}
</style>
