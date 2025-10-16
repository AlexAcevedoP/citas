# 🛠️ Comandos Útiles - Guía Rápida

## 📦 Instalación y Setup Inicial

```powershell
# Instalar dependencias
npm install

# Configurar Python (si es necesario)
# No aplicable para este proyecto

# Inicializar Firebase
firebase login
firebase init

# Seleccionar opciones:
# - Firestore (rules e indexes)
# - Hosting
# - NO seleccionar Functions por ahora
```

---

## 🚀 Desarrollo

```powershell
# Iniciar servidor de desarrollo
npm run dev

# El servidor estará disponible en:
# http://localhost:5173

# Formatear código
npm run format

# Lint (revisar y arreglar código)
npm run lint

# Build para producción
npm run build

# Vista previa del build
npm run preview
```

---

## 🔥 Firebase Commands

### Despliegue

```powershell
# Desplegar todo
firebase deploy

# Desplegar solo hosting
firebase deploy --only hosting

# Desplegar solo reglas de Firestore
firebase deploy --only firestore:rules

# Desplegar solo índices de Firestore
firebase deploy --only firestore:indexes
```

### Firestore

```powershell
# Ver datos en local
firebase emulators:start --only firestore

# Exportar datos
firebase firestore:export backup-folder

# Importar datos
firebase firestore:import backup-folder

# Ver logs
firebase functions:log
```

### Hosting

```powershell
# Abrir consola de hosting
firebase hosting:channel:list

# Crear preview channel
firebase hosting:channel:deploy preview

# Ver sitio publicado
firebase open hosting:site
```

---

## 🗄️ Comandos de Base de Datos

### Inicializar Datos de Prueba

```javascript
// En la consola del navegador (F12)
import { initializeSampleData } from './src/utils/sampleData.js'
await initializeSampleData()
```

### Limpiar Colección (usar con cuidado)

```javascript
// ADVERTENCIA: Esto eliminará todos los documentos
import { collection, getDocs, deleteDoc } from 'firebase/firestore'
import { db } from './src/firebase/config.js'

async function clearCollection(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
  await Promise.all(deletePromises)
  console.log(`Colección ${collectionName} limpiada`)
}

// Uso
await clearCollection('appointments')
```

---

## 🧪 Testing (cuando esté configurado)

```powershell
# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Coverage
npm run test:coverage

# Tests E2E (cuando estén configurados)
npm run test:e2e
```

---

## 📊 Análisis y Optimización

```powershell
# Analizar bundle size
npm run analyze

# Lighthouse audit (requiere Chrome)
lighthouse http://localhost:5173 --view

# Firestore usage
firebase firestore:usage
```

---

## 🔧 Solución de Problemas Comunes

### Problema: Firebase no conecta

```powershell
# Verificar configuración
cat src/firebase/config.js

# Verificar conexión a internet
ping firebase.google.com

# Re-inicializar Firebase
firebase logout
firebase login
```

### Problema: Errores de índices en Firestore

```powershell
# La consola de Firebase te dará un link para crear el índice
# O puedes desplegar los índices desde tu archivo local:
firebase deploy --only firestore:indexes
```

### Problema: Node modules corruptos

```powershell
# Limpiar y reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Problema: Puerto 5173 ocupado

```powershell
# En Windows PowerShell, encontrar proceso usando el puerto
Get-NetTCPConnection -LocalPort 5173 | Select-Object -Property LocalAddress, LocalPort, State, OwningProcess

# Matar el proceso (reemplaza PID con el número del proceso)
Stop-Process -Id PID -Force

# O cambiar el puerto en vite.config.js
server: {
  port: 3000
}
```

---

## 📝 Git Commands

```powershell
# Inicializar repositorio
git init
git add .
git commit -m "Initial commit"

# Conectar con repositorio remoto
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main

# Workflow típico
git status
git add .
git commit -m "feat: descripción del cambio"
git push

# Crear feature branch
git checkout -b feature/nueva-funcionalidad
git push -u origin feature/nueva-funcionalidad

# Merge a main
git checkout main
git merge feature/nueva-funcionalidad
git push
```

---

## 🔐 Variables de Entorno

### Crear archivo .env.local

```powershell
# Crear archivo (solo en desarrollo)
New-Item -ItemType File -Path .env.local

# Contenido del archivo (editar con tus valores):
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abc123
```

---

## 📱 PWA (Progressive Web App)

```powershell
# Generar íconos PWA
# Usa https://realfavicongenerator.net/

# Archivos necesarios en /public:
# - favicon.ico
# - pwa-192x192.png
# - pwa-512x512.png
# - apple-touch-icon.png
# - robots.txt
# - manifest.json
```

---

## 🚀 Deploy a Producción

### Checklist Pre-Deploy

```powershell
# 1. Construir proyecto
npm run build

# 2. Probar build localmente
npm run preview

# 3. Verificar que no haya errores
npm run lint

# 4. Desplegar reglas y indices primero
firebase deploy --only firestore:rules,firestore:indexes

# 5. Desplegar hosting
firebase deploy --only hosting

# 6. Verificar en el navegador
firefox https://tu-proyecto.web.app
```

---

## 📊 Monitoreo Post-Deploy

```powershell
# Ver logs en tiempo real
firebase functions:log --only hosting

# Ver analytics
# Ir a: https://console.firebase.google.com/

# Verificar estado
firebase hosting:channel:list
```

---

## 🔄 Backup y Restauración

### Backup Manual

```powershell
# Crear carpeta de backup
New-Item -ItemType Directory -Path backups

# Exportar Firestore
firebase firestore:export backups/$(Get-Date -Format "yyyy-MM-dd")

# Backup de código
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Restauración

```powershell
# Restaurar desde backup
firebase firestore:import backups/2025-10-15

# Rollback de hosting
firebase hosting:channel:delete preview
firebase hosting:clone <SOURCE_SITE_ID>:live <DESTINATION_SITE_ID>:live
```

---

## 🎯 Comandos Rápidos Diarios

```powershell
# Inicio del día
git pull
npm install  # Si hubo cambios en package.json
npm run dev

# Durante el desarrollo
npm run lint  # Antes de commit
npm run format  # Para formatear código

# Fin del día
git add .
git commit -m "feat: descripción"
git push
```

---

## 🆘 Comandos de Emergencia

```powershell
# Rollback rápido en Firebase Hosting
firebase hosting:rollback

# Restaurar último commit
git reset --hard HEAD~1

# Limpiar todo y empezar de nuevo
Remove-Item -Recurse -Force node_modules, dist, .firebase
npm install
npm run build
firebase deploy
```

---

## 📚 Recursos y Documentación

```powershell
# Abrir documentación
Start-Process "https://firebase.google.com/docs"
Start-Process "https://vuejs.org/guide"
Start-Process "https://pinia.vuejs.org/"

# Abrir consola de Firebase
firebase open

# Abrir proyecto en GitHub (si está configurado)
Start-Process "https://github.com/tu-usuario/tu-repo"
```

---

## 💡 Tips Útiles

### Atajo para rebuild y deploy

```powershell
# Crear este script en deploy.ps1
npm run build; if ($?) { firebase deploy --only hosting }

# Ejecutar
.\deploy.ps1
```

### Limpiar caché de Firebase

```powershell
Remove-Item -Recurse -Force .firebase
firebase deploy --only hosting
```

### Ver tamaño del build

```powershell
Get-ChildItem -Path dist -Recurse | Measure-Object -Property Length -Sum | Select-Object @{Name="Size(MB)";Expression={[math]::Round($_.Sum/1MB, 2)}}
```

---

**¡Guarda este archivo para referencia rápida! 🚀**
