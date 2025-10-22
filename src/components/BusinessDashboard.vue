<script setup>
import { ref, computed } from 'vue'
import { useBusinessStore } from '../stores/business'
import { useAppointmentsStore } from '../stores/appointments'
import { getAuth } from 'firebase/auth'
import AppointmentsManager from './business/AppointmentsManager.vue'
import ServicesManager from './business/ServicesManager.vue'
import StaffManager from './business/StaffManager.vue'
import BillingManager from './business/BillingManager.vue'
import ReportsManager from './business/ReportsManager.vue'
import SettingsManager from './business/SettingsManager.vue'
import ProductsManager from './business/ProductsManager.vue'

const businessStore = useBusinessStore()
const appointmentsStore = useAppointmentsStore()

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

const auth = getAuth()
const currentUser = computed(() => auth.currentUser)

// Estado de navegación
const currentModule = ref('dashboard')
const sidebarCollapsed = ref(false)

// Módulos del sistema
const modules = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'bi-speedometer2',
    color: '#0d6efd',
  },
  {
    id: 'appointments',
    name: 'Gestión de Citas',
    icon: 'bi-calendar-check',
    color: '#198754',
  },
  {
    id: 'clients',
    name: 'Gestión de Clientes',
    icon: 'bi-people',
    color: '#6610f2',
  },
  {
    id: 'services',
    name: 'Gestión de Servicios',
    icon: 'bi-box-seam',
    color: '#fd7e14',
  },
  {
    id: 'staff',
    name: 'Gestión de Personal',
    icon: 'bi-person-badge',
    color: '#0dcaf0',
  },
  {
    id: 'products',
    name: 'Gestión de Productos',
    icon: 'bi-box',
    color: '#ff6b6b',
  },
  {
    id: 'billing',
    name: 'Facturación y Pagos',
    icon: 'bi-cash-coin',
    color: '#20c997',
  },
  {
    id: 'reports',
    name: 'Reportes',
    icon: 'bi-bar-chart-line',
    color: '#d63384',
  },
  {
    id: 'settings',
    name: 'Configuración',
    icon: 'bi-gear',
    color: '#6c757d',
  },
]

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

const setModule = (moduleId) => {
  currentModule.value = moduleId
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="business-dashboard">
    <!-- Sidebar -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="business-info">
          <i
            :class="businessTypeConfig?.icon"
            class="business-icon"
            :style="{ color: businessTypeConfig?.color }"
          ></i>
          <div v-if="!sidebarCollapsed" class="business-details">
            <h6 class="mb-0">{{ business.name }}</h6>
            <small class="text-muted">{{ businessTypeConfig?.name }}</small>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="module in modules"
          :key="module.id"
          class="nav-item"
          :class="{ active: currentModule === module.id }"
          @click="setModule(module.id)"
          :title="module.name"
        >
          <i :class="module.icon" :style="{ color: module.color }"></i>
          <span v-if="!sidebarCollapsed">{{ module.name }}</span>
        </button>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content" :class="{ expanded: sidebarCollapsed }">
      <!-- Header -->
      <div class="content-header">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-light btn-sm" @click="toggleSidebar">
              <i class="bi bi-list"></i>
            </button>
            <h4 class="mb-0">
              <i :class="modules.find((m) => m.id === currentModule)?.icon" class="me-2"></i>
              {{ modules.find((m) => m.id === currentModule)?.name }}
            </h4>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted">
              <i class="bi bi-person-circle"></i>
              {{ currentUser?.email }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-body">
        <!-- Dashboard Module -->
        <div v-if="currentModule === 'dashboard'" class="dashboard-module">
          <div class="row g-4 mb-4">
            <div class="col-md-3">
              <div class="card stat-card">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="text-muted mb-1">Citas de Hoy</h6>
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
                      <h6 class="text-muted mb-1">Clientes Totales</h6>
                      <h3 class="mb-0">0</h3>
                    </div>
                    <div class="stat-icon bg-info">
                      <i class="bi bi-people"></i>
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
                      <h6 class="text-muted mb-1">Servicios Activos</h6>
                      <h3 class="mb-0">0</h3>
                    </div>
                    <div class="stat-icon bg-warning">
                      <i class="bi bi-box-seam"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-4">
            <div class="col-md-8">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="bi bi-calendar3"></i>
                    Citas Próximas
                  </h5>
                </div>
                <div class="card-body">
                  <p class="text-muted text-center py-4">
                    <i class="bi bi-calendar-x" style="font-size: 3rem"></i>
                    <br />
                    No hay citas programadas próximamente
                  </p>
                </div>
              </div>
            </div>

            <div class="col-md-4">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="bi bi-clock-history"></i>
                    Actividad Reciente
                  </h5>
                </div>
                <div class="card-body">
                  <p class="text-muted text-center py-4">Sin actividad reciente</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Módulo Citas -->
        <div v-else-if="currentModule === 'appointments'" class="appointments-module">
          <AppointmentsManager :business="business" />
        </div>

        <!-- Módulo Servicios -->
        <div v-else-if="currentModule === 'services'" class="services-module">
          <ServicesManager :business="business" />
        </div>

        <!-- Módulo Personal -->
        <div v-else-if="currentModule === 'staff'" class="staff-module">
          <StaffManager :business="business" />
        </div>

        <!-- Módulo Productos -->
        <div v-else-if="currentModule === 'products'" class="products-module">
          <ProductsManager :business="business" />
        </div>

        <!-- Módulo Facturación -->
        <div v-else-if="currentModule === 'billing'" class="billing-module">
          <BillingManager :business="business" />
        </div>

        <!-- Módulo Reportes -->
        <div v-else-if="currentModule === 'reports'" class="reports-module">
          <ReportsManager :business="business" />
        </div>

        <!-- Módulo Configuración -->
        <div v-else-if="currentModule === 'settings'" class="settings-module">
          <SettingsManager :business="business" />
        </div>

        <!-- Otros módulos -->
        <div v-else class="module-placeholder">
          <div class="text-center py-5">
            <i
              :class="modules.find((m) => m.id === currentModule)?.icon"
              style="font-size: 5rem"
              class="text-muted mb-3"
            ></i>
            <h3>{{ modules.find((m) => m.id === currentModule)?.name }}</h3>
            <p class="text-muted">Este módulo estará disponible próximamente</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.business-dashboard {
  display: flex;
  height: calc(100vh - 80px);
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.business-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.business-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.business-details h6 {
  color: white;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-item {
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  text-align: left;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: white;
  border-left: 3px solid #3b82f6;
}

.nav-item i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 1rem;
}

.sidebar.collapsed .nav-item span {
  display: none;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8f9fa;
}

.content-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.content-body {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Stats Cards */
.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  border-radius: 0.75rem;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
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

.module-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -260px;
    z-index: 1000;
    height: 100vh;
  }

  .sidebar.collapsed {
    left: 0;
  }

  .main-content {
    width: 100%;
  }
}
</style>
