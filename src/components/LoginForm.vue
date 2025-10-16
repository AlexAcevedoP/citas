<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)
const emit = defineEmits(['login-success'])

const handleLogin = async () => {
  loading.value = true
  error.value = null
  try {
    const auth = getAuth()
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    emit('login-success', userCredential.user)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-form">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h4 class="mb-0">
          <i class="bi bi-person-circle"></i>
          Iniciar Sesión
        </h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-box-arrow-in-right me-2"></i>
              Ingresar
            </button>
          </div>
        </form>
        <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 2rem auto;
}
</style>
