<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <aside 
      :class="[
        'transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      ]"
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <!-- Logo toujours visible -->
          <div class="flex items-center" :class="sidebarCollapsed ? 'justify-center w-full' : 'space-x-3'">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="text-white font-bold text-sm">SMI</span>
            </div>
            <span v-if="!sidebarCollapsed" class="font-semibold text-gray-800 dark:text-gray-200">Administration</span>
          </div>
          <button 
            v-if="!sidebarCollapsed"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="toggleSidebar"
          >
            <Icon name="heroicons:chevron-left" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-2">
        <div v-for="item in menuItems" :key="item.to" class="relative">
          <NuxtLink
            :to="item.to"
            :class="[
              'group flex items-center rounded-lg text-sm font-medium transition-all duration-200',
              sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-2.5',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            ]"
            active-class="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
            inactive-class="text-gray-700 dark:text-gray-300"
          >
            <Icon :name="item.icon" :class="['transition-all duration-200', sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3']" />
            <span v-if="!sidebarCollapsed" class="truncate">{{ item.label }}</span>
            <div v-if="item.badge && !sidebarCollapsed" class="ml-auto">
              <span class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{{ item.badge }}</span>
            </div>
          </NuxtLink>
          
          <!-- Tooltip pour mode collapsed -->
          <div v-if="sidebarCollapsed" class="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div class="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              {{ item.label }}
              <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"/>
            </div>
          </div>
        </div>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="space-y-2">
          <NuxtLink
            to="/admin/profile"
            :class="[
              'group flex items-center rounded-lg text-sm font-medium transition-colors',
              sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-2',
              'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            ]"
          >
            <Icon name="heroicons:user-circle" :class="['transition-all duration-200', sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3']" />
            <span v-if="!sidebarCollapsed">Profil</span>
          </NuxtLink>
          
          <button
            :class="[
              'group flex items-center w-full rounded-lg text-sm font-medium transition-colors',
              sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-2',
              'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
            ]"
            @click="logout"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" :class="['transition-all duration-200', sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3']" />
            <span v-if="!sidebarCollapsed">Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Floating toggle button when collapsed -->
      <button 
        v-if="sidebarCollapsed"
        class="absolute left-4 top-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
        @click="toggleSidebar"
      >
        <Icon name="heroicons:bars-3" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
      
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Breadcrumb -->
          <nav class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400" :class="sidebarCollapsed ? 'ml-14' : ''">
            <NuxtLink to="/admin" class="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Administration
            </NuxtLink>
            <Icon name="heroicons:chevron-right" class="w-4 h-4" />
            <span class="text-gray-900 dark:text-gray-200 font-medium">{{ currentPageTitle }}</span>
          </nav>

          <!-- User Info -->
          <div class="flex items-center space-x-4">
            <!-- Theme Selector -->
            <ThemeSelector />
            
            <!-- Notifications -->
            <button class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="heroicons:bell" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"/>
            </button>
            
            <!-- User Avatar -->
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span class="text-white font-medium text-sm">{{ userInitials }}</span>
              </div>
              <div class="hidden md:block">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ userName }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ userRole }}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
    
    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import ThemeSelector from '~/components/ThemeSelector.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { user } = storeToRefs(auth)

// Sidebar state - collapsed by default
const sidebarCollapsed = ref(true)

// Load saved state from localStorage
onMounted(() => {
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true'
  }
})

// Menu items
const menuItems = [
  {
    to: '/admin',
    label: 'Tableau de bord',
    icon: 'heroicons:home',
    badge: null
  },
  {
    to: '/admin/pages',
    label: 'Pages',
    icon: 'heroicons:document-text',
    badge: null
  },
  {
    to: '/admin/users',
    label: 'Utilisateurs',
    icon: 'heroicons:users',
    badge: null
  },
  {
    to: '/admin/permissions',
    label: 'Permissions',
    icon: 'heroicons:shield-check',
    badge: null
  },
  {
    to: '/admin/organigrammes',
    label: 'Organigrammes',
    icon: 'heroicons:building-office',
    badge: null
  },
  {
    to: '/admin/images',
    label: 'Images',
    icon: 'heroicons:photo',
    badge: null
  }
]

// Computed properties
const currentPageTitle = computed(() => {
  const currentItem = menuItems.find(item => item.to === route.path)
  return currentItem?.label || 'Page'
})

const userInitials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
})

const userName = computed(() => {
  return user.value?.name || user.value?.username || 'Utilisateur'
})

const userRole = computed(() => {
  return user.value?.role || 'Administrateur'
})

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  // Save state to localStorage
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
}

const logout = async () => {
  await auth.logout()
  router.push('/auth/login')
}
</script>

<style scoped>
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

/* Animation pour le tooltip */
.group:hover div[class*="opacity-0"] {
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
}

/* Smooth transitions */
* {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>