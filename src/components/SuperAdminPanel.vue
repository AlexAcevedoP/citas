<script setup>
import { ref, reactive } from 'vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

const businessForm = reactive({
  name: '',
  businessType: '',
  adminEmail: '',
  adminName: '',
  adminPassword: '',
})
const loading = ref(false)
const error = ref(null)
const success = ref(null)

const businessTypes = [
  { key: 'barberia', label: 'Barbería' },
  { key: 'peluqueria', label: 'Peluquería' },
  { key: 'spa', label: 'Spa' },
  { key: 'tatuajes', label: 'Estudio de Tatuajes' },
  { key: 'clinica', label: 'Clínica Médica' },
  { key: 'dental', label: 'Clínica Dental' },
  { key: 'gym', label: 'Gimnasio' },
  { key: 'veterinaria', label: 'Veterinaria' },
  { key: 'dermocosmetica', label: 'Dermocosmética / Estética Científica' },
]

async function handleCreateBusiness() {
  loading.value = true
  error.value = null
  success.value = null

  try {
    // 1. Crear usuario admin en Firebase Auth
    const auth = getAuth()
    let adminUid = null
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        businessForm.adminEmail,
        businessForm.adminPassword,
      )
      adminUid = userCredential.user.uid
    } catch (authError) {
      // Si el usuario ya existe, obtener su UID
      if (authError.code === 'auth/email-already-in-use') {
        const user = auth.currentUser
        adminUid = user ? user.uid : null
      } else {
        throw authError
      }
    }
    if (!adminUid) throw new Error('No se pudo obtener el UID del admin.')

    // 2. Crear negocio
    const businessesRef = collection(db, 'businesses')
    const newBusiness = {
      name: businessForm.name,
      businessType: businessForm.businessType,
      createdBy: 'superadmin', // Cambia por el UID real del superadmin si lo tienes
      createdAt: serverTimestamp(),
      status: 'active',
    }
    const businessDoc = await addDoc(businessesRef, newBusiness)
    const businessId = businessDoc.id

    // 3. Crear admin en subcolección del negocio
    const businessUsersRef = collection(db, `businesses/${businessId}/users`)
    await addDoc(businessUsersRef, {
      uid: adminUid,
      name: businessForm.adminName,
      email: businessForm.adminEmail,
      role: 'admin',
      createdAt: serverTimestamp(),
      status: 'active',
    })

    success.value = `Negocio creado y admin asignado correctamente.`
    businessForm.name = ''
    businessForm.businessType = ''
    businessForm.adminEmail = ''
    businessForm.adminName = ''
    businessForm.adminPassword = ''
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="superadmin-panel">
    <div class="card">
      <div class="card-header bg-dark text-white">
        <h4 class="mb-0">
          <i class="bi bi-person-badge"></i>
          Panel de Superadmin
        </h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleCreateBusiness">
          <div class="mb-3">
            <label class="form-label">Nombre del Negocio *</label>
            <input v-model="businessForm.name" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Tipo de Negocio *</label>
            <select v-model="businessForm.businessType" class="form-select" required>
              <option value="">Selecciona un tipo</option>
              <option v-for="type in businessTypes" :key="type.key" :value="type.key">
                {{ type.label }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Email del Admin *</label>
            <input v-model="businessForm.adminEmail" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Nombre del Admin *</label>
            <input v-model="businessForm.adminName" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Contraseña del Admin *</label>
            <input
              v-model="businessForm.adminPassword"
              type="password"
              class="form-control"
              required
            />
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-plus-circle me-2"></i>
              Crear Negocio y Asignar Admin
            </button>
          </div>
        </form>
        <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
        <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.superadmin-panel {
  max-width: 600px;
  margin: 2rem auto;
}
</style>
