<script setup>
import { ref } from 'vue'
import LoginForm from './components/LoginForm.vue'
import SuperAdminPanel from './components/SuperAdminPanel.vue'
import BusinessDashboard from './components/BusinessDashboard.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { signOut } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase/config'

const user = ref(null)
const userRole = ref(null)
const userBusiness = ref(null)
const loadingUserRole = ref(false)

const logout = async () => {
  await signOut(getAuth())
  user.value = null
  userRole.value = null
  userBusiness.value = null
}

// Detectar usuario autenticado y su rol desde Firestore
onAuthStateChanged(getAuth(), async (authUser) => {
  user.value = authUser
  if (authUser) {
    loadingUserRole.value = true

    // Primero verificar si es superadmin en la colección global de users
    const userDocRef = doc(db, 'users', authUser.uid)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const data = userDocSnap.data()
      userRole.value = data.role
      loadingUserRole.value = false
      return
    }

    // Si no es superadmin, buscar en qué negocio está como admin
    try {
      const businessesRef = collection(db, 'businesses')
      const businessesSnapshot = await getDocs(businessesRef)

      for (const businessDoc of businessesSnapshot.docs) {
        const businessId = businessDoc.id
        const usersRef = collection(db, `businesses/${businessId}/users`)
        const userQuery = query(usersRef, where('uid', '==', authUser.uid))
        const userSnapshot = await getDocs(userQuery)

        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data()
          userRole.value = userData.role
          userBusiness.value = {
            id: businessId,
            ...businessDoc.data(),
          }
          break
        }
      }
    } catch (error) {
      console.error('Error buscando usuario en negocios:', error)
    }

    loadingUserRole.value = false
  } else {
    userRole.value = null
    userBusiness.value = null
    loadingUserRole.value = false
  }
})

const handleLoginSuccess = async (authUser) => {
  user.value = authUser
  loadingUserRole.value = true

  // Primero verificar si es superadmin
  const userDocRef = doc(db, 'users', authUser.uid)
  const userDocSnap = await getDoc(userDocRef)

  if (userDocSnap.exists()) {
    const data = userDocSnap.data()
    userRole.value = data.role
    loadingUserRole.value = false
    return
  }

  // Si no es superadmin, buscar en qué negocio está
  try {
    const businessesRef = collection(db, 'businesses')
    const businessesSnapshot = await getDocs(businessesRef)

    for (const businessDoc of businessesSnapshot.docs) {
      const businessId = businessDoc.id
      const usersRef = collection(db, `businesses/${businessId}/users`)
      const userQuery = query(usersRef, where('uid', '==', authUser.uid))
      const userSnapshot = await getDocs(userQuery)

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data()
        userRole.value = userData.role
        userBusiness.value = {
          id: businessId,
          ...businessDoc.data(),
        }
        break
      }
    }
  } catch (error) {
    console.error('Error buscando usuario en negocios:', error)
  }

  loadingUserRole.value = false
}
</script>

<template>
  <div id="app">
    <nav v-if="user" class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">
          <i class="bi bi-calendar-heart"></i>
          Sistema de Citas
        </a>
        <div class="ms-auto">
          <button class="btn btn-outline-light" @click="logout">
            <i class="bi bi-box-arrow-right"></i>
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>

    <div class="main-container">
      <transition name="fade" mode="out-in">
        <LoginForm v-if="!user" @login-success="handleLoginSuccess" />
        <div
          v-else-if="loadingUserRole"
          class="d-flex justify-content-center align-items-center"
          style="min-height: 400px"
        >
          <div class="text-center">
            <span class="spinner-border text-primary mb-3" role="status" aria-hidden="true"></span>
            <p class="text-muted">Cargando información del usuario...</p>
          </div>
        </div>
        <SuperAdminPanel v-else-if="userRole === 'super_admin' || userRole === 'superadmin'" />
        <BusinessDashboard
          v-else-if="userRole === 'admin' && userBusiness"
          :business="userBusiness"
        />
        <div v-else class="container my-5">
          <div class="alert alert-warning text-center">
            <i class="bi bi-exclamation-triangle" style="font-size: 3rem"></i>
            <h4 class="mt-3">Rol no reconocido</h4>
            <p>Tu cuenta no tiene permisos asignados. Contacta al administrador.</p>
            <button class="btn btn-primary mt-2" @click="logout">Cerrar sesión</button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
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
</style>
