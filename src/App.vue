<script setup>
import { ref } from 'vue'
import AppointmentCalendar from './components/AppointmentCalendar.vue'
import AppointmentList from './components/AppointmentList.vue'
import LoginForm from './components/LoginForm.vue'
import SuperAdminPanel from './components/SuperAdminPanel.vue'
import BusinessDashboard from './components/BusinessDashboard.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase/config'

const currentView = ref('calendar')
const user = ref(null)
const userRole = ref(null)
const loadingUserRole = ref(false)

const setView = (view) => {
  currentView.value = view
}

const logout = async () => {
  await signOut(getAuth())
  user.value = null
  userRole.value = null
}

// Detectar usuario autenticado y su rol desde Firestore
onAuthStateChanged(getAuth(), async (authUser) => {
  user.value = authUser
  if (authUser) {
    loadingUserRole.value = true
    // Obtener rol real desde Firestore
    const userDocRef = doc(db, 'users', authUser.uid)
    const userDocSnap = await getDoc(userDocRef)
    if (userDocSnap.exists()) {
      const data = userDocSnap.data()
      userRole.value = data.role
    } else {
      userRole.value = null
    }
    loadingUserRole.value = false
  } else {
    userRole.value = null
    loadingUserRole.value = false
  }
})

const handleLoginSuccess = async (authUser) => {
  user.value = authUser
  loadingUserRole.value = true
  // Obtener rol real desde Firestore
  const userDocRef = doc(db, 'users', authUser.uid)
  const userDocSnap = await getDoc(userDocRef)
  if (userDocSnap.exists()) {
    const data = userDocSnap.data()
    userRole.value = data.role
  } else {
    userRole.value = null
  }
  loadingUserRole.value = false
}
</script>

<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" href="#" @click="setView('calendar')">
          <i class="bi bi-calendar-heart"></i>
          Sistema de Citas
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a
                class="nav-link"
                :class="{ active: currentView === 'calendar' }"
                href="#"
                @click.prevent="setView('calendar')"
              >
                <i class="bi bi-calendar3"></i>
                Calendario
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                :class="{ active: currentView === 'list' }"
                href="#"
                @click.prevent="setView('list')"
              >
                <i class="bi bi-list-ul"></i>
                Lista de Citas
              </a>
            </li>
            <li v-if="user" class="nav-item">
              <button class="btn btn-outline-light ms-3" @click="logout">
                <i class="bi bi-box-arrow-right"></i>
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container my-4">
      <transition name="fade" mode="out-in">
        <LoginForm v-if="!user" @login-success="handleLoginSuccess" />
        <div v-else-if="loadingUserRole" class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
        </div>
        <SuperAdminPanel v-else-if="userRole === 'super_admin' || userRole === 'superadmin'" />
        <BusinessDashboard v-else-if="userRole === 'admin'" :business="{}" />
        <div v-else>
          <AppointmentCalendar v-if="currentView === 'calendar'" key="calendar" />
          <AppointmentList v-else-if="currentView === 'list'" key="list" />
        </div>
      </transition>
    </div>

    <footer class="bg-light text-center py-3 mt-5">
      <div class="container">
        <p class="text-muted mb-0">
          <i class="bi bi-heart text-danger"></i>
          Sistema de Gestión de Citas - Desarrollado con Vue 3 y Firebase
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
}

footer {
  margin-top: auto;
}

/* Transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Estilos para navegación activa */
.navbar-nav .nav-link.active {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
}

.navbar-nav .nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
}
</style>
