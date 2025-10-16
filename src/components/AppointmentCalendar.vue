<template>
  <div class="appointment-calendar">
    <!-- Header con título y controles -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="text-primary">
        <i class="bi bi-calendar3"></i>
        Calendario de Citas
      </h2>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" @click="previousMonth">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="btn btn-light fw-bold">
          {{ currentMonthName }} {{ currentYear }}
        </span>
        <button class="btn btn-outline-primary" @click="nextMonth">
          <i class="bi bi-chevron-right"></i>
        </button>
        <button class="btn btn-success ms-2" @click="showNewAppointmentModal">
          <i class="bi bi-plus-circle"></i>
          Nueva Cita
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2 text-muted">Cargando citas...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      Error al cargar las citas: {{ error }}
    </div>

    <!-- Calendar Grid -->
    <div v-else class="calendar-grid">
      <!-- Días de la semana -->
      <div class="row g-0 border-bottom">
        <div 
          v-for="day in weekDays" 
          :key="day"
          class="col text-center py-2 fw-bold bg-light border-end"
        >
          {{ day }}
        </div>
      </div>

      <!-- Días del calendario -->
      <div 
        v-for="(week, weekIndex) in calendarWeeks" 
        :key="weekIndex"
        class="row g-0 border-bottom"
        style="min-height: 120px;"
      >
        <div
          v-for="(day, dayIndex) in week"
          :key="dayIndex"
          class="col border-end position-relative"
          :class="{
            'bg-light': !day.isCurrentMonth,
            'bg-primary text-white': day.isToday
          }"
        >
          <!-- Número del día -->
          <div class="p-2">
            <span 
              class="badge"
              :class="day.isToday ? 'bg-white text-primary' : 'bg-transparent text-dark'"
            >
              {{ day.date }}
            </span>
          </div>

          <!-- Citas del día -->
          <div class="px-2 pb-2">
            <div
              v-for="appointment in getAppointmentsForDay(day.fullDate)"
              :key="appointment.id"
              class="appointment-card mb-1 p-1 rounded cursor-pointer"
              :class="getAppointmentClass(appointment.status)"
              @click="showAppointmentDetails(appointment)"
            >
              <small class="d-block text-truncate fw-bold">
                {{ appointment.time }} - {{ appointment.title }}
              </small>
              <small class="d-block text-truncate">
                {{ appointment.clientName }}
              </small>
            </div>
          </div>

          <!-- Indicador de más citas -->
          <div 
            v-if="getAppointmentsForDay(day.fullDate).length > 2"
            class="position-absolute bottom-0 end-0 p-1"
          >
            <span class="badge bg-secondary">
              +{{ getAppointmentsForDay(day.fullDate).length - 2 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="row mt-4">
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <i class="bi bi-calendar-check text-success fs-1"></i>
            <h5 class="card-title">{{ stats.confirmed }}</h5>
            <p class="card-text text-muted">Confirmadas</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <i class="bi bi-clock text-warning fs-1"></i>
            <h5 class="card-title">{{ stats.pending }}</h5>
            <p class="card-text text-muted">Pendientes</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <i class="bi bi-calendar-x text-danger fs-1"></i>
            <h5 class="card-title">{{ stats.cancelled }}</h5>
            <p class="card-text text-muted">Canceladas</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <i class="bi bi-calendar-event text-primary fs-1"></i>
            <h5 class="card-title">{{ stats.today }}</h5>
            <p class="card-text text-muted">Hoy</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Formulario -->
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
const { appointments, loading, error, stats } = appointmentsStore

// Estado reactivo
const currentDate = ref(new Date())
const selectedDate = ref(null)

// Computed properties
const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonthName = computed(() => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[currentMonth.value]
})

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Generar las semanas del calendario
const calendarWeeks = computed(() => {
  const weeks = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const today = new Date()
  
  // Encontrar el primer domingo a mostrar
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  
  // Generar 6 semanas
  for (let week = 0; week < 6; week++) {
    const weekDays = []
    
    for (let day = 0; day < 7; day++) {
      const currentDay = new Date(startDate)
      currentDay.setDate(startDate.getDate() + (week * 7) + day)
      
      weekDays.push({
        date: currentDay.getDate(),
        fullDate: currentDay.toISOString().split('T')[0],
        isCurrentMonth: currentDay.getMonth() === currentMonth.value,
        isToday: currentDay.toDateString() === today.toDateString()
      })
    }
    
    weeks.push(weekDays)
  }
  
  return weeks
})

// Métodos
const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const getAppointmentsForDay = (date) => {
  return appointments.filter(apt => apt.date === date).slice(0, 2) // Mostrar máximo 2
}

const getAppointmentClass = (status) => {
  switch (status) {
    case 'confirmed':
      return 'bg-success text-white'
    case 'pending':
      return 'bg-warning text-dark'
    case 'cancelled':
      return 'bg-danger text-white'
    default:
      return 'bg-secondary text-white'
  }
}

const showModalForm = ref(false)
const selectedAppointment = ref(null)

const showAppointmentDetails = (appointment) => {
  selectedAppointment.value = appointment
  showModalForm.value = true
}

const showNewAppointmentModal = () => {
  selectedAppointment.value = null
  showModalForm.value = true
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
  // Inicializar el listener de Firebase
  appointmentsStore.initializeRealtimeListener()
})

onUnmounted(() => {
  // Limpiar el listener de Firebase
  appointmentsStore.stopRealtimeListener()
})
</script>

<style scoped>
.appointment-calendar {
  max-width: 1200px;
  margin: 0 auto;
}

.calendar-grid {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  overflow: hidden;
}

.appointment-card {
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.appointment-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.cursor-pointer {
  cursor: pointer;
}

@media (max-width: 768px) {
  .appointment-card {
    font-size: 0.65rem;
  }
  
  .calendar-grid .col {
    min-height: 80px !important;
  }
}
</style>