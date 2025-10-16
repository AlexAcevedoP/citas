<script setup>
import { ref } from 'vue'
import { initializeSampleData } from '../utils/sampleData'

const loading = ref(false)
const message = ref('')
const messageType = ref('') // success, error, info

const loadSampleData = async () => {
  try {
    loading.value = true
    message.value = 'Cargando datos de ejemplo...'
    messageType.value = 'info'

    await initializeSampleData()

    message.value = '¡Datos cargados exitosamente! Recarga la página para verlos.'
    messageType.value = 'success'

    // Auto-reload después de 2 segundos
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  } catch (error) {
    message.value = `Error al cargar datos: ${error.message}`
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="sample-data-loader">
    <div class="card border-warning">
      <div class="card-header bg-warning text-dark">
        <h5 class="mb-0">
          <i class="bi bi-database"></i>
          Cargar Datos de Prueba
        </h5>
      </div>
      <div class="card-body">
        <p class="card-text">
          Esta herramienta cargará datos de ejemplo en tu base de datos de Firestore:
        </p>

        <ul class="mb-3">
          <li>✅ 4 Negocios diferentes (Barbería, Spa, Tatuajes, Dental)</li>
          <li>✅ Servicios configurados para cada negocio</li>
          <li>✅ Empleados de ejemplo</li>
          <li>✅ Citas de muestra</li>
        </ul>

        <!-- Alert Messages -->
        <div
          v-if="message"
          class="alert alert-dismissible fade show"
          :class="{
            'alert-success': messageType === 'success',
            'alert-danger': messageType === 'error',
            'alert-info': messageType === 'info',
          }"
        >
          <i
            class="bi me-2"
            :class="{
              'bi-check-circle': messageType === 'success',
              'bi-exclamation-triangle': messageType === 'error',
              'bi-info-circle': messageType === 'info',
            }"
          ></i>
          {{ message }}
          <button type="button" class="btn-close" @click="message = ''"></button>
        </div>

        <!-- Warning -->
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Advertencia:</strong> Esto creará datos en tu base de datos de Firestore. Solo
          úsalo en entornos de desarrollo o pruebas.
        </div>

        <!-- Button -->
        <button class="btn btn-primary btn-lg w-100" @click="loadSampleData" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-download me-2"></i>
          {{ loading ? 'Cargando...' : 'Cargar Datos de Prueba' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sample-data-loader {
  max-width: 600px;
  margin: 2rem auto;
}
</style>
