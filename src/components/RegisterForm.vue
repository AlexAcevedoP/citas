<script setup>
import { ref } from 'vue'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const email = ref('')
const password = ref('')
const name = ref('')
const role = ref('admin') // Puedes cambiar a employee/customer
const businessId = ref('') // Opcional, para asignar negocio
const loading = ref(false)
const error = ref(null)
const success = ref(null)

const emit = defineEmits(['register-success'])

const handleRegister = async () => {
  loading.value = true
  error.value = null
  success.value = null
  try {
    // 1. Crear usuario en Firebase Auth
    const auth = getAuth()
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const uid = userCredential.user.uid

    // 2. Crear documento en Firestore con rol y negocio
    const userDoc = {
      uid,
      name: name.value,
      email: email.value,
      roles: businessId.value
        ? [{ businessId: businessId.value, role: role.value }]
        : [{ businessId: null, role: role.value }],
      createdAt: serverTimestamp(),
    }
    await addDoc(collection(db, 'users'), userDoc)

    success.value = 'Usuario creado correctamente.'
    emit('register-success', userDoc)
    email.value = ''
    password.value = ''
    name.value = ''
    businessId.value = ''
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-form">
    <div class="card">
      <div class="card-header bg-success text-white">
        <h4 class="mb-0">
          <i class="bi bi-person-plus"></i>
          Registrar Usuario
        </h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleRegister">
          <div class="mb-3">
            <label class="form-label">Nombre</label>
            <input v-model="name" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Rol</label>
            <select v-model="role" class="form-select">
              <option value="admin">Admin</option>
              <option value="employee">Empleado</option>
              <option value="customer">Cliente</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">ID del Negocio (opcional)</label>
            <input v-model="businessId" type="text" class="form-control" />
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="submit" class="btn btn-success" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-person-plus me-2"></i>
              Registrar
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
.register-form {
  max-width: 400px;
  margin: 2rem auto;
}
</style>
