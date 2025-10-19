# Módulo de Configuración (Settings)

## 📋 Descripción General

El módulo de **Configuración** es el centro de control del negocio donde los administradores pueden personalizar y ajustar todos los aspectos operativos del sistema.

## 🎯 Características Implementadas

### 1. **Información del Negocio** 🏪

Gestión de datos fundamentales de la empresa:

#### Campos Editables:

- **Nombre del Negocio**: Identificación principal
- **Email**: Contacto principal del negocio
- **Teléfono**: Número de contacto
- **Dirección**: Ubicación física completa
- **Descripción**: Información detallada del negocio

#### Horarios de Atención:

- Configuración individual para cada día de la semana
- Hora de apertura y cierre personalizables
- Opción para marcar días como cerrados
- Interfaz intuitiva con switches y campos de hora

**Días disponibles:**

- Lunes a Domingo
- Cada día puede tener horarios diferentes
- Toggle para marcar como "Cerrado"

### 2. **Configuración de Citas** 📅

Parámetros operativos para el sistema de reservas:

#### Duraciones y Tiempos:

- **Duración Predeterminada**: Tiempo estándar por cita (minutos)
- **Tiempo entre Citas (Buffer)**: Espacio de limpieza/preparación entre citas

#### Restricciones de Agendamiento:

- **Anticipación Mínima**: Horas requeridas antes de agendar
- **Anticipación Máxima**: Días máximos de antelación permitidos

#### Política de Cancelación:

- **Horas de Anticipación**: Tiempo requerido para cancelar sin penalización
- **Permitir Cancelación**: Toggle para habilitar/deshabilitar cancelaciones

#### Opciones del Sistema:

- **Confirmar Automáticamente**: Las citas se confirman sin intervención manual
- **Permitir Reservas Online**: Habilita sistema de booking para clientes

### 3. **Gestión de Usuarios** 👥

Administración de accesos al panel del negocio:

#### Funcionalidades:

- **Listar Usuarios**: Tabla con todos los usuarios con acceso
- **Agregar Usuario**:
  - Crea cuenta en Firebase Authentication
  - Guarda en `businesses/{id}/users`
  - Asigna email, nombre, rol y contraseña
- **Eliminar Usuario**: Remueve acceso del panel

#### Roles Disponibles:

- **Administrador**: Acceso total al sistema
- **Especialista**: Gestión de citas y clientes
- **Recepcionista**: Recepción y agendamiento
- **Empleado**: Acceso básico

#### Información Mostrada:

- Nombre completo
- Email de acceso
- Rol asignado
- Fecha de registro

### 4. **Preferencias del Sistema** ⚙️

Configuraciones regionales y de formato:

#### Opciones Disponibles:

- **Idioma**: Español / English
- **Zona Horaria**:
  - Ciudad de México (UTC-6)
  - Tijuana (UTC-7)
  - Monterrey (UTC-6)
  - Cancún (UTC-5)
- **Formato de Fecha**:
  - DD/MM/YYYY
  - MM/DD/YYYY
  - YYYY-MM-DD
- **Moneda**:
  - Peso Mexicano (MXN)
  - Dólar Americano (USD)
  - Euro (EUR)

## 🗂️ Estructura de Datos en Firestore

```javascript
// businesses/{businessId}
{
  // Información básica
  name: "Dermoclinic Spa",
  address: "Av. Principal 123, Col. Centro",
  phone: "+52 555-1234",
  email: "contacto@dermoclinic.com",
  description: "Centro especializado en tratamientos dermatológicos",

  // Configuración detallada
  config: {
    // Horarios de atención
    openingHours: {
      monday: {
        open: "09:00",
        close: "18:00",
        closed: false
      },
      tuesday: {
        open: "09:00",
        close: "18:00",
        closed: false
      },
      wednesday: {
        open: "09:00",
        close: "18:00",
        closed: false
      },
      thursday: {
        open: "09:00",
        close: "18:00",
        closed: false
      },
      friday: {
        open: "09:00",
        close: "18:00",
        closed: false
      },
      saturday: {
        open: "09:00",
        close: "14:00",
        closed: false
      },
      sunday: {
        open: "00:00",
        close: "00:00",
        closed: true
      }
    },

    // Configuración de citas
    appointments: {
      defaultDuration: 60,        // minutos
      bufferTime: 15,             // minutos entre citas
      minAdvanceBooking: 2,       // horas mínimas
      maxAdvanceBooking: 30,      // días máximos
      cancellationHours: 24,      // horas de anticipación
      allowCancellation: true,    // permitir cancelar
      autoConfirm: false,         // confirmación automática
      allowOnlineBooking: true    // reservas online
    },

    // Preferencias del sistema
    preferences: {
      language: "es",
      timezone: "America/Mexico_City",
      dateFormat: "DD/MM/YYYY",
      currency: "MXN"
    }
  },

  updatedAt: Timestamp,
  updatedBy: "userId"
}

// businesses/{businessId}/users/{userId}
{
  uid: "firebase-auth-uid",
  email: "usuario@example.com",
  name: "María González",
  role: "specialist",
  createdAt: Timestamp
}
```

## 🎨 Interfaz de Usuario

### Navegación por Tabs

El módulo usa **Pills Navigation** con 4 pestañas principales:

1. 🏪 **Negocio** - Información y horarios
2. 📅 **Citas** - Configuración de reservas
3. 👥 **Usuarios** - Gestión de accesos
4. ⚙️ **Preferencias** - Configuración regional

### Componentes Visuales

#### Formularios:

- Inputs estilizados con Bootstrap
- Labels descriptivos
- Textos de ayuda (small text-muted)
- Validaciones en tiempo real

#### Tarjetas de Horarios:

- Card individual por día de la semana
- Switch para marcar como cerrado
- Time inputs para apertura/cierre
- Diseño responsive (2 columnas en desktop)

#### Tabla de Usuarios:

- Headers con fondo claro
- Badges de colores para roles
- Botón de eliminar por usuario
- Hover effect en filas

#### Alertas:

- Fixed position (top-right)
- Auto-dismiss después de 3 segundos
- Verde para éxito, rojo para errores
- Icono según tipo de mensaje

## 🔧 Funcionalidades Técnicas

### Carga de Datos

```javascript
const loadBusinessData = async () => {
  const businessDoc = await getDoc(doc(db, 'businesses', props.business.id))
  if (businessDoc.exists()) {
    const data = businessDoc.data()

    // Cargar info básica
    businessInfo.value = { ...data }

    // Cargar config si existe
    if (data.config?.openingHours) {
      businessInfo.value.openingHours = data.config.openingHours
    }

    if (data.config?.appointments) {
      appointmentsConfig.value = data.config.appointments
    }

    if (data.config?.preferences) {
      preferences.value = data.config.preferences
    }
  }
}
```

### Guardar Configuración

```javascript
const saveBusinessInfo = async () => {
  await updateDoc(doc(db, 'businesses', props.business.id), {
    name: businessInfo.value.name,
    address: businessInfo.value.address,
    phone: businessInfo.value.phone,
    email: businessInfo.value.email,
    description: businessInfo.value.description,
    'config.openingHours': businessInfo.value.openingHours,
    updatedAt: serverTimestamp(),
  })
}
```

### Crear Usuario

```javascript
const addUser = async () => {
  // 1. Crear en Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    newUser.value.email,
    newUser.value.password,
  )

  // 2. Guardar en Firestore
  await addDoc(collection(db, `businesses/${props.business.id}/users`), {
    uid: userCredential.user.uid,
    email: newUser.value.email,
    name: newUser.value.name,
    role: newUser.value.role,
    createdAt: serverTimestamp(),
  })
}
```

## 📊 Casos de Uso

### Caso 1: Actualizar Horarios de Atención

```
1. Admin va a Configuración → Negocio
2. Scroll a "Horarios de Atención"
3. Para el Sábado:
   - Cambia apertura a 10:00
   - Cambia cierre a 15:00
4. Para el Domingo:
   - Activa toggle "Cerrado"
5. Clic en "Guardar Cambios"
6. Se actualiza en Firestore
→ Sistema valida disponibilidad según nuevos horarios
```

### Caso 2: Configurar Política de Cancelación

```
1. Admin va a Configuración → Citas
2. En "Política de Cancelación":
   - Establece 48 horas de anticipación
   - Mantiene "Permitir cancelación" activado
3. Clic en "Guardar Configuración"
→ Sistema rechaza cancelaciones con menos de 48h
```

### Caso 3: Agregar Usuario Especialista

```
1. Admin va a Configuración → Usuarios
2. Clic en "Agregar Usuario"
3. En modal:
   - Nombre: "Dra. Laura Martínez"
   - Email: "laura@dermoclinic.com"
   - Contraseña: "LauraSecure2024"
   - Rol: "Especialista"
4. Clic en "Crear Usuario"
5. Sistema crea cuenta en Auth
6. Guarda en businesses/{id}/users
7. Usuario aparece en tabla
→ Dra. Laura puede iniciar sesión con sus credenciales
```

### Caso 4: Cambiar Duración Predeterminada de Citas

```
1. Admin va a Configuración → Citas
2. Cambia "Duración Predeterminada" de 60 a 45 minutos
3. Cambia "Tiempo entre Citas" de 15 a 10 minutos
4. Clic en "Guardar Configuración"
→ Nuevas citas se crean con 45 min por defecto
```

### Caso 5: Ajustar Preferencias Regionales

```
1. Admin va a Configuración → Preferencias
2. Cambia:
   - Zona horaria: Tijuana (UTC-7)
   - Formato de fecha: MM/DD/YYYY
3. Clic en "Guardar Preferencias"
→ Sistema ajusta fechas y horarios según configuración
```

## ✅ Validaciones Implementadas

### Información del Negocio:

- ✅ Todos los campos son opcionales
- ✅ Horarios validados en formato HH:MM
- ✅ No se puede guardar si hay campos inválidos

### Configuración de Citas:

- ✅ Duración mínima: 15 minutos
- ✅ Buffer mínimo: 0 minutos
- ✅ Anticipación mínima: 0 horas
- ✅ Anticipación máxima: 1+ días

### Usuarios:

- ✅ Email requerido y formato válido
- ✅ Contraseña mínimo 6 caracteres
- ✅ Nombre requerido
- ✅ Manejo de errores de Auth (email duplicado, etc.)

## 🚀 Mejoras Futuras

### Fase 2 - Notificaciones:

- [ ] Configurar recordatorios por email/SMS
- [ ] Plantillas de mensajes personalizables
- [ ] Integración con WhatsApp Business API
- [ ] Programación de recordatorios (24h, 2h antes)

### Fase 3 - Branding:

- [ ] Subir logo del negocio
- [ ] Selector de colores del tema
- [ ] Personalización de emails
- [ ] Redes sociales

### Fase 4 - Pagos:

- [ ] Configurar métodos de pago aceptados
- [ ] Datos bancarios para transferencias
- [ ] Integración con Stripe/Mercado Pago
- [ ] Política de depósitos/anticipos

### Fase 5 - Avanzado:

- [ ] Integraciones (Google Calendar, etc.)
- [ ] Respaldos automáticos
- [ ] Logs de auditoría
- [ ] 2FA para usuarios
- [ ] Roles y permisos personalizados

## 🎯 Impacto en Otros Módulos

### Citas:

- Valida disponibilidad según horarios configurados
- Respeta duración predeterminada y buffer time
- Aplica política de cancelación
- Usa anticipación mínima/máxima

### Usuarios:

- Login funciona con usuarios creados aquí
- Roles determinan permisos en el sistema
- Staff puede ser seleccionado en citas

### General:

- Formato de fecha/hora según preferencias
- Zona horaria aplicada en todo el sistema
- Moneda mostrada según configuración

## 📝 Notas Técnicas

- **Firebase Auth**: Creación de usuarios con email/password
- **Firestore**: Configuración almacenada en document del business
- **Real-time**: No usa listeners (carga única al montar)
- **Validación**: Frontend con feedback visual inmediato
- **Seguridad**: Solo admins pueden acceder a configuración
- **UX**: Mensajes de éxito/error con auto-dismiss

## 🐛 Problemas Conocidos

- [ ] Al eliminar usuario de Firestore, no se elimina de Auth
- [ ] No hay validación de formato de teléfono
- [ ] No se puede editar rol de usuario existente
- [ ] No hay confirmación antes de guardar (excepto eliminar)
- [ ] Horarios no validan que apertura < cierre

## 💡 Tips de Uso

1. **Configura horarios primero**: Evita citas fuera de horario
2. **Buffer time adecuado**: Permite limpieza entre clientes
3. **Anticipación mínima**: Evita citas de último minuto
4. **Roles claros**: Asigna permisos según función real
5. **Contraseñas seguras**: Usa mínimo 8 caracteres con números

## 🔐 Seguridad

### Acceso:

- Solo usuarios con rol `admin` pueden ver Configuración
- Verificación de autenticación en cada operación
- Timestamps de auditoría (updatedAt, updatedBy)

### Recomendaciones:

1. Cambiar contraseñas periódicamente
2. Remover usuarios inactivos
3. Revisar logs de cambios
4. Usar 2FA cuando esté disponible

## 📞 Soporte

Para dudas o problemas con el módulo de Configuración:

- Revisar logs del navegador (F12 → Console)
- Verificar permisos de Firestore
- Confirmar que usuario tiene rol admin
- Contactar al equipo de desarrollo

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0 (MVP - Fase 1)  
**Estado**: ✅ Funcional y probado
