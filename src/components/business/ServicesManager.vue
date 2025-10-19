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
  serverTimestamp,
  orderBy,
} from 'firebase/firestore'

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

const services = ref([])
const loading = ref(false)
const error = ref(null)
const search = ref('')
const categoryFilter = ref('all')

const showModal = ref(false)
const editingId = ref(null)
const form = ref({
  name: '',
  description: '',
  duration: 60,
  price: 0,
  category: '', // diagnostico | biocompatible | mantenimiento | otros
  active: true,
})
const errors = ref({})

let unsubscribe = null

const servicesRef = computed(() => collection(db, `businesses/${props.business.id}/services`))

onMounted(() => {
  loading.value = true
  const q = query(servicesRef.value, orderBy('name', 'asc'))
  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      services.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
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

const filteredServices = computed(() => {
  let list = services.value
  if (search.value.trim()) {
    const term = search.value.toLowerCase()
    list = list.filter(
      (s) => s.name?.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term),
    )
  }
  if (categoryFilter.value !== 'all') {
    list = list.filter((s) => s.category === categoryFilter.value)
  }
  return list
})

const validate = () => {
  const e = {}
  if (!form.value.name?.trim()) e.name = 'Ingresa el nombre del servicio'
  if (!form.value.duration || form.value.duration < 10) e.duration = 'Duración mínima 10 min'
  if (form.value.price == null || form.value.price < 0) e.price = 'Precio inválido'
  errors.value = e
  return Object.keys(e).length === 0
}

const openCreate = () => {
  editingId.value = null
  form.value = {
    name: '',
    description: '',
    duration: 60,
    price: 0,
    category: '',
    active: true,
  }
  errors.value = {}
  showModal.value = true
}

const openEdit = (service) => {
  editingId.value = service.id
  form.value = {
    name: service.name || '',
    description: service.description || '',
    duration: service.duration || 60,
    price: service.price || 0,
    category: service.category || '',
    active: service.active ?? true,
  }
  errors.value = {}
  showModal.value = true
}

const save = async () => {
  if (!validate()) return
  loading.value = true
  try {
    if (editingId.value) {
      await updateDoc(doc(db, `businesses/${props.business.id}/services/${editingId.value}`), {
        ...form.value,
        updatedAt: serverTimestamp(),
      })
    } else {
      await addDoc(servicesRef.value, {
        ...form.value,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    showModal.value = false
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const removeService = async (id) => {
  if (!confirm('¿Eliminar este servicio?')) return
  loading.value = true
  try {
    await deleteDoc(doc(db, `businesses/${props.business.id}/services/${id}`))
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="services-manager">
    <div class="card mb-4">
      <div class="card-body">
        <div class="d-flex flex-wrap gap-3 align-items-end justify-content-between">
          <div class="flex-grow-1">
            <label class="form-label small">Buscar</label>
            <input
              v-model="search"
              type="text"
              class="form-control"
              placeholder="Nombre o descripción"
            />
          </div>
          <div>
            <label class="form-label small">Categoría</label>
            <select v-model="categoryFilter" class="form-select">
              <option value="all">Todas</option>
              <option value="diagnostico">Diagnóstico</option>
              <option value="biocompatible">Biocompatible</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div class="ms-auto">
            <button class="btn btn-primary" @click="openCreate">
              <i class="bi bi-plus-circle"></i>
              Nuevo Servicio
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
        <div v-else-if="filteredServices.length === 0" class="p-4 text-center text-muted">
          No hay servicios para mostrar
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Duración</th>
                <th>Precio</th>
                <th>Activo</th>
                <th style="width: 120px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredServices" :key="s.id">
                <td>
                  <div class="fw-semibold">{{ s.name }}</div>
                  <div class="text-muted small">{{ s.description }}</div>
                </td>
                <td>
                  <span class="badge bg-secondary text-capitalize">{{ s.category || '—' }}</span>
                </td>
                <td>{{ s.duration }} min</td>
                <td>${{ s.price }}</td>
                <td>
                  <span :class="['badge', s.active ? 'bg-success' : 'bg-secondary']">
                    {{ s.active ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openEdit(s)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="removeService(s.id)">
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
            <h5 class="modal-title">{{ editingId ? 'Editar Servicio' : 'Nuevo Servicio' }}</h5>
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
            <div class="mb-3">
              <label class="form-label">Descripción</label>
              <textarea v-model="form.description" rows="3" class="form-control"></textarea>
            </div>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Duración (min)</label>
                <input
                  v-model.number="form.duration"
                  type="number"
                  min="10"
                  step="5"
                  class="form-control"
                  :class="{ 'is-invalid': errors.duration }"
                />
                <div class="invalid-feedback" v-if="errors.duration">{{ errors.duration }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Precio</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    v-model.number="form.price"
                    type="number"
                    min="0"
                    step="50"
                    class="form-control"
                    :class="{ 'is-invalid': errors.price }"
                  />
                </div>
                <div class="invalid-feedback" v-if="errors.price">{{ errors.price }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Categoría</label>
                <select v-model="form.category" class="form-select">
                  <option value="">—</option>
                  <option value="diagnostico">Diagnóstico</option>
                  <option value="biocompatible">Biocompatible</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="otros">Otros</option>
                </select>
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
