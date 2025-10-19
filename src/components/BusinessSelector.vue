<script setup>
import { onMounted } from 'vue'
import { useBusinessStore } from '../stores/business'

const businessStore = useBusinessStore()
const emit = defineEmits(['business-selected'])

onMounted(() => {
  businessStore.initializeRealtimeListener()
})

const selectBusiness = (business) => {
  businessStore.setCurrentBusiness(business)
  emit('business-selected', business)
}
</script>

<template>
  <div class="business-selector">
    <div class="container">
      <h2 class="text-center mb-4">
        <i class="bi bi-building"></i>
        Selecciona tu Negocio
      </h2>

      <!-- Loading State -->
      <div v-if="businessStore.loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Business Grid -->
      <div v-else class="row g-4">
        <div
          v-for="business in businessStore.activeBusinesses"
          :key="business.id"
          class="col-md-6 col-lg-4"
        >
          <div
            class="card business-card h-100"
            :style="{
              borderColor: businessStore.getBusinessTypeConfig(business.businessType)?.color,
            }"
            @click="selectBusiness(business)"
          >
            <div class="card-body">
              <div class="text-center mb-3">
                <i
                  :class="businessStore.getBusinessTypeConfig(business.businessType)?.icon"
                  class="business-icon"
                  :style="{
                    color: businessStore.getBusinessTypeConfig(business.businessType)?.color,
                  }"
                ></i>
              </div>
              <h5 class="card-title text-center">{{ business.name }}</h5>
              <p class="card-text text-center text-muted small">
                {{ businessStore.getBusinessTypeConfig(business.businessType)?.name }}
              </p>
              <div class="text-center">
                <span class="badge bg-light text-dark">
                  <i class="bi bi-geo-alt"></i>
                  {{ business.address }}
                </span>
              </div>
            </div>
            <div class="card-footer bg-transparent text-center">
              <button class="btn btn-sm btn-outline-primary w-100">Seleccionar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!businessStore.loading && businessStore.activeBusinesses.length === 0"
        class="text-center py-5"
      >
        <i class="bi bi-shop text-muted" style="font-size: 4rem"></i>
        <p class="text-muted mt-3">No hay negocios registrados</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.business-selector {
  padding: 2rem 0;
}

.business-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-width: 2px;
}

.business-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.business-icon {
  font-size: 3rem;
}
</style>
