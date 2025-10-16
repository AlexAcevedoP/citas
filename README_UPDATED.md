# 📅 Plataforma de Agendamiento de Citas Multi-Negocio

Sistema completo de gestión de citas diseñado para múltiples tipos de negocios: barberías, peluquerías, spas, estudios de tatuajes, clínicas, gimnasios, veterinarias y más.

## 🚀 Características Principales

### ✨ Multi-Tenant (Múltiples Negocios)

- Soporte para diferentes tipos de negocios en una sola plataforma
- Cada negocio tiene su propia configuración y datos
- Dashboard personalizado por tipo de negocio

### 🏢 Tipos de Negocio Soportados

1. **Barbería** - Gestión de cortes, barberos y estilos
2. **Peluquería** - Servicios de belleza, estilistas y tratamientos
3. **Spa** - Masajes, faciales, paquetes de servicios
4. **Tatuajes** - Portafolio de artistas, diseños personalizados
5. **Clínica Médica** - Consultas, especialidades, historial médico
6. **Clínica Dental** - Tratamientos dentales, expedientes
7. **Gimnasio** - Entrenamiento personal, clases, planes
8. **Veterinaria** - Atención de mascotas, vacunación

### 📋 Funcionalidades

- ✅ Calendario interactivo de citas
- ✅ Gestión de servicios por negocio
- ✅ Administración de empleados
- ✅ Estadísticas y reportes
- ✅ Base de datos de clientes
- ✅ Múltiples vistas (calendario, lista)
- ✅ Confirmación y cancelación de citas
- ✅ Horarios personalizables
- ✅ Notificaciones (email, SMS, WhatsApp) - próximamente

## 🛠️ Tecnologías

- **Frontend**: Vue.js 3 (Composition API)
- **Estado**: Pinia
- **Base de Datos**: Firebase Firestore
- **UI**: Bootstrap 5 + Bootstrap Icons
- **Build Tool**: Vite
- **Routing**: Vue Router

## 📦 Instalación

### Prerrequisitos

- Node.js v20.19.0 o superior
- npm o yarn
- Cuenta de Firebase

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone <tu-repositorio>
cd citas
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Firestore Database
   - Copia las credenciales de configuración
   - Edita `src/firebase/config.js` con tus credenciales

4. **Iniciar servidor de desarrollo**

```bash
npm run dev
```

5. **Construir para producción**

```bash
npm run build
```

## 📁 Estructura del Proyecto

```
citas/
├── src/
│   ├── components/
│   │   ├── AppointmentCalendar.vue    # Vista de calendario
│   │   ├── AppointmentForm.vue        # Formulario de citas
│   │   ├── AppointmentList.vue        # Lista de citas
│   │   ├── AppointmentModal.vue       # Modal de detalles
│   │   ├── BusinessSelector.vue       # Selector de negocios
│   │   ├── BusinessForm.vue           # Formulario de registro
│   │   └── BusinessDashboard.vue      # Dashboard por negocio
│   │
│   ├── stores/
│   │   ├── appointments.js            # Store de citas
│   │   ├── business.js                # Store de negocios
│   │   └── counter.js                 # Store auxiliar
│   │
│   ├── firebase/
│   │   └── config.js                  # Configuración de Firebase
│   │
│   ├── router/
│   │   └── index.js                   # Configuración de rutas
│   │
│   ├── App.vue                        # Componente raíz
│   └── main.js                        # Punto de entrada
│
├── public/                            # Archivos estáticos
├── FIRESTORE_STRUCTURE.md             # Documentación de BD
└── package.json                       # Dependencias
```

## 🗄️ Estructura de Base de Datos

Ver el archivo [FIRESTORE_STRUCTURE.md](./FIRESTORE_STRUCTURE.md) para detalles completos sobre:

- Colecciones y documentos
- Campos y tipos de datos
- Índices recomendados
- Reglas de seguridad
- Ejemplos de consultas

### Colecciones Principales:

- `businesses` - Información de negocios
- `appointments` - Citas agendadas
- `customers` - Base de clientes
- `users` - Usuarios del sistema
- `reviews` - Reseñas (opcional)

## 🎨 Uso

### 1. Registrar un Nuevo Negocio

```javascript
import { useBusinessStore } from './stores/business'

const businessStore = useBusinessStore()

await businessStore.addBusiness({
  name: 'Barbería El Clásico',
  businessType: 'barberia',
  address: 'Calle Principal #123',
  phone: '+52 555-1234',
  email: 'contacto@barberia.com',
  openingHours: {
    /* ... */
  },
  services: [{ name: 'Corte', duration: 30, price: 150 }],
})
```

### 2. Crear una Cita

```javascript
import { useAppointmentsStore } from './stores/appointments'

const appointmentsStore = useAppointmentsStore()

await appointmentsStore.addAppointment({
  businessId: 'negocio-123',
  client: {
    name: 'Juan Pérez',
    phone: '+52 555-9876',
    email: 'juan@email.com',
  },
  date: '2025-10-20',
  time: '10:00',
  duration: 30,
  service: { name: 'Corte', price: 150 },
  employee: { name: 'Carlos' },
})
```

### 3. Filtrar Citas por Negocio

```javascript
const appointmentsStore = useAppointmentsStore()
const businessAppointments = appointmentsStore.getAppointmentsByBusiness('negocio-123')
```

## 🔧 Configuración por Tipo de Negocio

Cada tipo de negocio tiene su configuración predefinida:

```javascript
{
  barberia: {
    name: 'Barbería',
    icon: 'bi-scissors',
    color: '#2C3E50',
    services: ['Corte de Cabello', 'Barba', 'Afeitado', 'Coloración'],
    defaultDuration: 30
  },
  // ... más tipos
}
```

## 📊 Estadísticas y Reportes

```javascript
// Obtener estadísticas generales
const stats = appointmentsStore.stats

// Estadísticas por negocio
const businessStats = appointmentsStore.getStatsByBusiness('negocio-123')
```

## 🎯 Próximas Funcionalidades

- [ ] Sistema de autenticación (Firebase Auth)
- [ ] Roles y permisos (owner, manager, employee)
- [ ] Notificaciones automáticas (email, SMS, WhatsApp)
- [ ] Sistema de pagos (Stripe, PayPal)
- [ ] Reportes avanzados y gráficas
- [ ] Integración con Google Calendar
- [ ] App móvil (React Native / Flutter)
- [ ] Exportación de datos (PDF, Excel)
- [ ] Temas personalizables por negocio
- [ ] Multi-idioma (i18n)
- [ ] Sistema de reseñas y calificaciones
- [ ] Programa de lealtad / puntos

## 💰 Modelo de Negocio

### Planes de Suscripción

- **Gratuito**: 1 negocio, 50 citas/mes
- **Básico** ($299/mes): 1 negocio, citas ilimitadas
- **Premium** ($599/mes): Múltiples negocios, todas las funciones
- **Enterprise** (personalizado): Solución white-label

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Construye para producción
npm run preview  # Vista previa de producción
npm run lint     # Ejecuta ESLint
npm run format   # Formatea código con Prettier
```

## 🐛 Solución de Problemas

### Error: Firebase no está configurado

Asegúrate de haber configurado correctamente `src/firebase/config.js` con tus credenciales.

### Error: Índices de Firestore faltantes

Sigue los enlaces de error en la consola para crear los índices requeridos en Firebase.

### Las citas no se muestran en tiempo real

Verifica que hayas inicializado el listener con `initializeRealtimeListener()`.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Tu Nombre - [Tu Email]

## 🙏 Agradecimientos

- Vue.js Team
- Firebase Team
- Bootstrap Team
- Comunidad Open Source

---

## 📞 Soporte

¿Necesitas ayuda?

- 📧 Email: soporte@tuapp.com
- 💬 Discord: [Servidor de Discord]
- 📖 Docs: [Documentación completa]

---

**¡Hecho con ❤️ para emprendedores y negocios!**
