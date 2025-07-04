<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold">
            {{ userInitials }}
          </div>
          <div>
            <h1 class="text-2xl font-bold">Bienvenue, {{ userName }}</h1>
            <p class="text-blue-100">{{ user?.email }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
v-for="permission in userPermissions" :key="permission" 
                   class="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs font-medium">
                {{ permission }}
              </span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm text-blue-100">Dernière connexion</p>
          <p class="font-medium">{{ formatDate(new Date()) }}</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="stat in stats" :key="stat.title" class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ stat.title }}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stat.value }}</p>
            <div class="flex items-center mt-2">
              <Icon
:name="stat.trend === 'up' ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'" 
                   :class="['w-4 h-4 mr-1', stat.trend === 'up' ? 'text-green-500' : 'text-red-500']" />
              <span :class="['text-sm font-medium', stat.trend === 'up' ? 'text-green-600' : 'text-red-600']">{{ stat.change }}</span>
              <span class="text-sm text-gray-500 ml-1">vs hier</span>
            </div>
          </div>
          <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', stat.bgColor]">
            <Icon :name="stat.icon" :class="['w-6 h-6', stat.iconColor]" />
          </div>
        </div>
      </div>
    </div>

    <!-- Dev Mode Alert -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      <div class="flex items-start">
        <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 class="font-medium text-amber-800 dark:text-amber-200">Mode Développement</h3>
          <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Cette application utilise actuellement une base de données simulée. Certaines fonctionnalités sont limitées en mode développement.
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
v-for="module in quickModules" :key="module.title" 
           class="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
        <div :class="['p-6', module.bgColor]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <Icon :name="module.icon" :class="['w-8 h-8', module.iconColor]" />
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ module.title }}</h3>
            </div>
            <div v-if="module.count" class="text-right">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ module.count }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-400 mb-4">{{ module.description }}</p>
          <div class="flex items-center justify-between">
            <NuxtLink 
              :to="module.link" 
              :class="['inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors', module.buttonClass]"
            >
              {{ module.buttonText }}
              <Icon name="heroicons:arrow-right" class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </NuxtLink>
            <div v-if="module.actions" class="flex space-x-2">
              <button
v-for="action in module.actions" :key="action.name"
                     :class="['p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors', action.class]">
                <Icon :name="action.icon" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Activité Récente</h3>
          <button class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
            Voir tout
          </button>
        </div>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div v-for="activity in recentActivities" :key="activity.id" class="flex items-start space-x-3">
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', activity.bgColor]">
              <Icon :name="activity.icon" :class="['w-4 h-4', activity.iconColor]" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white">
                <span class="font-medium">{{ activity.user }}</span>
                {{ activity.action }}
                <span class="font-medium text-blue-600 dark:text-blue-400">{{ activity.target }}</span>
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const { user } = storeToRefs(auth)

// Computed properties
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

const userPermissions = computed(() => {
  return user.value?.permissions || []
})

// Stats data
const stats = [
  {
    title: 'Utilisateurs',
    value: '24',
    change: '+12%',
    trend: 'up',
    icon: 'heroicons:users',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  {
    title: 'Pages',
    value: '8',
    change: '+2',
    trend: 'up',
    icon: 'heroicons:document-text',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  },
  {
    title: 'Images',
    value: '156',
    change: '+8%',
    trend: 'up',
    icon: 'heroicons:photo',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  {
    title: 'Connexions',
    value: '89',
    change: '+5%',
    trend: 'up',
    icon: 'heroicons:arrow-right-on-rectangle',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20'
  }
]

// Quick modules
const quickModules = [
  {
    title: 'Utilisateurs',
    description: 'Gérer les utilisateurs, leurs rôles et permissions.',
    icon: 'heroicons:users',
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonText: 'Gérer',
    link: '/admin/users',
    count: 24,
    actions: [
      { name: 'add', icon: 'heroicons:plus', class: 'text-blue-600' },
      { name: 'settings', icon: 'heroicons:cog-6-tooth', class: 'text-gray-600' }
    ]
  },
  {
    title: 'Pages',
    description: 'Créer et modifier les pages du site.',
    icon: 'heroicons:document-text',
    iconColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    buttonText: 'Gérer',
    link: '/admin/pages',
    count: 8,
    actions: [
      { name: 'add', icon: 'heroicons:plus', class: 'text-purple-600' },
      { name: 'settings', icon: 'heroicons:cog-6-tooth', class: 'text-gray-600' }
    ]
  },
  {
    title: 'Images',
    description: 'Gérer les images et autres médias.',
    icon: 'heroicons:photo',
    iconColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
    buttonText: 'Gérer',
    link: '/admin/images',
    count: 156,
    actions: [
      { name: 'upload', icon: 'heroicons:arrow-up-tray', class: 'text-green-600' },
      { name: 'settings', icon: 'heroicons:cog-6-tooth', class: 'text-gray-600' }
    ]
  }
]

// Recent activities
const recentActivities = [
  {
    id: 1,
    user: 'Admin',
    action: 'a créé une nouvelle page',
    target: 'Accueil',
    time: 'Il y a 2 minutes',
    icon: 'heroicons:document-plus',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  {
    id: 2,
    user: 'John Doe',
    action: 'a modifié son profil',
    target: '',
    time: 'Il y a 15 minutes',
    icon: 'heroicons:user',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  {
    id: 3,
    user: 'Admin',
    action: 'a ajouté une image à',
    target: 'Galerie',
    time: 'Il y a 1 heure',
    icon: 'heroicons:photo',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  },
  {
    id: 4,
    user: 'Jane Smith',
    action: 's’est connectée',
    target: '',
    time: 'Il y a 2 heures',
    icon: 'heroicons:arrow-right-on-rectangle',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20'
  }
]

// Utility functions
const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>