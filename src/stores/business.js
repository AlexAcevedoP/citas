import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
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
} from 'firebase/firestore'
import { db } from '../firebase/config'

export const useBusinessStore = defineStore('business', () => {
  // Estado reactivo
  const businesses = ref([])
  const currentBusiness = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Referencia a la colección de Firebase
  const businessesCollection = collection(db, 'businesses')

  // Listener en tiempo real
  let unsubscribe = null
  let isListenerActive = false

  // Tipos de negocio disponibles con sus configuraciones
  const businessTypes = ref({
    barberia: {
      name: 'Barbería',
      icon: 'bi-scissors',
      color: '#2C3E50',
      services: ['Corte de Cabello', 'Barba', 'Afeitado', 'Coloración'],
      features: ['Galería de estilos', 'Historial de clientes', 'Productos'],
      defaultDuration: 30,
    },
    peluqueria: {
      name: 'Peluquería',
      icon: 'bi-brush',
      color: '#E91E63',
      services: ['Corte', 'Tinte', 'Mechas', 'Tratamiento', 'Peinado'],
      features: ['Catálogo de servicios', 'Productos de belleza', 'Membresías'],
      defaultDuration: 45,
    },
    spa: {
      name: 'Spa',
      icon: 'bi-flower1',
      color: '#00BCD4',
      services: ['Masaje', 'Facial', 'Corporal', 'Manicure', 'Pedicure'],
      features: ['Paquetes', 'Cabinas', 'Terapeutas especializados'],
      defaultDuration: 60,
    },
    tatuajes: {
      name: 'Estudio de Tatuajes',
      icon: 'bi-palette',
      color: '#9C27B0',
      services: ['Tatuaje', 'Diseño Personalizado', 'Cover Up', 'Retoque'],
      features: ['Portafolio de artistas', 'Consulta previa', 'Cuidados post-tatuaje'],
      defaultDuration: 120,
    },
    clinica: {
      name: 'Clínica Médica',
      icon: 'bi-hospital',
      color: '#4CAF50',
      services: ['Consulta General', 'Especialidades', 'Laboratorio', 'Imagenología'],
      features: ['Historial médico', 'Recetas', 'Recordatorios'],
      defaultDuration: 30,
    },
    dental: {
      name: 'Clínica Dental',
      icon: 'bi-tooth',
      color: '#03A9F4',
      services: ['Limpieza', 'Ortodoncia', 'Endodoncia', 'Implantes'],
      features: ['Expediente dental', 'Planes de tratamiento', 'Radiografías'],
      defaultDuration: 45,
    },
    gym: {
      name: 'Gimnasio',
      icon: 'bi-trophy',
      color: '#FF5722',
      services: ['Entrenamiento Personal', 'Clases Grupales', 'Nutrición', 'Evaluación'],
      features: ['Rutinas personalizadas', 'Seguimiento de progreso', 'Planes'],
      defaultDuration: 60,
    },
    veterinaria: {
      name: 'Veterinaria',
      icon: 'bi-heart-pulse',
      color: '#8BC34A',
      services: ['Consulta', 'Vacunación', 'Cirugía', 'Estética Canina'],
      features: ['Historial de mascotas', 'Recordatorios de vacunas', 'Recetas'],
      defaultDuration: 30,
    },
  })

  const initializeRealtimeListener = () => {
    if (isListenerActive) return

    loading.value = true
    isListenerActive = true

    unsubscribe = onSnapshot(
      businessesCollection,
      (snapshot) => {
        businesses.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }))

        loading.value = false
      },
      (err) => {
        error.value = err.message
        loading.value = false
        isListenerActive = false
        console.error('Error al escuchar cambios:', err)
      },
    )
  }

  // Getters
  const getBusinessesByType = computed(
    () => (type) => businesses.value.filter((b) => b.businessType === type),
  )

  const activeBusinesses = computed(() => businesses.value.filter((b) => b.status === 'active'))

  // Acciones
  async function addBusiness(businessData) {
    try {
      loading.value = true
      error.value = null

      const newBusiness = {
        ...businessData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(businessesCollection, newBusiness)
      loading.value = false
      return { id: docRef.id, ...newBusiness }
    } catch (err) {
      error.value = err.message
      loading.value = false
      throw err
    }
  }

  async function updateBusiness(id, updatedData) {
    try {
      loading.value = true
      error.value = null

      const businessRef = doc(db, 'businesses', id)
      const updateData = {
        ...updatedData,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(businessRef, updateData)
      loading.value = false
    } catch (err) {
      error.value = err.message
      loading.value = false
      throw err
    }
  }

  async function deleteBusiness(id) {
    try {
      loading.value = true
      error.value = null

      const businessRef = doc(db, 'businesses', id)
      await deleteDoc(businessRef)
      loading.value = false
    } catch (err) {
      error.value = err.message
      loading.value = false
      throw err
    }
  }

  function getBusinessById(id) {
    return businesses.value.find((b) => b.id === id)
  }

  function setCurrentBusiness(business) {
    currentBusiness.value = business
  }

  function getBusinessTypeConfig(type) {
    return businessTypes.value[type] || null
  }

  function stopRealtimeListener() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
      isListenerActive = false
    }
  }

  return {
    // Estado
    businesses,
    currentBusiness,
    loading,
    error,
    businessTypes,

    // Getters
    getBusinessesByType,
    activeBusinesses,

    // Acciones
    initializeRealtimeListener,
    stopRealtimeListener,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    getBusinessById,
    setCurrentBusiness,
    getBusinessTypeConfig,
  }
})
