<script setup>
import { ref, onMounted } from 'vue'
import { db, auth } from '../../firebase/config'
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

// Estado
const activeTab = ref('business') // business | appointments | users | preferences
const loading = ref(false)
const saving = ref(false)
const message = ref({ type: '', text: '' })

// Datos del negocio (config actual)
const businessInfo = ref({
  name: '',
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
    sunday: { open: '00:00', close: '00:00', closed: true },
  },
})

// Configuración de citas
const appointmentsConfig = ref({
  defaultDuration: 60,
  bufferTime: 15,
  minAdvanceBooking: 2,
  maxAdvanceBooking: 30,
  cancellationHours: 24,
  allowCancellation: true,
  autoConfirm: false,
  allowOnlineBooking: true,
})

// Usuarios
const users = ref([])
const showUserModal = ref(false)
const newUser = ref({
  email: '',
  password: '',
  name: '',
  role: 'specialist',
})
const userErrors = ref({})

// Preferencias
const preferences = ref({
  language: 'es',
  timezone: 'America/Mexico_City',
  dateFormat: 'DD/MM/YYYY',
  currency: 'MXN',
})

// Lifecycle
onMounted(async () => {
  await loadBusinessData()
  await loadUsers()
})

const loadBusinessData = async () => {
  loading.value = true
  try {
    const businessDoc = await getDoc(doc(db, 'businesses', props.business.id))
    if (businessDoc.exists()) {
      const data = businessDoc.data()

      // Cargar información básica
      businessInfo.value.name = data.name || ''
      businessInfo.value.address = data.address || ''
      businessInfo.value.phone = data.phone || ''
      businessInfo.value.email = data.email || ''
      businessInfo.value.description = data.description || ''

      // Cargar horarios si existen
      if (data.config?.openingHours) {
        businessInfo.value.openingHours = {
          ...businessInfo.value.openingHours,
          ...data.config.openingHours,
        }
      }

      // Cargar config de citas si existe
      if (data.config?.appointments) {
        appointmentsConfig.value = { ...appointmentsConfig.value, ...data.config.appointments }
      }

      // Cargar preferencias si existen
      if (data.config?.preferences) {
        preferences.value = { ...preferences.value, ...data.config.preferences }
      }
    }
  } catch (error) {
    showMessage('error', 'Error al cargar configuración: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const usersRef = collection(db, `businesses/${props.business.id}/users`)
    const usersSnap = await getDocs(usersRef)
    users.value = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error cargando usuarios:', error)
  }
}

// Guardar información del negocio
const saveBusinessInfo = async () => {
  saving.value = true
  try {
    await updateDoc(doc(db, 'businesses', props.business.id), {
      name: businessInfo.value.name,
      address: businessInfo.value.address,
      phone: businessInfo.value.phone,
      email: businessInfo.value.email,
      description: businessInfo.value.description,
      'config.openingHours': businessInfo.value.openingHours,
      updatedAt: serverTimestamp(),
    })
    showMessage('success', 'Información guardada correctamente')
  } catch (error) {
    showMessage('error', 'Error al guardar: ' + error.message)
  } finally {
    saving.value = false
  }
}

// Guardar configuración de citas
const saveAppointmentsConfig = async () => {
  saving.value = true
  try {
    await updateDoc(doc(db, 'businesses', props.business.id), {
      'config.appointments': appointmentsConfig.value,
      updatedAt: serverTimestamp(),
    })
    showMessage('success', 'Configuración de citas guardada')
  } catch (error) {
    showMessage('error', 'Error al guardar: ' + error.message)
  } finally {
    saving.value = false
  }
}

// Guardar preferencias
const savePreferences = async () => {
  saving.value = true
  try {
    await updateDoc(doc(db, 'businesses', props.business.id), {
      'config.preferences': preferences.value,
      updatedAt: serverTimestamp(),
    })
    showMessage('success', 'Preferencias guardadas')
  } catch (error) {
    showMessage('error', 'Error al guardar: ' + error.message)
  } finally {
    saving.value = false
  }
}

// Gestión de usuarios
const openUserModal = () => {
  newUser.value = {
    email: '',
    password: '',
    name: '',
    role: 'specialist',
  }
  userErrors.value = {}
  showUserModal.value = true
}

const validateUser = () => {
  const errors = {}
  if (!newUser.value.email?.trim()) errors.email = 'Ingresa un email'
  if (!newUser.value.password || newUser.value.password.length < 6)
    errors.password = 'Mínimo 6 caracteres'
  if (!newUser.value.name?.trim()) errors.name = 'Ingresa un nombre'
  userErrors.value = errors
  return Object.keys(errors).length === 0
}

const addUser = async () => {
  if (!validateUser()) return

  loading.value = true
  try {
    // 1. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      newUser.value.email,
      newUser.value.password,
    )

    // 2. Guardar en Firestore (businesses/{id}/users)
    await addDoc(collection(db, `businesses/${props.business.id}/users`), {
      uid: userCredential.user.uid,
      email: newUser.value.email,
      name: newUser.value.name,
      role: newUser.value.role,
      createdAt: serverTimestamp(),
    })

    showMessage('success', 'Usuario creado correctamente')
    showUserModal.value = false
    await loadUsers()
  } catch (error) {
    let errorMsg = 'Error al crear usuario'
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'El email ya está en uso'
    } else if (error.code === 'auth/weak-password') {
      errorMsg = 'La contraseña es muy débil'
    }
    showMessage('error', errorMsg)
  } finally {
    loading.value = false
  }
}

const removeUser = async (userId) => {
  if (!confirm('¿Eliminar acceso de este usuario?')) return

  loading.value = true
  try {
    await deleteDoc(doc(db, `businesses/${props.business.id}/users/${userId}`))
    showMessage('success', 'Usuario eliminado')
    await loadUsers()
  } catch (error) {
    showMessage('error', 'Error al eliminar: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Utilidades
const showMessage = (type, text) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = { type: '', text: '' }
  }, 3000)
}

const getDayName = (day) => {
  const days = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  }
  return days[day] || day
}

const getRoleLabel = (role) => {
  const roles = {
    admin: 'Administrador',
    specialist: 'Especialista',
    receptionist: 'Recepcionista',
    employee: 'Empleado',
  }
  return roles[role] || role
}

const tabs = [
  { id: 'business', name: 'Negocio', icon: 'bi-shop' },
  { id: 'appointments', name: 'Citas', icon: 'bi-calendar-check' },
  { id: 'users', name: 'Usuarios', icon: 'bi-people' },
  { id: 'preferences', name: 'Preferencias', icon: 'bi-sliders' },
]
</script>

<template>
  <div class="settings-manager">
    <!-- Alerta de mensaje -->
    <div
      v-if="message.text"
      class="alert alert-dismissible fade show"
      :class="message.type === 'success' ? 'alert-success' : 'alert-danger'"
      role="alert"
    >
      <i :class="message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'"></i>
      {{ message.text }}
      <button type="button" class="btn-close" @click="message.text = ''"></button>
    </div>

    <!-- Navegación por tabs -->
    <ul class="nav nav-pills mb-4">
      <li v-for="tab in tabs" :key="tab.id" class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
        </button>
      </li>
    </ul>

    <!-- Loading general -->
    <div v-if="loading && !businessInfo.name" class="text-center py-5">
      <span class="spinner-border text-primary"></span>
      <p class="mt-2 text-muted">Cargando configuración...</p>
    </div>

    <!-- TAB: INFORMACIÓN DEL NEGOCIO -->
    <div v-else-if="activeTab === 'business'" class="business-section">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-shop"></i>
            Información del Negocio
          </h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Nombre del Negocio</label>
              <input v-model="businessInfo.name" type="text" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input v-model="businessInfo.email" type="email" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Teléfono</label>
              <input v-model="businessInfo.phone" type="tel" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Dirección</label>
              <input v-model="businessInfo.address" type="text" class="form-control" />
            </div>
            <div class="col-12">
              <label class="form-label">Descripción</label>
              <textarea v-model="businessInfo.description" rows="3" class="form-control"></textarea>
            </div>
          </div>

          <hr class="my-4" />

          <h6 class="mb-3">
            <i class="bi bi-clock"></i>
            Horarios de Atención
          </h6>

          <div class="row g-3">
            <div v-for="(day, key) in businessInfo.openingHours" :key="key" class="col-md-6">
              <div class="card">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong>{{ getDayName(key) }}</strong>
                    <div class="form-check form-switch">
                      <input
                        v-model="day.closed"
                        class="form-check-input"
                        type="checkbox"
                        :id="`closed-${key}`"
                      />
                      <label class="form-check-label" :for="`closed-${key}`"> Cerrado </label>
                    </div>
                  </div>
                  <div v-if="!day.closed" class="row g-2">
                    <div class="col-6">
                      <label class="form-label small">Apertura</label>
                      <input v-model="day.open" type="time" class="form-control form-control-sm" />
                    </div>
                    <div class="col-6">
                      <label class="form-label small">Cierre</label>
                      <input v-model="day.close" type="time" class="form-control form-control-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 text-end">
            <button class="btn btn-primary" @click="saveBusinessInfo" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-check-circle me-2"></i>
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: CONFIGURACIÓN DE CITAS -->
    <div v-else-if="activeTab === 'appointments'" class="appointments-section">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-calendar-check"></i>
            Configuración de Citas
          </h5>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-md-6">
              <label class="form-label">Duración Predeterminada (minutos)</label>
              <input
                v-model.number="appointmentsConfig.defaultDuration"
                type="number"
                min="15"
                step="5"
                class="form-control"
              />
              <small class="text-muted">Duración por defecto para nuevas citas</small>
            </div>

            <div class="col-md-6">
              <label class="form-label">Tiempo entre Citas (minutos)</label>
              <input
                v-model.number="appointmentsConfig.bufferTime"
                type="number"
                min="0"
                step="5"
                class="form-control"
              />
              <small class="text-muted">Buffer de tiempo entre una cita y otra</small>
            </div>

            <div class="col-md-6">
              <label class="form-label">Anticipación Mínima (horas)</label>
              <input
                v-model.number="appointmentsConfig.minAdvanceBooking"
                type="number"
                min="0"
                class="form-control"
              />
              <small class="text-muted">Horas mínimas de anticipación para agendar</small>
            </div>

            <div class="col-md-6">
              <label class="form-label">Anticipación Máxima (días)</label>
              <input
                v-model.number="appointmentsConfig.maxAdvanceBooking"
                type="number"
                min="1"
                class="form-control"
              />
              <small class="text-muted">Días máximos de anticipación para agendar</small>
            </div>

            <div class="col-12">
              <hr />
              <h6 class="mb-3">Política de Cancelación</h6>
            </div>

            <div class="col-md-6">
              <label class="form-label">Anticipación para Cancelar (horas)</label>
              <input
                v-model.number="appointmentsConfig.cancellationHours"
                type="number"
                min="0"
                class="form-control"
              />
              <small class="text-muted">Horas de anticipación requeridas</small>
            </div>

            <div class="col-md-6">
              <div class="form-check form-switch mt-4">
                <input
                  v-model="appointmentsConfig.allowCancellation"
                  class="form-check-input"
                  type="checkbox"
                  id="allowCancellation"
                />
                <label class="form-check-label" for="allowCancellation">
                  Permitir cancelación de citas
                </label>
              </div>
            </div>

            <div class="col-12">
              <hr />
              <h6 class="mb-3">Opciones de Sistema</h6>
            </div>

            <div class="col-md-6">
              <div class="form-check form-switch">
                <input
                  v-model="appointmentsConfig.autoConfirm"
                  class="form-check-input"
                  type="checkbox"
                  id="autoConfirm"
                />
                <label class="form-check-label" for="autoConfirm">
                  Confirmar citas automáticamente
                </label>
              </div>
              <small class="text-muted d-block mt-1">
                Si está desactivado, las citas quedarán pendientes de confirmación manual
              </small>
            </div>

            <div class="col-md-6">
              <div class="form-check form-switch">
                <input
                  v-model="appointmentsConfig.allowOnlineBooking"
                  class="form-check-input"
                  type="checkbox"
                  id="allowOnlineBooking"
                />
                <label class="form-check-label" for="allowOnlineBooking">
                  Permitir reservas en línea
                </label>
              </div>
              <small class="text-muted d-block mt-1">
                Habilitar sistema de reservas online para clientes
              </small>
            </div>
          </div>

          <div class="mt-4 text-end">
            <button class="btn btn-primary" @click="saveAppointmentsConfig" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-check-circle me-2"></i>
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: USUARIOS -->
    <div v-else-if="activeTab === 'users'" class="users-section">
      <div class="card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="bi bi-people"></i>
              Usuarios con Acceso
            </h5>
            <button class="btn btn-primary btn-sm" @click="openUserModal">
              <i class="bi bi-plus-circle"></i>
              Agregar Usuario
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div v-if="users.length === 0" class="p-4 text-center text-muted">
            No hay usuarios registrados
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Fecha de Registro</th>
                  <th style="width: 100px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td class="fw-semibold">{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge bg-primary">{{ getRoleLabel(user.role) }}</span>
                  </td>
                  <td class="small text-muted">
                    {{ user.createdAt?.toDate().toLocaleDateString('es-MX') || '—' }}
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" @click="removeUser(user.id)">
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

    <!-- TAB: PREFERENCIAS -->
    <div v-else-if="activeTab === 'preferences'" class="preferences-section">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-sliders"></i>
            Preferencias del Sistema
          </h5>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-md-6">
              <label class="form-label">Idioma</label>
              <select v-model="preferences.language" class="form-select">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Zona Horaria</label>
              <select v-model="preferences.timezone" class="form-select">
                <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
                <option value="America/Tijuana">Tijuana (UTC-7)</option>
                <option value="America/Monterrey">Monterrey (UTC-6)</option>
                <option value="America/Cancun">Cancún (UTC-5)</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Formato de Fecha</label>
              <select v-model="preferences.dateFormat" class="form-select">
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Moneda</label>
              <select v-model="preferences.currency" class="form-select">
                <option value="MXN">Peso Mexicano (MXN)</option>
                <option value="USD">Dólar Americano (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
          </div>

          <div class="mt-4 text-end">
            <button class="btn btn-primary" @click="savePreferences" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-check-circle me-2"></i>
              Guardar Preferencias
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Agregar Usuario -->
    <div
      v-if="showUserModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Agregar Usuario</h5>
            <button type="button" class="btn-close" @click="showUserModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nombre Completo</label>
              <input
                v-model="newUser.name"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': userErrors.name }"
              />
              <div class="invalid-feedback" v-if="userErrors.name">{{ userErrors.name }}</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Email</label>
              <input
                v-model="newUser.email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': userErrors.email }"
              />
              <div class="invalid-feedback" v-if="userErrors.email">{{ userErrors.email }}</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Contraseña</label>
              <input
                v-model="newUser.password"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': userErrors.password }"
              />
              <div class="invalid-feedback" v-if="userErrors.password">
                {{ userErrors.password }}
              </div>
              <small class="text-muted">Mínimo 6 caracteres</small>
            </div>

            <div class="mb-3">
              <label class="form-label">Rol</label>
              <select v-model="newUser.role" class="form-select">
                <option value="admin">Administrador</option>
                <option value="specialist">Especialista</option>
                <option value="receptionist">Recepcionista</option>
                <option value="employee">Empleado</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showUserModal = false">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" @click="addUser" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Crear Usuario
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-manager {
  height: 100%;
}

.nav-pills .nav-link {
  color: #6c757d;
  border-radius: 0.5rem;
  margin-right: 0.5rem;
}

.nav-pills .nav-link:hover {
  background-color: #e9ecef;
}

.nav-pills .nav-link.active {
  background-color: #0d6efd;
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

.alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.table td,
.table th {
  vertical-align: middle;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
</style>
