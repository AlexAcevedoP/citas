/**
 * Script para inicializar datos de prueba en Firestore
 *
 * USO:
 * 1. Asegúrate de tener configurado Firebase correctamente
 * 2. Importa este archivo en tu componente o ejecuta las funciones
 * 3. Llama a initializeSampleData() para crear datos de prueba
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Datos de ejemplo para diferentes tipos de negocios
 */
const sampleBusinesses = [
  {
    name: 'Barbería El Clásico',
    businessType: 'barberia',
    address: 'Av. Reforma #456, Col. Centro',
    phone: '+52 55 1234-5678',
    email: 'contacto@barberiaelclasico.com',
    description: 'La mejor barbería tradicional de la ciudad con más de 20 años de experiencia',
    openingHours: {
      monday: { open: '09:00', close: '20:00', closed: false },
      tuesday: { open: '09:00', close: '20:00', closed: false },
      wednesday: { open: '09:00', close: '20:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '21:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '10:00', close: '15:00', closed: false },
    },
    services: [
      {
        id: 'srv-1',
        name: 'Corte de Cabello',
        duration: 30,
        price: 200,
        description: 'Corte profesional con estilo',
      },
      {
        id: 'srv-2',
        name: 'Barba',
        duration: 20,
        price: 150,
        description: 'Arreglo de barba profesional',
      },
      {
        id: 'srv-3',
        name: 'Corte + Barba',
        duration: 45,
        price: 320,
        description: 'Paquete completo',
      },
      {
        id: 'srv-4',
        name: 'Afeitado Clásico',
        duration: 25,
        price: 180,
        description: 'Con navaja y toallas calientes',
      },
    ],
    employees: [
      {
        id: 'emp-1',
        name: 'Carlos Rodríguez',
        role: 'Barbero Senior',
        specialties: ['Corte', 'Barba', 'Afeitado'],
        photo: '',
      },
      {
        id: 'emp-2',
        name: 'Miguel Ángel Torres',
        role: 'Barbero',
        specialties: ['Corte', 'Diseño'],
        photo: '',
      },
    ],
    config: {
      color: '#2C3E50',
      allowOnlineBooking: true,
      requiresDeposit: false,
      cancellationPolicy: '24 horas de anticipación',
    },
    status: 'active',
  },

  {
    name: 'Spa Serenity',
    businessType: 'spa',
    address: 'Blvd. de las Estrellas #789, Plaza Premium',
    phone: '+52 55 9876-5432',
    email: 'info@spaserenity.com',
    description: 'Spa de lujo con tratamientos personalizados y atención premium',
    openingHours: {
      monday: { open: '10:00', close: '20:00', closed: false },
      tuesday: { open: '10:00', close: '20:00', closed: false },
      wednesday: { open: '10:00', close: '20:00', closed: false },
      thursday: { open: '10:00', close: '20:00', closed: false },
      friday: { open: '10:00', close: '21:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: false },
    },
    services: [
      {
        id: 'srv-1',
        name: 'Masaje Relajante',
        duration: 60,
        price: 800,
        description: '60 minutos de relajación total',
      },
      {
        id: 'srv-2',
        name: 'Facial Hidratante',
        duration: 45,
        price: 650,
        description: 'Tratamiento facial profundo',
      },
      {
        id: 'srv-3',
        name: 'Masaje de Piedras Calientes',
        duration: 90,
        price: 1200,
        description: 'Terapia con piedras volcánicas',
      },
      {
        id: 'srv-4',
        name: 'Paquete Spa Day',
        duration: 180,
        price: 2500,
        description: 'Día completo de spa',
      },
    ],
    employees: [
      {
        id: 'emp-1',
        name: 'Laura Martínez',
        role: 'Terapeuta Senior',
        specialties: ['Masaje', 'Aromaterapia'],
        photo: '',
      },
      {
        id: 'emp-2',
        name: 'Ana Patricia Sánchez',
        role: 'Esteticista',
        specialties: ['Facial', 'Corporal'],
        photo: '',
      },
    ],
    config: {
      color: '#00BCD4',
      allowOnlineBooking: true,
      requiresDeposit: true,
      cancellationPolicy: '48 horas de anticipación',
    },
    status: 'active',
  },

  {
    name: 'Ink Masters Tattoo',
    businessType: 'tatuajes',
    address: 'Calle Insurgentes #321, Col. Hipster',
    phone: '+52 55 5555-7890',
    email: 'contacto@inkmasters.com',
    description: 'Estudio profesional de tatuajes con artistas reconocidos internacionalmente',
    openingHours: {
      monday: { open: '12:00', close: '20:00', closed: false },
      tuesday: { open: '12:00', close: '20:00', closed: false },
      wednesday: { open: '12:00', close: '20:00', closed: false },
      thursday: { open: '12:00', close: '20:00', closed: false },
      friday: { open: '12:00', close: '22:00', closed: false },
      saturday: { open: '11:00', close: '22:00', closed: false },
      sunday: { open: '11:00', close: '18:00', closed: true },
    },
    services: [
      { id: 'srv-1', name: 'Tatuaje Pequeño', duration: 60, price: 1500, description: 'Hasta 5cm' },
      { id: 'srv-2', name: 'Tatuaje Mediano', duration: 120, price: 3000, description: '5-15cm' },
      {
        id: 'srv-3',
        name: 'Tatuaje Grande',
        duration: 240,
        price: 6000,
        description: 'Más de 15cm',
      },
      {
        id: 'srv-4',
        name: 'Consulta y Diseño',
        duration: 30,
        price: 0,
        description: 'Diseño personalizado gratuito',
      },
    ],
    employees: [
      {
        id: 'emp-1',
        name: 'Roberto "Ink" García',
        role: 'Tatuador Principal',
        specialties: ['Realismo', 'Japonés'],
        photo: '',
      },
      {
        id: 'emp-2',
        name: 'Diana Flores',
        role: 'Tatuadora',
        specialties: ['Blackwork', 'Geométrico'],
        photo: '',
      },
    ],
    config: {
      color: '#9C27B0',
      allowOnlineBooking: true,
      requiresDeposit: true,
      cancellationPolicy: '72 horas de anticipación, se pierde el depósito',
    },
    status: 'active',
  },

  {
    name: 'Clínica Dental Sonrisas',
    businessType: 'dental',
    address: 'Av. Universidad #567, Torre Médica',
    phone: '+52 55 1111-2222',
    email: 'citas@clinicasonrisas.com',
    description: 'Clínica dental con tecnología de vanguardia y especialistas certificados',
    openingHours: {
      monday: { open: '08:00', close: '19:00', closed: false },
      tuesday: { open: '08:00', close: '19:00', closed: false },
      wednesday: { open: '08:00', close: '19:00', closed: false },
      thursday: { open: '08:00', close: '19:00', closed: false },
      friday: { open: '08:00', close: '19:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '14:00', closed: true },
    },
    services: [
      {
        id: 'srv-1',
        name: 'Limpieza Dental',
        duration: 45,
        price: 500,
        description: 'Profilaxis completa',
      },
      {
        id: 'srv-2',
        name: 'Extracción Simple',
        duration: 30,
        price: 800,
        description: 'Extracción de pieza dental',
      },
      {
        id: 'srv-3',
        name: 'Resina',
        duration: 60,
        price: 900,
        description: 'Restauración estética',
      },
      {
        id: 'srv-4',
        name: 'Blanqueamiento',
        duration: 90,
        price: 3500,
        description: 'Blanqueamiento dental profesional',
      },
    ],
    employees: [
      {
        id: 'emp-1',
        name: 'Dr. José Luis Ramírez',
        role: 'Odontólogo General',
        specialties: ['Odontología General', 'Endodoncia'],
        photo: '',
      },
      {
        id: 'emp-2',
        name: 'Dra. María Fernanda López',
        role: 'Ortodoncista',
        specialties: ['Ortodoncia', 'Estética Dental'],
        photo: '',
      },
    ],
    config: {
      color: '#03A9F4',
      allowOnlineBooking: true,
      requiresDeposit: false,
      cancellationPolicy: '24 horas de anticipación',
    },
    status: 'active',
  },
]

/**
 * Función para inicializar negocios de ejemplo
 */
export async function initializeSampleBusinesses() {
  try {
    console.log('🚀 Iniciando creación de negocios de ejemplo...')

    const businessIds = []

    for (const business of sampleBusinesses) {
      const businessData = {
        ...business,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'businesses'), businessData)
      businessIds.push(docRef.id)
      console.log(`✅ Negocio creado: ${business.name} (ID: ${docRef.id})`)
    }

    console.log('✨ ¡Todos los negocios fueron creados exitosamente!')
    return businessIds
  } catch (error) {
    console.error('❌ Error al crear negocios de ejemplo:', error)
    throw error
  }
}

/**
 * Función para crear citas de ejemplo
 */
export async function initializeSampleAppointments(businessIds) {
  try {
    console.log('🚀 Iniciando creación de citas de ejemplo...')

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sampleAppointments = [
      {
        businessId: businessIds[0], // Barbería
        client: {
          name: 'Juan Pérez',
          phone: '+52 55 9999-1111',
          email: 'juan.perez@email.com',
        },
        date: today.toISOString().split('T')[0],
        time: '10:00',
        duration: 30,
        service: {
          id: 'srv-1',
          name: 'Corte de Cabello',
          price: 200,
        },
        employee: {
          id: 'emp-1',
          name: 'Carlos Rodríguez',
        },
        status: 'confirmed',
        notes: 'Cliente prefiere corte corto',
      },
      {
        businessId: businessIds[0], // Barbería
        client: {
          name: 'Pedro González',
          phone: '+52 55 8888-2222',
          email: 'pedro@email.com',
        },
        date: tomorrow.toISOString().split('T')[0],
        time: '15:00',
        duration: 45,
        service: {
          id: 'srv-3',
          name: 'Corte + Barba',
          price: 320,
        },
        employee: {
          id: 'emp-2',
          name: 'Miguel Ángel Torres',
        },
        status: 'pending',
        notes: '',
      },
      {
        businessId: businessIds[1], // Spa
        client: {
          name: 'María López',
          phone: '+52 55 7777-3333',
          email: 'maria@email.com',
        },
        date: today.toISOString().split('T')[0],
        time: '14:00',
        duration: 60,
        service: {
          id: 'srv-1',
          name: 'Masaje Relajante',
          price: 800,
        },
        employee: {
          id: 'emp-1',
          name: 'Laura Martínez',
        },
        status: 'confirmed',
        notes: 'Primera visita',
      },
    ]

    for (const appointment of sampleAppointments) {
      const appointmentData = {
        ...appointment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'appointments'), appointmentData)
      console.log(`✅ Cita creada para ${appointment.client.name} (ID: ${docRef.id})`)
    }

    console.log('✨ ¡Todas las citas fueron creadas exitosamente!')
  } catch (error) {
    console.error('❌ Error al crear citas de ejemplo:', error)
    throw error
  }
}

/**
 * Función principal para inicializar todos los datos
 */
export async function initializeSampleData() {
  try {
    console.log('🎉 Iniciando inicialización de datos de ejemplo...\n')

    // Crear negocios
    const businessIds = await initializeSampleBusinesses()

    console.log('\n⏳ Esperando 2 segundos...\n')
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Crear citas
    await initializeSampleAppointments(businessIds)

    console.log('\n🎊 ¡Inicialización completada! Recarga la aplicación para ver los datos.')
  } catch (error) {
    console.error('❌ Error en la inicialización:', error)
  }
}

/**
 * USO EN UN COMPONENTE VUE:
 *
 * import { initializeSampleData } from './utils/sampleData'
 *
 * // En un método o al montar
 * async mounted() {
 *   await initializeSampleData()
 * }
 *
 * O crea un botón:
 * <button @click="initializeSampleData">Cargar Datos de Prueba</button>
 */
