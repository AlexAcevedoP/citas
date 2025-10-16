import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

export const useAppointmentsStore = defineStore('appointments', () => {
  // Estado reactivo
  const appointments = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Referencia a la colección de Firebase
  const appointmentsCollection = collection(db, 'appointments')

  // Inicializar escucha en tiempo real
  let unsubscribe = null
  let isListenerActive = false

  const initializeRealtimeListener = () => {
    // Evitar múltiples listeners
    if (isListenerActive) {
      return
    }

    loading.value = true
    isListenerActive = true

    // Consulta más simple - sin ordenamiento para evitar problemas de índice
    unsubscribe = onSnapshot(
      appointmentsCollection,
      (snapshot) => {
        appointments.value = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              // Convertir Timestamp de Firebase a string si es necesario
              createdAt: data.createdAt?.toDate?.() || new Date(),
            }
          })
          .sort((a, b) => {
            // Ordenar por fecha y luego por hora en el cliente
            if (a.date === b.date) {
              return a.time.localeCompare(b.time)
            }
            return a.date.localeCompare(b.date)
          })

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

  // Getters computados
  const totalAppointments = computed(() => appointments.value.length)

  const confirmedAppointments = computed(() =>
    appointments.value.filter((apt) => apt.status === 'confirmed'),
  )

  const pendingAppointments = computed(() =>
    appointments.value.filter((apt) => apt.status === 'pending'),
  )

  // Obtener citas por fecha
  const getAppointmentsByDate = computed(
    () => (date) => appointments.value.filter((apt) => apt.date === date),
  )

  // Obtener citas del día actual
  const todayAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.value.filter((apt) => apt.date === today)
  })

  // Acciones
  async function addAppointment(appointmentData) {
    try {
      loading.value = true
      error.value = null

      // Validar que tenga businessId
      if (!appointmentData.businessId) {
        throw new Error('Se requiere un negocio asociado')
      }

      // Validar conflictos de horario
      if (hasTimeConflict(appointmentData)) {
        throw new Error('Ya existe una cita en ese horario')
      }

      const newAppointment = {
        ...appointmentData,
        status: appointmentData.status || 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(appointmentsCollection, newAppointment)
      loading.value = false
      return { id: docRef.id, ...newAppointment }
    } catch (err) {
      error.value = err.message
      loading.value = false
      throw err
    }
  }

  async function updateAppointment(id, updatedData) {
    try {
      loading.value = true
      error.value = null

      // Validar conflictos solo si se cambia fecha/hora
      const currentApt = appointments.value.find((apt) => apt.id === id)
      if (!currentApt) {
        throw new Error('Cita no encontrada')
      }

      const dateTimeChanged =
        updatedData.date !== currentApt.date || updatedData.time !== currentApt.time

      if (dateTimeChanged && hasTimeConflict(updatedData, id)) {
        throw new Error('Ya existe una cita en ese horario')
      }

      const appointmentRef = doc(db, 'appointments', id)
      const updateData = {
        ...updatedData,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(appointmentRef, updateData)
      loading.value = false
      return { id, ...currentApt, ...updateData }
    } catch (err) {
      error.value = err.message
      loading.value = false
      throw err
    }
  }

  async function deleteAppointment(id) {
    try {
      loading.value = true
      error.value = null

      const appointmentRef = doc(db, 'appointments', id)
      await deleteDoc(appointmentRef)
      loading.value = false
    } catch (err) {
      error.value = err.message
      loading.value = false
      throw err
    }
  }

  function getAppointmentById(id) {
    return appointments.value.find((apt) => apt.id === id)
  }

  async function confirmAppointment(id) {
    try {
      await updateAppointment(id, { status: 'confirmed' })
    } catch (err) {
      console.error('Error al confirmar cita:', err)
      throw err
    }
  }

  async function cancelAppointment(id) {
    try {
      await updateAppointment(id, { status: 'cancelled' })
    } catch (err) {
      console.error('Error al cancelar cita:', err)
      throw err
    }
  }

  // Función para validar conflictos de horario
  function hasTimeConflict(newAppointment, excludeId = null) {
    const newStart = parseDateTime(newAppointment.date, newAppointment.time)
    const newEnd = new Date(newStart.getTime() + newAppointment.duration * 60000)

    return appointments.value.some((apt) => {
      if (excludeId && apt.id === excludeId) return false
      if (apt.date !== newAppointment.date) return false

      const existingStart = parseDateTime(apt.date, apt.time)
      const existingEnd = new Date(existingStart.getTime() + apt.duration * 60000)

      // Verificar si hay solapamiento
      return newStart < existingEnd && newEnd > existingStart
    })
  }

  // Función auxiliar para parsear fecha y hora
  function parseDateTime(date, time) {
    return new Date(`${date}T${time}:00`)
  }

  // Filtrar citas por rango de fechas
  function getAppointmentsByDateRange(startDate, endDate) {
    return appointments.value.filter((apt) => apt.date >= startDate && apt.date <= endDate)
  }

  // Obtener estadísticas
  const stats = computed(() => ({
    total: totalAppointments.value,
    confirmed: confirmedAppointments.value.length,
    pending: pendingAppointments.value.length,
    cancelled: appointments.value.filter((apt) => apt.status === 'cancelled').length,
    today: todayAppointments.value.length,
  }))

  // Obtener citas por negocio
  const getAppointmentsByBusiness = computed(
    () => (businessId) => appointments.value.filter((apt) => apt.businessId === businessId),
  )

  // Obtener estadísticas por negocio
  const getStatsByBusiness = (businessId) => {
    const businessAppts = appointments.value.filter((apt) => apt.businessId === businessId)
    const today = new Date().toISOString().split('T')[0]

    return {
      total: businessAppts.length,
      confirmed: businessAppts.filter((apt) => apt.status === 'confirmed').length,
      pending: businessAppts.filter((apt) => apt.status === 'pending').length,
      cancelled: businessAppts.filter((apt) => apt.status === 'cancelled').length,
      today: businessAppts.filter((apt) => apt.date === today).length,
    }
  }

  // Función para limpiar el listener cuando sea necesario
  function stopRealtimeListener() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
      isListenerActive = false
    }
  }

  return {
    // Estado
    appointments,
    loading,
    error,

    // Getters
    totalAppointments,
    confirmedAppointments,
    pendingAppointments,
    getAppointmentsByDate,
    todayAppointments,
    stats,
    getAppointmentsByBusiness,
    getStatsByBusiness,

    // Acciones
    initializeRealtimeListener,
    stopRealtimeListener,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentById,
    confirmAppointment,
    cancelAppointment,
    getAppointmentsByDateRange,
    hasTimeConflict,
  }
})
