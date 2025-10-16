<script setup>
import { computed } from 'vue'
import { useBusinessStore } from '../stores/business'
import { useAppointmentsStore } from '../stores/appointments'

const businessStore = useBusinessStore()
const appointmentsStore = useAppointmentsStore()

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

const businessTypeConfig = computed(() =>
  businessStore.getBusinessTypeConfig(props.business.businessType),
)

// Filtrar citas del negocio actual
const businessAppointments = computed(() =>
  appointmentsStore.appointments.filter((apt) => apt.businessId === props.business.id),
)

const stats = computed(() => ({
  total: businessAppointments.value.length,
  today: businessAppointments.value.filter((apt) => {
    const today = new Date().toISOString().split('T')[0]
    return apt.date === today
  }).length,
  pending: businessAppointments.value.filter((apt) => apt.status === 'pending').length,
  confirmed: businessAppointments.value.filter((apt) => apt.status === 'confirmed').length,
}))
</script>

<template>
  <div class="business-dashboard">
    <!-- Header del Negocio -->
    <div class="business-header mb-4">
      <div
        class="card"
        :style="{ borderLeftColor: businessTypeConfig?.color, borderLeftWidth: '5px' }"
      >
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-8">
              <div class="d-flex align-items-center">
                <i
                  :class="businessTypeConfig?.icon"
                  class="business-icon me-3"
                  :style="{ color: businessTypeConfig?.color }"
                ></i>
                <div>
                  <h3 class="mb-1">{{ business.name }}</h3>
                  <p class="text-muted mb-0">
                    <i class="bi bi-tag me-1"></i>
                    {{ businessTypeConfig?.name }}
                  </p>
                  <p class="text-muted mb-0" v-if="business.address">
                    <i class="bi bi-geo-alt me-1"></i>
                    {{ business.address }}
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-4 text-md-end">
              <button class="btn btn-outline-primary btn-sm">
                <i class="bi bi-gear"></i>
                Configuración
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="card stat-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="text-muted mb-1">Total Citas</h6>
                <h3 class="mb-0">{{ stats.total }}</h3>
              </div>
              <div class="stat-icon bg-primary">
                <i class="bi bi-calendar-check"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card stat-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="text-muted mb-1">Hoy</h6>
                <h3 class="mb-0">{{ stats.today }}</h3>
              </div>
              <div class="stat-icon bg-success">
                <i class="bi bi-calendar-day"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card stat-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="text-muted mb-1">Pendientes</h6>
                <h3 class="mb-0">{{ stats.pending }}</h3>
              </div>
              <div class="stat-icon bg-warning">
                <i class="bi bi-clock-history"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card stat-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="text-muted mb-1">Confirmadas</h6>
                <h3 class="mb-0">{{ stats.confirmed }}</h3>
              </div>
              <div class="stat-icon bg-info">
                <i class="bi bi-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Funcionalidades específicas del tipo de negocio -->
    <div class="row g-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-list-check"></i>
              Servicios
            </h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li
                v-for="service in businessTypeConfig?.services"
                :key="service"
                class="list-group-item"
              >
                <i class="bi bi-check2 text-success me-2"></i>
                {{ service }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-stars"></i>
              Características
            </h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li
                v-for="feature in businessTypeConfig?.features"
                :key="feature"
                class="list-group-item"
              >
                <i class="bi bi-star text-warning me-2"></i>
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.business-icon {
  font-size: 3rem;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}
</style>
