<template>
  <div 
    class="modal fade" 
    :class="{ 'show': show }" 
    :style="{ display: show ? 'block' : 'none' }"
    tabindex="-1" 
    role="dialog"
  >
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <AppointmentForm 
          :appointment="appointment"
          :show="show"
          @close="closeModal"
          @success="handleSuccess"
        />
      </div>
    </div>
  </div>
  
  <!-- Backdrop -->
  <div 
    v-if="show" 
    class="modal-backdrop fade show"
    @click="closeModal"
  ></div>
</template>

<script setup>
import { watch } from 'vue'
import AppointmentForm from './AppointmentForm.vue'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  appointment: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Métodos
const closeModal = () => {
  emit('close')
}

const handleSuccess = () => {
  emit('success')
}

// Manejar scroll del body cuando el modal está abierto
watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.classList.add('modal-open')
    document.body.style.paddingRight = '17px' // Para compensar scrollbar
  } else {
    document.body.classList.remove('modal-open')
    document.body.style.paddingRight = ''
  }
})
</script>

<style scoped>
.modal {
  z-index: 1055;
}

.modal-backdrop {
  z-index: 1050;
}

/* Transiciones suaves */
.modal.fade {
  transition: opacity 0.15s linear;
}

.modal.fade .modal-dialog {
  transition: transform 0.15s ease-out;
  transform: translate(0, -50px);
}

.modal.show .modal-dialog {
  transform: none;
}
</style>