<script setup>
import { ref, reactive } from 'vue'
import { useBusinessStore } from '../stores/business'

const businessStore = useBusinessStore()
const emit = defineEmits(['business-created', 'close'])

const formData = reactive({
  name: '',
  businessType: '',
  address: '',
  phone: '',
  email: '',
  description: '',
  openingHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '09:00', close: '14:00', closed: true },
  },
  services: [],
  employees: [],
})

const loading = ref(false)
const error = ref(null)

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null

    // Validaciones básicas
    if (!formData.name || !formData.businessType) {
      throw new Error('Por favor completa los campos requeridos')
    }

    // Agregar servicios predeterminados según el tipo de negocio
    const typeConfig = businessStore.getBusinessTypeConfig(formData.businessType)
    if (typeConfig && formData.services.length === 0) {
      formData.services = typeConfig.services.map((service, index) => ({
        id: `service-${index}`,
        name: service,
        duration: typeConfig.defaultDuration,
        price: 0,
      }))
    }

    const newBusiness = await businessStore.addBusiness(formData)
    emit('business-created', newBusiness)
    resetForm()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    businessType: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    services: [],
    employees: [],
  })
}

const getDaysInSpanish = () => ({
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
})
</script>

<template>
  <div class="business-form">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h4 class="mb-0">
          <i class="bi bi-plus-circle"></i>
          Registrar Nuevo Negocio
        </h4>
      </div>
      <div class="card-body">
        <!-- Error Alert -->
        <div v-if="error" class="alert alert-danger alert-dismissible fade show">
          <i class="bi bi-exclamation-triangle"></i>
          {{ error }}
          <button type="button" class="btn-close" @click="error = null"></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Información Básica -->
          <div class="row mb-4">
            <div class="col-md-6">
              <label class="form-label">Nombre del Negocio *</label>
              <input
                v-model="formData.name"
                type="text"
                class="form-control"
                placeholder="Ej: Barbería El Clásico"
                required
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">Tipo de Negocio *</label>
              <select v-model="formData.businessType" class="form-select" required>
                <option value="">Selecciona un tipo</option>
                <option
                  v-for="(config, key) in businessStore.businessTypes"
                  :key="key"
                  :value="key"
                >
                  <i :class="config.icon"></i> {{ config.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Información de Tipo de Negocio -->
          <div v-if="formData.businessType" class="alert alert-info mb-4">
            <div class="d-flex align-items-center">
              <i
                :class="businessStore.getBusinessTypeConfig(formData.businessType)?.icon"
                class="me-2"
                style="font-size: 2rem"
              ></i>
              <div>
                <strong>{{
                  businessStore.getBusinessTypeConfig(formData.businessType)?.name
                }}</strong>
                <p class="mb-0 small">
                  Servicios típicos:
                  {{
                    businessStore.getBusinessTypeConfig(formData.businessType)?.services.join(', ')
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Contacto -->
          <div class="row mb-4">
            <div class="col-md-6">
              <label class="form-label">Teléfono</label>
              <input
                v-model="formData.phone"
                type="tel"
                class="form-control"
                placeholder="555-1234"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input
                v-model="formData.email"
                type="email"
                class="form-control"
                placeholder="contacto@negocio.com"
              />
            </div>
          </div>

          <!-- Dirección -->
          <div class="mb-4">
            <label class="form-label">Dirección</label>
            <input
              v-model="formData.address"
              type="text"
              class="form-control"
              placeholder="Calle Principal #123"
            />
          </div>

          <!-- Descripción -->
          <div class="mb-4">
            <label class="form-label">Descripción</label>
            <textarea
              v-model="formData.description"
              class="form-control"
              rows="3"
              placeholder="Describe tu negocio..."
            ></textarea>
          </div>

          <!-- Horarios -->
          <div class="mb-4">
            <h5 class="mb-3">Horarios de Atención</h5>
            <div
              v-for="(day, dayKey) in formData.openingHours"
              :key="dayKey"
              class="row mb-2 align-items-center"
            >
              <div class="col-md-3">
                <label class="form-check-label">
                  {{ getDaysInSpanish()[dayKey] }}
                </label>
              </div>
              <div class="col-md-3">
                <input
                  v-model="day.open"
                  type="time"
                  class="form-control form-control-sm"
                  :disabled="day.closed"
                />
              </div>
              <div class="col-md-3">
                <input
                  v-model="day.close"
                  type="time"
                  class="form-control form-control-sm"
                  :disabled="day.closed"
                />
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input
                    v-model="day.closed"
                    type="checkbox"
                    class="form-check-input"
                    :id="`closed-${dayKey}`"
                  />
                  <label class="form-check-label" :for="`closed-${dayKey}`"> Cerrado </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-secondary"
              @click="emit('close')"
              :disabled="loading"
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-save me-2"></i>
              Guardar Negocio
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.business-form {
  max-width: 800px;
  margin: 0 auto;
}
</style>
