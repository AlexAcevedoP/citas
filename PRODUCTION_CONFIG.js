/**
 * Configuración Recomendada para Producción
 *
 * Este archivo contiene configuraciones y mejores prácticas
 * para desplegar la aplicación en producción
 */

// ============================================
// 1. VARIABLES DE ENTORNO (.env)
// ============================================

// Crear archivo .env.local (no incluir en git)
/*
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abc123

# Para producción
VITE_ENV=production
VITE_API_URL=https://api.tuapp.com

# Para desarrollo
VITE_ENV=development
VITE_API_URL=http://localhost:5173
*/

// ============================================
// 2. FIRESTORE INDEXES (firestore.indexes.json)
// ============================================

const firestoreIndexes = {
  indexes: [
    {
      collectionGroup: 'appointments',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'businessId', order: 'ASCENDING' },
        { fieldPath: 'date', order: 'ASCENDING' },
      ],
    },
    {
      collectionGroup: 'appointments',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'businessId', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'date', order: 'ASCENDING' },
      ],
    },
    {
      collectionGroup: 'appointments',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'businessId', order: 'ASCENDING' },
        { fieldPath: 'employeeId', order: 'ASCENDING' },
        { fieldPath: 'date', order: 'ASCENDING' },
      ],
    },
    {
      collectionGroup: 'customers',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'businessId', order: 'ASCENDING' },
        { fieldPath: 'phone', order: 'ASCENDING' },
      ],
    },
    {
      collectionGroup: 'businesses',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'businessType', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' },
      ],
    },
  ],
  fieldOverrides: [],
}

// ============================================
// 3. FIRESTORE SECURITY RULES
// ============================================

const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(businessId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/businesses/$(businessId)).data.ownerId == request.auth.uid;
    }
    
    function isEmployee(businessId) {
      let business = get(/databases/$(database)/documents/businesses/$(businessId)).data;
      return isAuthenticated() && 
             (business.ownerId == request.auth.uid || 
              request.auth.uid in business.employeeIds);
    }
    
    // Businesses collection
    match /businesses/{businessId} {
      // Cualquiera puede leer negocios activos
      allow read: if resource.data.status == 'active';
      
      // Solo usuarios autenticados pueden crear negocios
      allow create: if isAuthenticated() && 
                       request.resource.data.ownerId == request.auth.uid;
      
      // Solo el dueño puede actualizar o eliminar
      allow update, delete: if isOwner(businessId);
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      // Leer: empleados del negocio o el cliente
      allow read: if isEmployee(resource.data.businessId) || 
                     (isAuthenticated() && resource.data.client.userId == request.auth.uid);
      
      // Crear: empleados del negocio o usuarios autenticados (para self-booking)
      allow create: if isAuthenticated() && 
                       exists(/databases/$(database)/documents/businesses/$(request.resource.data.businessId));
      
      // Actualizar: empleados del negocio
      allow update: if isEmployee(resource.data.businessId);
      
      // Eliminar: solo dueños
      allow delete: if isOwner(resource.data.businessId);
    }
    
    // Customers collection
    match /customers/{customerId} {
      // Solo empleados del negocio pueden leer/escribir
      allow read, write: if isEmployee(resource.data.businessId);
    }
    
    // Users collection
    match /users/{userId} {
      // Solo el propio usuario puede leer/escribir sus datos
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      // Todos pueden leer reseñas publicadas
      allow read: if resource.data.status == 'published';
      
      // Solo clientes autenticados pueden crear
      allow create: if isAuthenticated();
      
      // Solo el dueño del negocio puede responder
      allow update: if isOwner(resource.data.businessId);
    }
  }
}
`

// ============================================
// 4. VITE CONFIG OPTIMIZADO
// ============================================

const viteConfig = `
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Agendamiento de Citas',
        short_name: 'Citas',
        description: 'Plataforma de gestión de citas para negocios',
        theme_color: '#0d6efd',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    // Optimizaciones de producción
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'vendor-ui': ['bootstrap', '@popperjs/core']
        }
      }
    },
    // Aumentar el límite de advertencia de tamaño
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true
  }
})
`

// ============================================
// 5. PACKAGE.JSON SCRIPTS ADICIONALES
// ============================================

const additionalScripts = {
  scripts: {
    dev: 'vite',
    build: 'vite build',
    preview: 'vite preview',
    lint: 'eslint . --fix',
    format: 'prettier --write src/',

    // Scripts adicionales recomendados
    'build:prod': 'NODE_ENV=production vite build',
    analyze: 'vite-bundle-visualizer',
    test: 'vitest',
    'test:ui': 'vitest --ui',
    'test:coverage': 'vitest run --coverage',
    deploy: 'npm run build && firebase deploy',
    'deploy:hosting': 'firebase deploy --only hosting',
    'deploy:functions': 'firebase deploy --only functions',
    'deploy:rules': 'firebase deploy --only firestore:rules',
    logs: 'firebase functions:log',
  },
}

// ============================================
// 6. CONFIGURACIÓN DE FIREBASE HOSTING
// ============================================

const firebaseJson = {
  hosting: {
    public: 'dist',
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    rewrites: [
      {
        source: '**',
        destination: '/index.html',
      },
    ],
    headers: [
      {
        source: '**/*.@(jpg|jpeg|gif|png|svg|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'max-age=31536000',
          },
        ],
      },
      {
        source: '**/*.@(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'max-age=31536000',
          },
        ],
      },
    ],
  },
  firestore: {
    rules: 'firestore.rules',
    indexes: 'firestore.indexes.json',
  },
}

// ============================================
// 7. MEJORES PRÁCTICAS
// ============================================

const bestPractices = {
  performance: [
    'Usar lazy loading para componentes grandes',
    'Implementar paginación en listas largas',
    'Optimizar imágenes (WebP, compresión)',
    'Usar Firestore local persistence',
    'Implementar service workers (PWA)',
    'Minimizar re-renders con memo/computed',
  ],

  security: [
    'Nunca exponer API keys en el código frontend (usar variables de entorno)',
    'Implementar reglas de seguridad de Firestore robustas',
    'Validar datos en el servidor (Cloud Functions)',
    'Usar Firebase Auth para autenticación',
    'Implementar rate limiting',
    'Sanitizar inputs de usuario',
  ],

  seo: [
    'Agregar meta tags apropiados',
    'Implementar Server-Side Rendering (SSR) si es necesario',
    'Crear sitemap.xml',
    'Configurar robots.txt',
    'Usar URLs semánticas',
    'Implementar Schema.org markup',
  ],

  monitoring: [
    'Configurar Firebase Analytics',
    'Implementar error tracking (Sentry)',
    'Monitorear performance (Lighthouse)',
    'Configurar alertas de errores',
    'Revisar logs regularmente',
  ],
}

// ============================================
// 8. CHECKLIST PRE-PRODUCCIÓN
// ============================================

const preProductionChecklist = [
  '[ ] Variables de entorno configuradas',
  '[ ] Firestore rules implementadas y probadas',
  '[ ] Índices de Firestore creados',
  '[ ] Tests escritos y pasando',
  '[ ] Performance optimizado (Lighthouse > 90)',
  '[ ] SEO configurado',
  '[ ] Analytics implementado',
  '[ ] Error tracking configurado',
  '[ ] Backup strategy definida',
  '[ ] Dominio personalizado configurado',
  '[ ] SSL/HTTPS habilitado',
  '[ ] CORS configurado si es necesario',
  '[ ] Rate limiting implementado',
  '[ ] Documentación actualizada',
  '[ ] README con instrucciones claras',
]

// ============================================
// 9. MONITOREO Y MANTENIMIENTO
// ============================================

const maintenanceTasks = {
  daily: ['Revisar logs de errores', 'Monitorear uso de Firebase (cuotas)', 'Verificar uptime'],

  weekly: [
    'Revisar analytics',
    'Actualizar dependencias críticas',
    'Backup de datos',
    'Revisar feedback de usuarios',
  ],

  monthly: [
    'Auditoría de seguridad',
    'Performance review',
    'Análisis de costos',
    'Planificación de nuevas features',
    'Actualización de documentación',
  ],
}

// ============================================
// 10. COSTOS ESTIMADOS (Firebase)
// ============================================

const estimatedCosts = {
  free_tier: {
    firestore: {
      reads: '50,000/día',
      writes: '20,000/día',
      deletes: '20,000/día',
      storage: '1 GB',
    },
    hosting: {
      storage: '10 GB',
      transfer: '360 MB/día',
    },
    auth: 'Ilimitado',
  },

  paid_estimates: {
    '100 negocios': {
      firestore: '$5-15/mes',
      hosting: '$1-5/mes',
      total: '$10-25/mes',
    },
    '500 negocios': {
      firestore: '$25-50/mes',
      hosting: '$5-10/mes',
      total: '$30-60/mes',
    },
    '1000 negocios': {
      firestore: '$50-100/mes',
      hosting: '$10-20/mes',
      total: '$60-120/mes',
    },
  },

  optimization_tips: [
    'Usar queries eficientes (índices)',
    'Implementar caching',
    'Paginar resultados',
    'Usar Cloud Functions solo cuando sea necesario',
    'Monitorear y optimizar queries costosas',
  ],
}

export {
  firestoreIndexes,
  firestoreRules,
  viteConfig,
  additionalScripts,
  firebaseJson,
  bestPractices,
  preProductionChecklist,
  maintenanceTasks,
  estimatedCosts,
}
