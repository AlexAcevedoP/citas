<template>
  <div class="appointment-form">
    <!-- Modal Header -->
    <div class="modal-header">
      <h5 class="modal-title">
        <i class="bi bi-calendar-plus text-primary"></i>
        {{ isEditing ? 'Editar Cita' : 'Nueva Cita' }}
      </h5>
      <button 
        type="button" 
        class="btn-close" 
        @click="closeForm"
        :disabled="loading"
      ></button>
    </div>

    <!-- Modal Body -->
    <div class="modal-body">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Procesando...</span>
        </div>
        <p class="mt-2 text-muted">{{ loadingMessage }}</p>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle"></i>
        {{ error }}
      </div>

      <!-- Success Alert -->
      <div v-if="success" class="alert alert-success" role="alert">
        <i class="bi bi-check-circle"></i>
        {{ success }}
      </div>

      <!-- Form -->
      <form @submit.prevent="submitForm" v-if="!loading">
        <div class="row">
          <!-- Información de la Cita -->
          <div class="col-12">
            <h6 class="text-secondary mb-3">
              <i class="bi bi-info-circle"></i>
              Información de la Cita
            </h6>
          </div>

          <!-- Título -->
          <div class="col-md-6 mb-3">
            <label for="title" class="form-label">
              Título <span class="text-danger">*</span>
            </label>
            <input 
              type="text" 
              class="form-control"
              id="title"
              v-model="form.title"
              :class="{ 'is-invalid': errors.title }"
              placeholder="Ej: Consulta médica, Reunión..."
              required
            >
            <div v-if="errors.title" class="invalid-feedback">
              {{ errors.title }}
            </div>
          </div>

          <!-- Estado -->
          <div class="col-md-6 mb-3">
            <label for="status" class="form-label">Estado</label>
            <select 
              class="form-select"
              id="status"
              v-model="form.status"
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <!-- Descripción -->
          <div class="col-12 mb-3">
            <label for="description" class="form-label">Descripción</label>
            <textarea 
              class="form-control"
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="Describe los detalles de la cita..."
            ></textarea>
          </div>

          <!-- Fecha y Hora -->
          <div class="col-md-6 mb-3">
            <label for="date" class="form-label">
              Fecha <span class="text-danger">*</span>
            </label>
            <input 
              type="date" 
              class="form-control"
              id="date"
              v-model="form.date"
              :class="{ 'is-invalid': errors.date }"
              :min="minDate"
              required
            >
            <div v-if="errors.date" class="invalid-feedback">
              {{ errors.date }}
            </div>
          </div>

          <div class="col-md-6 mb-3">
            <label for="time" class="form-label">
              Hora <span class="text-danger">*</span>
            </label>
            <input 
              type="time" 
              class="form-control"
              id="time"
              v-model="form.time"
              :class="{ 'is-invalid': errors.time }"
              required
            >
            <div v-if="errors.time" class="invalid-feedback">
              {{ errors.time }}
            </div>
          </div>

          <!-- Duración -->
          <div class="col-md-6 mb-3">
            <label for="duration" class="form-label">
              Duración (minutos) <span class="text-danger">*</span>
            </label>
            <select 
              class="form-select"
              id="duration"
              v-model="form.duration"
              :class="{ 'is-invalid': errors.duration }"
              required
            >
              <option value="">Seleccionar duración</option>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1 hora 30 minutos</option>
              <option value="120">2 horas</option>
            </select>
            <div v-if="errors.duration" class="invalid-feedback">
              {{ errors.duration }}
            </div>
          </div>

          <!-- Información del Cliente -->
          <div class="col-12 mt-4">
            <h6 class="text-secondary mb-3">
              <i class="bi bi-person"></i>
              Información del Cliente
            </h6>
          </div>

          <!-- Nombre del Cliente -->
          <div class="col-md-6 mb-3">
            <label for="clientName" class="form-label">
              Nombre completo <span class="text-danger">*</span>
            </label>
            <input 
              type="text" 
              class="form-control"
              id="clientName"
              v-model="form.clientName"
              :class="{ 'is-invalid': errors.clientName }"
              placeholder="Nombre del cliente"
              required
            >
            <div v-if="errors.clientName" class="invalid-feedback">
              {{ errors.clientName }}
            </div>
          </div>

          <!-- Teléfono -->
          <div class="col-md-6 mb-3">
            <label for="clientPhone" class="form-label">
              Teléfono <span class="text-danger">*</span>
            </label>
            <input 
              type="tel" 
              class="form-control"
              id="clientPhone"
              v-model="form.clientPhone"
              :class="{ 'is-invalid': errors.clientPhone }"
              placeholder="Ej: +57 300 123 4567"
              required
            >
            <div v-if="errors.clientPhone" class="invalid-feedback">
              {{ errors.clientPhone }}
            </div>
          </div>

          <!-- Email -->
          <div class="col-12 mb-3">
            <label for="clientEmail" class="form-label">Email</label>
            <input 
              type="email" 
              class="form-control"
              id="clientEmail"
              v-model="form.clientEmail"
              :class="{ 'is-invalid': errors.clientEmail }"
              placeholder="cliente@email.com"
            >
            <div v-if="errors.clientEmail" class="invalid-feedback">
              {{ errors.clientEmail }}
            </div>
          </div>

          <!-- Conflict Warning -->
          <div v-if="conflictWarning" class="col-12">
            <div class="alert alert-warning" role="alert">
              <i class="bi bi-exclamation-triangle"></i>
              <strong>Conflicto de horario:</strong> {{ conflictWarning }}
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Modal Footer -->
    <div class="modal-footer">
      <button 
        type="button" 
        class="btn btn-secondary" 
        @click="closeForm"
        :disabled="loading"
      >
        <i class="bi bi-x-circle"></i>
        Cancelar
      </button>
      
      <button 
        v-if="isEditing"
        type="button" 
        class="btn btn-danger me-2" 
        @click="deleteAppointment"
        :disabled="loading"
      >
        <i class="bi bi-trash"></i>
        Eliminar
      </button>

      <button 
        type="submit" 
        class="btn btn-primary"
        @click="submitForm"
        :disabled="loading || !isFormValid"
      >
        <i class="bi" :class="isEditing ? 'bi-check-circle' : 'bi-plus-circle'"></i>
        {{ isEditing ? 'Actualizar' : 'Crear' }} Cita
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppointmentsStore } from '../stores/appointments'

// Props
const props = defineProps({
  appointment: {
    type: Object,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Store
const appointmentsStore = useAppointmentsStore()

// Estado reactivo
const loading = ref(false)
const error = ref('')
const success = ref('')
const loadingMessage = ref('')
const conflictWarning = ref('')

// Formulario
const form = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  duration: 60,
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  status: 'pending'
})

// Errores de validación
const errors = ref({})

// Métodos (declarados antes de los watchers)
const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    status: 'pending'
  }
  errors.value = {}
  error.value = ''
  success.value = ''
  conflictWarning.value = ''
}

const checkTimeConflict = async () => {
  if (!form.value.date || !form.value.time || !form.value.duration) {
    conflictWarning.value = ''
    return
  }

  try {
    const excludeId = isEditing.value ? props.appointment.id : null
    const hasConflict = appointmentsStore.hasTimeConflict(form.value, excludeId)
    
    if (hasConflict) {
      conflictWarning.value = 'Ya existe una cita programada en este horario'
    } else {
      conflictWarning.value = ''
    }
  } catch (err) {
    console.error('Error al verificar conflictos:', err)
  }
}

// Computed properties
const isEditing = computed(() => !!props.appointment)

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return form.value.title && 
         form.value.date && 
         form.value.time && 
         form.value.duration && 
         form.value.clientName && 
         form.value.clientPhone &&
         Object.keys(errors.value).length === 0
})

// Watchers
watch(() => props.appointment, (newAppointment) => {
  if (newAppointment) {
    // Cargar datos para edición
    Object.assign(form.value, newAppointment)
  } else {
    // Resetear formulario para nueva cita
    resetForm()
  }
}, { immediate: true })

// Validar conflictos cuando cambien fecha/hora/duración
watch([() => form.value.date, () => form.value.time, () => form.value.duration], () => {
  checkTimeConflict()
}, { deep: true })

// Resto de métodos
const validateForm = () => {
  errors.value = {}

  // Validar título
  if (!form.value.title.trim()) {
    errors.value.title = 'El título es requerido'
  }

  // Validar fecha
  if (!form.value.date) {
    errors.value.date = 'La fecha es requerida'
  } else if (new Date(form.value.date) < new Date(minDate.value)) {
    errors.value.date = 'La fecha no puede ser anterior a hoy'
  }

  // Validar hora
  if (!form.value.time) {
    errors.value.time = 'La hora es requerida'
  }

  // Validar duración
  if (!form.value.duration) {
    errors.value.duration = 'La duración es requerida'
  }

  // Validar nombre del cliente
  if (!form.value.clientName.trim()) {
    errors.value.clientName = 'El nombre del cliente es requerido'
  }

  // Validar teléfono
  if (!form.value.clientPhone.trim()) {
    errors.value.clientPhone = 'El teléfono es requerido'
  }

  // Validar email (si se proporciona)
  if (form.value.clientEmail && !isValidEmail(form.value.clientEmail)) {
    errors.value.clientEmail = 'El email no tiene un formato válido'
  }

  return Object.keys(errors.value).length === 0
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const submitForm = async () => {
  // Limpiar mensajes anteriores
  error.value = ''
  success.value = ''

  // Validar formulario
  if (!validateForm()) {
    return
  }

  // Verificar conflictos de nuevo antes de enviar
  if (conflictWarning.value) {
    error.value = 'No se puede programar la cita debido a un conflicto de horario'
    return
  }

  try {
    loading.value = true
    loadingMessage.value = isEditing.value ? 'Actualizando cita...' : 'Creando cita...'

    if (isEditing.value) {
      await appointmentsStore.updateAppointment(props.appointment.id, form.value)
      success.value = 'Cita actualizada exitosamente'
    } else {
      await appointmentsStore.addAppointment(form.value)
      success.value = 'Cita creada exitosamente'
    }

    // Esperar un momento para mostrar el mensaje de éxito
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    emit('success')
    closeForm()
  } catch (err) {
    error.value = err.message || 'Error al procesar la cita'
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

const deleteAppointment = async () => {
  if (!confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
    return
  }

  try {
    loading.value = true
    loadingMessage.value = 'Eliminando cita...'

    await appointmentsStore.deleteAppointment(props.appointment.id)
    success.value = 'Cita eliminada exitosamente'

    // Esperar un momento para mostrar el mensaje
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    emit('success')
    closeForm()
  } catch (err) {
    error.value = err.message || 'Error al eliminar la cita'
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

const closeForm = () => {
  resetForm()
  emit('close')
}
</script>

<style scoped>
.appointment-form {
  max-width: 600px;
}

.form-label {
  font-weight: 600;
  color: #495057;
}

.text-danger {
  color: #dc3545 !important;
}

.alert {
  border: none;
  border-radius: 0.5rem;
}

.btn {
  border-radius: 0.375rem;
  font-weight: 500;
}

.modal-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
}

.modal-title {
  font-weight: 600;
  color: #495057;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
}

@media (max-width: 576px) {
  .modal-body {
    padding: 1rem;
  }
  
  .modal-header,
  .modal-footer {
    padding: 1rem;
  }
}
</style>