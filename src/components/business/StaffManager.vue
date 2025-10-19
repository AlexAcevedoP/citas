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
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

const staff = ref([])
const loading = ref(false)
const error = ref(null)
const search = ref('')
const roleFilter = ref('all') // admin | specialist | receptionist | employee

const showModal = ref(false)
const editingId = ref(null)
const form = ref({
  name: '',
  email: '',
  phone: '',
  role: 'specialist',
  specialties: '', // csv simple por ahora
  active: true,
})
const errors = ref({})

let unsubscribe = null

const staffRef = computed(() => collection(db, `businesses/${props.business.id}/staff`))

onMounted(() => {
  loading.value = true
  const q = query(staffRef.value, orderBy('name', 'asc'))
  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      staff.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      loading.value = false
    },
    (err) => {
      error.value = err.message
      loading.value = false
    },
  )
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const filteredStaff = computed(() => {
  let list = staff.value
  if (search.value.trim()) {
    const term = search.value.toLowerCase()
    list = list.filter(
      (s) => s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term),
    )
  }
  if (roleFilter.value !== 'all') {
    list = list.filter((s) => (s.role || '').toLowerCase() === roleFilter.value)
  }
  return list
})

const validate = () => {
  const e = {}
  if (!form.value.name?.trim()) e.name = 'Ingresa el nombre'
  if (!form.value.role) e.role = 'Selecciona un rol'
  errors.value = e
  return Object.keys(e).length === 0
}

const openCreate = () => {
  editingId.value = null
  form.value = {
    name: '',
    email: '',
    phone: '',
    role: 'specialist',
    specialties: '',
    active: true,
  }
  errors.value = {}
  showModal.value = true
}

const openEdit = (person) => {
  editingId.value = person.id
  form.value = {
    name: person.name || '',
    email: person.email || '',
    phone: person.phone || '',
    role: person.role || 'specialist',
    specialties: Array.isArray(person.specialties)
      ? person.specialties.join(', ')
      : person.specialties || '',
    active: person.active ?? true,
  }
  errors.value = {}
  showModal.value = true
}

const save = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const payload = {
      ...form.value,
      specialties: form.value.specialties
        ? form.value.specialties
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      updatedAt: serverTimestamp(),
    }

    if (editingId.value) {
      await updateDoc(doc(db, `businesses/${props.business.id}/staff/${editingId.value}`), payload)
    } else {
      await addDoc(staffRef.value, {
        ...payload,
        createdAt: serverTimestamp(),
      })
    }
    showModal.value = false
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const removeMember = async (id) => {
  if (!confirm('¿Eliminar este miembro del personal?')) return
  loading.value = true
  try {
    await deleteDoc(doc(db, `businesses/${props.business.id}/staff/${id}`))
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="staff-manager">
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label small">Buscar</label>
            <input v-model="search" type="text" class="form-control" placeholder="Nombre o email" />
          </div>
          <div class="col-md-3">
            <label class="form-label small">Rol</label>
            <select v-model="roleFilter" class="form-select">
              <option value="all">Todos</option>
              <option value="admin">Administrador</option>
              <option value="specialist">Especialista</option>
              <option value="receptionist">Recepcionista</option>
              <option value="employee">Empleado</option>
            </select>
          </div>
          <div class="col-md-5 text-md-end">
            <button class="btn btn-primary" @click="openCreate">
              <i class="bi bi-plus-circle"></i>
              Nuevo Miembro
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body p-0">
        <div v-if="loading" class="p-4 text-center text-muted">
          <span class="spinner-border text-primary"></span>
        </div>
        <div v-else-if="filteredStaff.length === 0" class="p-4 text-center text-muted">
          No hay personal para mostrar
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Especialidades</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Activo</th>
                <th style="width: 120px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredStaff" :key="p.id">
                <td class="fw-semibold">{{ p.name }}</td>
                <td class="text-capitalize">{{ p.role }}</td>
                <td>
                  <span
                    v-if="Array.isArray(p.specialties) && p.specialties.length"
                    class="text-muted small"
                  >
                    {{ p.specialties.join(', ') }}
                  </span>
                  <span v-else class="text-muted small">—</span>
                </td>
                <td class="small">{{ p.email || '—' }}</td>
                <td class="small">{{ p.phone || '—' }}</td>
                <td>
                  <span :class="['badge', p.active ? 'bg-success' : 'bg-secondary']">
                    {{ p.active ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openEdit(p)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="removeMember(p.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Editar Miembro' : 'Nuevo Miembro' }}</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nombre</label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.name }"
              />
              <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Rol</label>
                <select
                  v-model="form.role"
                  class="form-select"
                  :class="{ 'is-invalid': errors.role }"
                >
                  <option value="admin">Administrador</option>
                  <option value="specialist">Especialista</option>
                  <option value="receptionist">Recepcionista</option>
                  <option value="employee">Empleado</option>
                </select>
                <div class="invalid-feedback" v-if="errors.role">{{ errors.role }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Especialidades</label>
                <input
                  v-model="form.specialties"
                  type="text"
                  class="form-control"
                  placeholder="Ej: Facial, Dermocosmética"
                />
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Teléfono</label>
                <input v-model="form.phone" type="tel" class="form-control" />
              </div>
            </div>
            <div class="form-check mt-3">
              <input id="active" v-model="form.active" class="form-check-input" type="checkbox" />
              <label class="form-check-label" for="active">Activo</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" @click="save" :disabled="loading">
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
.table td,
.table th {
  vertical-align: middle;
}
</style>
