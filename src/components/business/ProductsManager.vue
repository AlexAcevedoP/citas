<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../../firebase/config'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

const props = defineProps({
  business: {
    type: Object,
    required: true,
  },
})

// Estado
const activeTab = ref('products') // products | sales | inventory | reports
const loading = ref(false)
const error = ref(null)

// Productos
const products = ref([])
const search = ref('')
const categoryFilter = ref('all')
const showProductModal = ref(false)
const editingProductId = ref(null)
const productForm = ref({
  name: '',
  description: '',
  category: 'dermocosmetics',
  brand: '',
  sku: '',
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 5,
  unit: 'unidad',
  active: true,
})
const productErrors = ref({})

// Ventas
const sales = ref([])
const showSaleModal = ref(false)
const saleForm = ref({
  items: [{ productId: '', quantity: 1, price: 0, productName: '' }],
  customerName: '',
  paymentMethod: 'cash',
  appointmentId: '',
  notes: '',
})
const saleErrors = ref({})

// Movimientos de inventario
const showInventoryModal = ref(false)
const inventoryForm = ref({
  productId: '',
  type: 'in', // in | out | adjustment
  quantity: 0,
  reason: '',
  reference: '',
})

let unsubscribeProducts = null
let unsubscribeSales = null

// Computed
const productsRef = computed(() => collection(db, `businesses/${props.business.id}/products`))
const salesRef = computed(() => collection(db, `businesses/${props.business.id}/productSales`))

const filteredProducts = computed(() => {
  let list = products.value

  if (search.value.trim()) {
    const term = search.value.toLowerCase()
    list = list.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term),
    )
  }

  if (categoryFilter.value !== 'all') {
    list = list.filter((p) => p.category === categoryFilter.value)
  }

  return list
})

const lowStockProducts = computed(() => {
  return products.value.filter((p) => p.stock <= p.minStock && p.active)
})

const totalInventoryValue = computed(() => {
  return products.value.reduce((sum, p) => sum + p.stock * p.cost, 0)
})

const salesStats = computed(() => {
  const total = sales.value.reduce((sum, s) => sum + s.total, 0)
  const count = sales.value.length
  const byMethod = {
    cash: sales.value
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.total, 0),
    card: sales.value
      .filter((s) => s.paymentMethod === 'card')
      .reduce((sum, s) => sum + s.total, 0),
    transfer: sales.value
      .filter((s) => s.paymentMethod === 'transfer')
      .reduce((sum, s) => sum + s.total, 0),
  }

  return { total, count, byMethod }
})

const topSellingProducts = computed(() => {
  const productSales = {}

  sales.value.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          revenue: 0,
        }
      }
      productSales[item.productId].quantity += item.quantity
      productSales[item.productId].revenue += item.quantity * item.price
    })
  })

  return Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
})

// Lifecycle
onMounted(() => {
  loading.value = true

  // Listener de productos
  const qProducts = query(productsRef.value, orderBy('name', 'asc'))
  unsubscribeProducts = onSnapshot(
    qProducts,
    (snapshot) => {
      products.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      loading.value = false
    },
    (err) => {
      error.value = err.message
      loading.value = false
    },
  )

  // Listener de ventas
  const qSales = query(salesRef.value, orderBy('date', 'desc'))
  unsubscribeSales = onSnapshot(qSales, (snapshot) => {
    sales.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  })
})

onUnmounted(() => {
  if (unsubscribeProducts) unsubscribeProducts()
  if (unsubscribeSales) unsubscribeSales()
})

// Funciones de productos
const openProductModal = (product = null) => {
  if (product) {
    editingProductId.value = product.id
    productForm.value = { ...product }
  } else {
    editingProductId.value = null
    productForm.value = {
      name: '',
      description: '',
      category: 'dermocosmetics',
      brand: '',
      sku: '',
      price: 0,
      cost: 0,
      stock: 0,
      minStock: 5,
      unit: 'unidad',
      active: true,
    }
  }
  productErrors.value = {}
  showProductModal.value = true
}

const validateProduct = () => {
  const errors = {}
  if (!productForm.value.name?.trim()) errors.name = 'Ingresa el nombre del producto'
  if (!productForm.value.price || productForm.value.price < 0) errors.price = 'Precio inválido'
  if (productForm.value.stock < 0) errors.stock = 'Stock inválido'
  productErrors.value = errors
  return Object.keys(errors).length === 0
}

const saveProduct = async () => {
  if (!validateProduct()) return
  loading.value = true
  try {
    const payload = {
      ...productForm.value,
      updatedAt: serverTimestamp(),
    }

    if (editingProductId.value) {
      await updateDoc(
        doc(db, `businesses/${props.business.id}/products/${editingProductId.value}`),
        payload,
      )
    } else {
      await addDoc(productsRef.value, {
        ...payload,
        createdAt: serverTimestamp(),
      })
    }

    showProductModal.value = false
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const deleteProduct = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return
  loading.value = true
  try {
    await deleteDoc(doc(db, `businesses/${props.business.id}/products/${id}`))
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Funciones de ventas
const openSaleModal = () => {
  saleForm.value = {
    items: [{ productId: '', quantity: 1, price: 0, productName: '' }],
    customerName: '',
    paymentMethod: 'cash',
    appointmentId: '',
    notes: '',
  }
  saleErrors.value = {}
  showSaleModal.value = true
}

const addSaleItem = () => {
  saleForm.value.items.push({ productId: '', quantity: 1, price: 0, productName: '' })
}

const removeSaleItem = (index) => {
  if (saleForm.value.items.length > 1) {
    saleForm.value.items.splice(index, 1)
  }
}

const onProductSelect = (item) => {
  const product = products.value.find((p) => p.id === item.productId)
  if (product) {
    item.price = product.price
    item.productName = product.name
  }
}

const saleTotal = computed(() => {
  return saleForm.value.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
})

const validateSale = () => {
  const errors = {}
  if (saleForm.value.items.length === 0) errors.items = 'Agrega al menos un producto'
  if (saleForm.value.items.some((i) => !i.productId))
    errors.items = 'Selecciona todos los productos'
  saleErrors.value = errors
  return Object.keys(errors).length === 0
}

const saveSale = async () => {
  if (!validateSale()) return
  loading.value = true
  try {
    const saleData = {
      items: saleForm.value.items,
      total: saleTotal.value,
      customerName: saleForm.value.customerName,
      paymentMethod: saleForm.value.paymentMethod,
      appointmentId: saleForm.value.appointmentId || null,
      notes: saleForm.value.notes,
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    }

    await addDoc(salesRef.value, saleData)

    // Actualizar stock de productos
    for (const item of saleForm.value.items) {
      const product = products.value.find((p) => p.id === item.productId)
      if (product) {
        await updateDoc(doc(db, `businesses/${props.business.id}/products/${item.productId}`), {
          stock: product.stock - item.quantity,
        })
      }
    }

    showSaleModal.value = false
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Funciones de inventario
const openInventoryModal = (product) => {
  inventoryForm.value = {
    productId: product.id,
    productName: product.name,
    type: 'in',
    quantity: 0,
    reason: '',
    reference: '',
  }
  showInventoryModal.value = true
}

const saveInventoryMovement = async () => {
  loading.value = true
  try {
    const product = products.value.find((p) => p.id === inventoryForm.value.productId)
    let newStock = product.stock

    if (inventoryForm.value.type === 'in') {
      newStock += inventoryForm.value.quantity
    } else if (inventoryForm.value.type === 'out') {
      newStock -= inventoryForm.value.quantity
    } else {
      newStock = inventoryForm.value.quantity
    }

    await updateDoc(
      doc(db, `businesses/${props.business.id}/products/${inventoryForm.value.productId}`),
      {
        stock: newStock,
      },
    )

    // Registrar movimiento (opcional - puedes crear colección de movimientos)
    showInventoryModal.value = false
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Utilidades
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

const getCategoryLabel = (category) => {
  const labels = {
    dermocosmetics: 'Dermocosméticos',
    treatments: 'Tratamientos',
    accessories: 'Accesorios',
    equipment: 'Equipamiento',
    other: 'Otros',
  }
  return labels[category] || category
}

const getStockStatus = (product) => {
  if (product.stock === 0) return { class: 'danger', text: 'Sin stock' }
  if (product.stock <= product.minStock) return { class: 'warning', text: 'Stock bajo' }
  return { class: 'success', text: 'En stock' }
}
</script>

<template>
  <div class="products-manager">
    <!-- Navegación por tabs -->
    <ul class="nav nav-pills mb-4">
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'products' }"
          @click="activeTab = 'products'"
        >
          <i class="bi bi-box-seam"></i> Productos
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'sales' }"
          @click="activeTab = 'sales'"
        >
          <i class="bi bi-cart"></i> Ventas
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'inventory' }"
          @click="activeTab = 'inventory'"
        >
          <i class="bi bi-boxes"></i> Inventario
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'reports' }"
          @click="activeTab = 'reports'"
        >
          <i class="bi bi-graph-up"></i> Reportes
        </button>
      </li>
    </ul>

    <!-- TAB: PRODUCTOS -->
    <div v-if="activeTab === 'products'">
      <!-- Filtros y acciones -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="form-label small">Buscar</label>
              <input
                v-model="search"
                type="text"
                class="form-control"
                placeholder="Nombre, SKU o marca"
              />
            </div>
            <div class="col-md-3">
              <label class="form-label small">Categoría</label>
              <select v-model="categoryFilter" class="form-select">
                <option value="all">Todas</option>
                <option value="dermocosmetics">Dermocosméticos</option>
                <option value="treatments">Tratamientos</option>
                <option value="accessories">Accesorios</option>
                <option value="equipment">Equipamiento</option>
                <option value="other">Otros</option>
              </select>
            </div>
            <div class="col-md-5 text-md-end">
              <button class="btn btn-primary" @click="openProductModal()">
                <i class="bi bi-plus-circle"></i>
                Nuevo Producto
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Alertas de stock bajo -->
      <div v-if="lowStockProducts.length > 0" class="alert alert-warning mb-4">
        <i class="bi bi-exclamation-triangle"></i>
        <strong>{{ lowStockProducts.length }}</strong> productos con stock bajo
      </div>

      <!-- Lista de productos -->
      <div class="card">
        <div class="card-body p-0">
          <div v-if="loading && products.length === 0" class="p-4 text-center text-muted">
            <span class="spinner-border text-primary"></span>
          </div>
          <div v-else-if="filteredProducts.length === 0" class="p-4 text-center text-muted">
            No hay productos para mostrar
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th class="text-end">Precio</th>
                  <th class="text-center">Stock</th>
                  <th>Estado</th>
                  <th style="width: 150px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in filteredProducts" :key="p.id">
                  <td>
                    <div class="fw-semibold">{{ p.name }}</div>
                    <small class="text-muted">{{ p.description }}</small>
                  </td>
                  <td class="small">{{ p.sku || '—' }}</td>
                  <td>
                    <span class="badge bg-secondary">{{ getCategoryLabel(p.category) }}</span>
                  </td>
                  <td class="small">{{ p.brand || '—' }}</td>
                  <td class="text-end fw-bold">{{ formatCurrency(p.price) }}</td>
                  <td class="text-center">
                    <span :class="['badge', `bg-${getStockStatus(p).class}`]">
                      {{ p.stock }} {{ p.unit }}
                    </span>
                  </td>
                  <td>
                    <span :class="['badge', p.active ? 'bg-success' : 'bg-secondary']">
                      {{ p.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button
                      class="btn btn-sm btn-outline-info me-1"
                      @click="openInventoryModal(p)"
                      title="Ajustar stock"
                    >
                      <i class="bi bi-box"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="openProductModal(p)"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteProduct(p.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: VENTAS -->
    <div v-else-if="activeTab === 'sales'">
      <div class="card mb-4">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Registro de Ventas</h5>
            <button class="btn btn-primary" @click="openSaleModal">
              <i class="bi bi-plus-circle"></i>
              Nueva Venta
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body p-0">
          <div v-if="sales.length === 0" class="p-4 text-center text-muted">
            No hay ventas registradas
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th class="text-end">Total</th>
                  <th>Método</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in sales" :key="s.id">
                  <td class="small">{{ s.date }}</td>
                  <td>{{ s.customerName || '—' }}</td>
                  <td class="small">{{ s.items.length }} producto(s)</td>
                  <td class="text-end fw-bold text-success">{{ formatCurrency(s.total) }}</td>
                  <td class="small text-capitalize">{{ s.paymentMethod }}</td>
                  <td class="small text-muted">{{ s.notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: INVENTARIO -->
    <div v-else-if="activeTab === 'inventory'">
      <div class="row g-4 mb-4">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="text-muted mb-2">Valor de Inventario</h6>
              <h3 class="mb-0 text-primary">{{ formatCurrency(totalInventoryValue) }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="text-muted mb-2">Productos Activos</h6>
              <h3 class="mb-0 text-success">{{ products.filter((p) => p.active).length }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="text-muted mb-2">Stock Bajo</h6>
              <h3 class="mb-0 text-warning">{{ lowStockProducts.length }}</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h6 class="mb-0">Productos con Stock Bajo</h6>
        </div>
        <div class="card-body p-0">
          <div v-if="lowStockProducts.length === 0" class="p-4 text-center text-muted">
            Todos los productos tienen stock suficiente
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Stock Actual</th>
                  <th class="text-center">Stock Mínimo</th>
                  <th style="width: 120px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in lowStockProducts" :key="p.id">
                  <td class="fw-semibold">{{ p.name }}</td>
                  <td class="text-center">
                    <span class="badge bg-warning">{{ p.stock }} {{ p.unit }}</span>
                  </td>
                  <td class="text-center">{{ p.minStock }} {{ p.unit }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-primary" @click="openInventoryModal(p)">
                      <i class="bi bi-plus-circle"></i>
                      Ajustar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: REPORTES -->
    <div v-else-if="activeTab === 'reports'">
      <div class="row g-4 mb-4">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="text-muted mb-2">Ventas Totales</h6>
              <h3 class="mb-0 text-success">{{ formatCurrency(salesStats.total) }}</h3>
              <small class="text-muted">{{ salesStats.count }} transacciones</small>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="text-muted mb-2">Ticket Promedio</h6>
              <h3 class="mb-0 text-info">
                {{
                  salesStats.count > 0 ? formatCurrency(salesStats.total / salesStats.count) : '$0'
                }}
              </h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="text-muted mb-2">Productos Vendidos</h6>
              <h3 class="mb-0 text-primary">
                {{
                  sales.reduce(
                    (sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
                    0,
                  )
                }}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h6 class="mb-0">Top 10 Productos Más Vendidos</h6>
        </div>
        <div class="card-body p-0">
          <div v-if="topSellingProducts.length === 0" class="p-4 text-center text-muted">
            No hay datos de ventas aún
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th class="text-center">Cantidad Vendida</th>
                  <th class="text-end">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in topSellingProducts" :key="item.productId">
                  <td>
                    <span
                      class="badge"
                      :class="
                        index === 0
                          ? 'bg-warning'
                          : index === 1
                            ? 'bg-secondary'
                            : 'bg-light text-dark'
                      "
                    >
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td class="fw-semibold">{{ item.productName }}</td>
                  <td class="text-center">
                    <span class="badge bg-primary">{{ item.quantity }}</span>
                  </td>
                  <td class="text-end fw-bold text-success">{{ formatCurrency(item.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Producto -->
    <div
      v-if="showProductModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingProductId ? 'Editar Producto' : 'Nuevo Producto' }}
            </h5>
            <button type="button" class="btn-close" @click="showProductModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Nombre del Producto</label>
                <input
                  v-model="productForm.name"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': productErrors.name }"
                />
                <div class="invalid-feedback" v-if="productErrors.name">
                  {{ productErrors.name }}
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">SKU</label>
                <input v-model="productForm.sku" type="text" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Descripción</label>
                <textarea
                  v-model="productForm.description"
                  rows="2"
                  class="form-control"
                ></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label">Categoría</label>
                <select v-model="productForm.category" class="form-select">
                  <option value="dermocosmetics">Dermocosméticos</option>
                  <option value="treatments">Tratamientos</option>
                  <option value="accessories">Accesorios</option>
                  <option value="equipment">Equipamiento</option>
                  <option value="other">Otros</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Marca/Laboratorio</label>
                <input v-model="productForm.brand" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Precio de Venta</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    v-model.number="productForm.price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-control"
                    :class="{ 'is-invalid': productErrors.price }"
                  />
                </div>
                <div class="invalid-feedback" v-if="productErrors.price">
                  {{ productErrors.price }}
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Costo</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    v-model.number="productForm.cost"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-control"
                  />
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Unidad</label>
                <select v-model="productForm.unit" class="form-select">
                  <option value="unidad">Unidad</option>
                  <option value="ml">ml</option>
                  <option value="gr">gr</option>
                  <option value="caja">Caja</option>
                  <option value="paquete">Paquete</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Stock Inicial</label>
                <input
                  v-model.number="productForm.stock"
                  type="number"
                  min="0"
                  class="form-control"
                  :class="{ 'is-invalid': productErrors.stock }"
                />
                <div class="invalid-feedback" v-if="productErrors.stock">
                  {{ productErrors.stock }}
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Stock Mínimo (Alerta)</label>
                <input
                  v-model.number="productForm.minStock"
                  type="number"
                  min="0"
                  class="form-control"
                />
              </div>
              <div class="col-12">
                <div class="form-check form-switch">
                  <input
                    v-model="productForm.active"
                    class="form-check-input"
                    type="checkbox"
                    id="productActive"
                  />
                  <label class="form-check-label" for="productActive">Producto activo</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showProductModal = false">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" @click="saveProduct" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Venta -->
    <div
      v-if="showSaleModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nueva Venta de Productos</h5>
            <button type="button" class="btn-close" @click="showSaleModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Cliente (opcional)</label>
              <input
                v-model="saleForm.customerName"
                type="text"
                class="form-control"
                placeholder="Nombre del cliente"
              />
            </div>

            <hr />
            <h6 class="mb-3">Productos</h6>

            <div
              v-for="(item, index) in saleForm.items"
              :key="index"
              class="row g-2 mb-3 align-items-end"
            >
              <div class="col-md-5">
                <label class="form-label small">Producto</label>
                <select
                  v-model="item.productId"
                  @change="onProductSelect(item)"
                  class="form-select"
                >
                  <option value="">Selecciona...</option>
                  <option v-for="p in products.filter((pr) => pr.active)" :key="p.id" :value="p.id">
                    {{ p.name }} (Stock: {{ p.stock }})
                  </option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label small">Cantidad</label>
                <input v-model.number="item.quantity" type="number" min="1" class="form-control" />
              </div>
              <div class="col-md-3">
                <label class="form-label small">Precio</label>
                <input
                  v-model.number="item.price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-control"
                />
              </div>
              <div class="col-md-2">
                <button
                  v-if="saleForm.items.length > 1"
                  type="button"
                  class="btn btn-outline-danger w-100"
                  @click="removeSaleItem(index)"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <button type="button" class="btn btn-outline-primary btn-sm mb-3" @click="addSaleItem">
              <i class="bi bi-plus-circle"></i>
              Agregar Producto
            </button>

            <hr />

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Método de Pago</label>
                <select v-model="saleForm.paymentMethod" class="form-select">
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Total</label>
                <h3 class="text-success">{{ formatCurrency(saleTotal) }}</h3>
              </div>
              <div class="col-12">
                <label class="form-label">Notas</label>
                <textarea v-model="saleForm.notes" rows="2" class="form-control"></textarea>
              </div>
            </div>

            <div v-if="saleErrors.items" class="alert alert-danger mt-3">
              {{ saleErrors.items }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showSaleModal = false">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" @click="saveSale" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Registrar Venta
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Ajuste de Inventario -->
    <div
      v-if="showInventoryModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Ajustar Inventario</h5>
            <button type="button" class="btn-close" @click="showInventoryModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Producto</label>
              <input :value="inventoryForm.productName" type="text" class="form-control" disabled />
            </div>
            <div class="mb-3">
              <label class="form-label">Tipo de Movimiento</label>
              <select v-model="inventoryForm.type" class="form-select">
                <option value="in">Entrada (agregar stock)</option>
                <option value="out">Salida (reducir stock)</option>
                <option value="adjustment">Ajuste (establecer cantidad)</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Cantidad</label>
              <input
                v-model.number="inventoryForm.quantity"
                type="number"
                min="0"
                class="form-control"
              />
              <small class="text-muted">
                {{
                  inventoryForm.type === 'adjustment'
                    ? 'Nueva cantidad total'
                    : 'Cantidad a ' + (inventoryForm.type === 'in' ? 'agregar' : 'quitar')
                }}
              </small>
            </div>
            <div class="mb-3">
              <label class="form-label">Motivo</label>
              <input
                v-model="inventoryForm.reason"
                type="text"
                class="form-control"
                placeholder="Ej: Compra, venta, merma, corrección"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Referencia (opcional)</label>
              <input
                v-model="inventoryForm.reference"
                type="text"
                class="form-control"
                placeholder="Ej: # factura, # pedido"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showInventoryModal = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="saveInventoryMovement"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-manager {
  height: 100%;
}

.nav-pills .nav-link {
  color: #6c757d;
  border-radius: 0.5rem;
  margin-right: 0.5rem;
}

.nav-pills .nav-link:hover {
  background-color: #e9ecef;
}

.nav-pills .nav-link.active {
  background-color: #0d6efd;
}

.card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
}

.card-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
}

.table td,
.table th {
  vertical-align: middle;
}
</style>
