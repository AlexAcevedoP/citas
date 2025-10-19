# 📅 ETAPA 2: Gestión de Citas

## ✅ Implementado

### Componente: `AppointmentsManager.vue`

**Ubicación:** `src/components/business/AppointmentsManager.vue`

**Funcionalidades actuales:**

1. **Vista de Lista de Citas**
   - Muestra todas las citas con información completa
   - Información visible: hora, duración, cliente, servicio, especialista, estado
   - Click en cita para editar
   - Botones de editar y eliminar

2. **Filtros Avanzados**
   - Por estado (pendiente, confirmada, completada, cancelada)
   - Por especialista
   - Por servicio
   - Todos los filtros funcionan en conjunto

3. **Selector de Vista**
   - Día / Semana / Mes (preparado para futuras implementaciones)
   - Actualmente muestra vista de lista

4. **Navegación de Calendario**
   - Botones anterior/siguiente
   - Botón "Hoy" para volver a la fecha actual
   - Formato de fecha en español

5. **Panel Lateral "Citas de Hoy"**
   - Muestra solo las citas del día actual
   - Vista compacta con información esencial
   - Click para abrir detalles

6. **Resumen de Estadísticas**
   - Total de citas filtradas
   - Contador por estado (pendientes, confirmadas, completadas)
   - Se actualiza automáticamente con los filtros

7. **Botón "Nueva Cita"**
   - Abre modal para crear cita
   - Modal placeholder (próxima implementación)

8. **Integración con BusinessDashboard**
   - Se activa al hacer click en "Gestión de Citas" del sidebar
   - Recibe la información del negocio como prop

---

## 🎨 Características de UI/UX

- **Badges de Estado**: Colores diferenciados por estado
  - Pendiente: Amarillo (warning)
  - Confirmada: Azul (info)
  - Completada: Verde (success)
  - Cancelada: Rojo (danger)

- **Diseño Responsive**:
  - Calendario en columna principal (8/12)
  - Panel lateral con citas del día (4/12)
- **Interactividad**:
  - Hover effects en items de citas
  - Click para editar
  - Confirmación antes de eliminar

---

## 📊 Datos Mock (Temporal)

Actualmente usa datos de ejemplo:

- 2 citas de muestra
- 2 especialistas
- 4 servicios predefinidos

**Próximo paso:** Conectar con Firestore

---

## 🔜 Próximas Implementaciones

### Fase 2.1: Formulario de Cita Completo

- [ ] Modal con formulario completo
- [ ] Selección de cliente (buscar o crear nuevo)
- [ ] Selección de servicio (con precio y duración)
- [ ] Selección de especialista
- [ ] Selector de fecha y hora
- [ ] Campo de notas
- [ ] Validaciones
- [ ] Guardar en Firestore

### Fase 2.2: Calendario Visual

- [ ] Vista de calendario mensual con grid
- [ ] Vista semanal con horarios
- [ ] Vista diaria con bloques de tiempo
- [ ] Drag & drop para mover citas
- [ ] Click en horario vacío para crear cita

### Fase 2.3: Funciones Avanzadas

- [ ] Cambiar estado de cita desde la lista
- [ ] Reprogramar cita
- [ ] Enviar recordatorios
- [ ] Ver historial del cliente
- [ ] Duplicar cita
- [ ] Exportar lista de citas

### Fase 2.4: Integración con Firestore

- [ ] CRUD completo con Firestore
- [ ] Listeners en tiempo real
- [ ] Sincronización automática
- [ ] Manejo de errores

---

## 🧪 Cómo Probar

1. Iniciar sesión como admin del negocio
2. En el sidebar, hacer click en "Gestión de Citas"
3. Explorar:
   - Filtros de estado, especialista y servicio
   - Panel de "Citas de Hoy"
   - Resumen de estadísticas
   - Botón "Nueva Cita" (abre modal placeholder)

---

## 📝 Notas Técnicas

- **Estado Local**: Actualmente usa `ref()` para el estado
- **Computed Properties**: Filtros reactivos para las citas
- **Props**: Recibe el objeto `business` del componente padre
- **Eventos**: Modal con eventos de abrir/cerrar

**Preparado para:** Integración con Pinia store y Firestore

---

## 🎯 Objetivo de la Etapa

Crear un sistema completo de gestión de citas adaptado a un negocio de dermocosmética, que permita:

- Programar tratamientos faciales
- Asignar especialistas
- Gestionar horarios
- Dar seguimiento a citas
- Facilitar la operación diaria del consultorio

**Estado:** ✅ Base completada - 🔄 Formulario y calendario pendientes
