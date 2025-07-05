<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Gérez les comptes utilisateurs et leurs permissions</p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="exportUsers"
        >
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 mr-2" />
          Exporter
        </button>
        <button
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          @click="showCreateForm = true"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:users" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total utilisateurs</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ totalUsers }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ activeUsers }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:shield-check" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Administrateurs</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ adminUsers }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:clock" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Dernière connexion</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatLastLogin() }}</p>
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
            Cette application utilise actuellement une base de données simulée. Certaines fonctionnalités comme la suppression et la modification d'utilisateurs sont limitées.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Search and filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div class="flex flex-col lg:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un utilisateur..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <select
            v-model="roleFilter"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateur</option>
            <option value="editor">Editeur</option>
            <option value="user">Utilisateur</option>
          </select>
          <select
            v-model="statusFilter"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
          <button
            class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            @click="clearFilters"
          >
            Effacer
          </button>
        </div>
      </div>
    </div>

    <!-- Users table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liste des utilisateurs</h3>
      </div>
      
      <div v-if="isLoading" class="p-8 text-center">
        <div class="inline-flex items-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"/>
          <span class="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
        </div>
      </div>
      
      <div v-else-if="errorMessage" class="p-4">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-center">
            <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <span class="text-red-800 dark:text-red-200">{{ errorMessage }}</span>
          </div>
        </div>
      </div>
      
      <div v-else-if="filteredUsers.length === 0" class="p-8 text-center">
        <Icon name="heroicons:users" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400">Aucun utilisateur ne correspond à vos critères</p>
      </div>
      
      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div v-for="user in filteredUsers" :key="user.id" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span class="text-white font-medium text-sm">{{ getUserInitials(user.name) }}</span>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ user.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                <div class="flex items-center space-x-2 mt-1">
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="getRoleClass(user.Role?.name || 'user')"
                  >
                    <Icon :name="getRoleIcon(user.Role?.name || 'user')" class="w-3 h-3 mr-1" />
                    {{ user.Role?.name || 'user' }}
                  </span>
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="user.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'"
                  >
                    <div :class="['w-2 h-2 rounded-full mr-1', user.status === 'active' ? 'bg-green-500' : 'bg-gray-400']"/>
                    {{ user.status === 'active' ? 'Actif' : 'Inactif' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500 dark:text-gray-400 mr-4">
                Dernière connexion: {{ formatDate(user.lastLogin) }}
              </span>
              <button
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                @click="editUser(user)"
              >
                <Icon name="heroicons:pencil" class="w-4 h-4 mr-1" />
                Modifier
              </button>
              <button
                class="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                @click="confirmDeleteUser(user)"
              >
                <Icon name="heroicons:trash" class="w-4 h-4 mr-1" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalUsers > itemsPerPage" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Affichage de {{ (currentPage - 1) * itemsPerPage + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalUsers) }} sur {{ totalUsers }} utilisateurs
          </div>
          <div class="flex items-center space-x-2">
            <button
              :disabled="currentPage === 1"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="currentPage--"
            >
              <Icon name="heroicons:chevron-left" class="w-4 h-4" />
            </button>
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ currentPage }} / {{ totalPages }}</span>
            <button
              :disabled="currentPage >= totalPages"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="currentPage++"
            >
              <Icon name="heroicons:chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition d'utilisateur -->
    <div v-if="showCreateForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {{ selectedUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur' }}
        </h3>
        
        <form class="space-y-4" @submit.prevent="selectedUser ? updateUser() : validateAndCreateUser()">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              :class="{ 'border-red-500': errors.name }"
            >
            <span v-if="errors.name" class="text-red-500 text-sm">{{ errors.name }}</span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              v-model="formData.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              :class="{ 'border-red-500': errors.email }"
            >
            <span v-if="errors.email" class="text-red-500 text-sm">{{ errors.email }}</span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle</label>
            <select
              v-model="formData.role_id"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              :class="{ 'border-red-500': errors.role_id }"
            >
              <option :value="3">Utilisateur</option>
              <option :value="2">Editeur</option>
              <option :value="1">Administrateur</option>
            </select>
            <span v-if="errors.role_id" class="text-red-500 text-sm">{{ errors.role_id }}</span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
            <select
              v-model="formData.status"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
          
          <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <span class="text-red-800 dark:text-red-200 text-sm">{{ errorMessage }}</span>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="showCreateForm = false; selectedUser = null; formData = { name: '', email: '', role_id: 3, status: 'active' }; errors = {}; errorMessage = ''"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {{ selectedUser ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirmer la suppression</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ userToDelete?.name }}</strong> ? Cette action est irréversible.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="showDeleteConfirm = false; userToDelete = null"
          >
            Annuler
          </button>
          <button
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            @click="deleteUser(userToDelete?.id)"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useApi } from "~/composables/useApi";

// Configuration de la page
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  permission: 'manage_users'
});

const users = ref([]);
const totalUsers = ref(0);
const currentPage = ref(1);
const itemsPerPage = 10;
const isLoading = ref(false);
const showCreateForm = ref(false);
const showDeleteConfirm = ref(false);
const selectedUser = ref(null);
const userToDelete = ref(null);
const newUser = ref({ name: "", email: "", role_id: 3, status: "active" });
const errors = ref({});
const errorMessage = ref("");

// Filtres et recherche
const searchQuery = ref('');
const roleFilter = ref('all');
const statusFilter = ref('all');

// API composable
const api = useApi();

// Form data refs
const formData = ref({
  name: '',
  email: '',
  role_id: 3, // 3 = user role
  status: 'active'
});

// Watch pour synchroniser les données du formulaire
watch(selectedUser, (user) => {
  if (user) {
    formData.value = {
      name: user.name || '',
      email: user.email || '',
      role_id: user.role_id || 3,
      status: user.status || 'active'
    };
  } else {
    formData.value = {
      name: newUser.value.name,
      email: newUser.value.email,
      role_id: newUser.value.role_id,
      status: newUser.value.status
    };
  }
}, { immediate: true });

watch(showCreateForm, (isShowing) => {
  if (isShowing && !selectedUser.value) {
    formData.value = {
      name: newUser.value.name,
      email: newUser.value.email,
      role_id: newUser.value.role_id,
      status: newUser.value.status
    };
  }
});

// Computed properties
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }
  
  // Filtrer par rôle
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter(user => user.Role?.name === roleFilter.value);
  }
  
  // Filtrer par statut
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(user => user.status === statusFilter.value);
  }
  
  return filtered;
});

const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage));
const activeUsers = computed(() => users.value.filter(u => u.status === 'active').length);
const adminUsers = computed(() => users.value.filter(u => u.Role?.name === 'admin').length);

// Utility functions
const getUserInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
};

const getRoleClass = (role) => {
  const classes = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    editor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  };
  return classes[role] || classes.user;
};

const getRoleIcon = (role) => {
  const icons = {
    admin: 'heroicons:shield-check',
    editor: 'heroicons:pencil-square',
    user: 'heroicons:user'
  };
  return icons[role] || icons.user;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Jamais';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const formatLastLogin = () => {
  const lastLogins = users.value.map(u => u.lastLogin).filter(Boolean);
  if (lastLogins.length === 0) return 'Aucune';
  const latest = Math.max(...lastLogins.map(d => new Date(d).getTime()));
  return formatDate(new Date(latest));
};

const clearFilters = () => {
  searchQuery.value = '';
  roleFilter.value = 'all';
  statusFilter.value = 'all';
};

// API functions
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const res = await api.get(
      `/api/users?page=${currentPage.value}&limit=${itemsPerPage}`
    );
    users.value = res.users;
    totalUsers.value = res.total;
  } catch (error) {
    console.error("Erreur lors du chargement des utilisateurs :", error);
    errorMessage.value = "Erreur lors du chargement des utilisateurs.";
  } finally {
    isLoading.value = false;
  }
};

const validateAndCreateUser = async () => {
  try {
    const userData = {
      name: formData.value.name,
      email: formData.value.email,
      role_id: formData.value.role_id,
      status: formData.value.status
    };
    
    await api.post('/api/users', userData);
    
    // Succès
    await fetchUsers();
    showCreateForm.value = false;
    selectedUser.value = null;
    formData.value = { name: "", email: "", role_id: 3, status: "active" };
    newUser.value = { name: "", email: "", role_id: 3, status: "active" };
    errors.value = {};
    errorMessage.value = "";
    
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    if (error.data?.errors) {
      errors.value = error.data.errors;
    } else {
      errorMessage.value = error.data?.message || "Erreur lors de la création de l'utilisateur.";
    }
  }
};

const updateUser = async () => {
  if (!selectedUser.value || !selectedUser.value.id) {
    console.error("Aucun utilisateur sélectionné ou ID manquant");
    errorMessage.value = "Erreur : aucun utilisateur sélectionné";
    return;
  }
  
  try {
    const userId = selectedUser.value.id; // Capturer l'ID avant toute opération async
    const userData = {
      name: formData.value.name,
      email: formData.value.email,
      role_id: formData.value.role_id,
      status: formData.value.status
    };
    
    await api.put(`/api/users/${userId}`, userData);
    
    // Succès
    await fetchUsers();
    showCreateForm.value = false;
    selectedUser.value = null;
    formData.value = { name: "", email: "", role_id: 3, status: "active" };
    errors.value = {};
    errorMessage.value = "";
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    if (error.data?.errors) {
      errors.value = error.data.errors;
    } else {
      errorMessage.value = error.data?.message || "Erreur lors de la mise à jour de l'utilisateur.";
    }
  }
};

const editUser = (user) => {
  selectedUser.value = user;
  showCreateForm.value = true;
};

const confirmDeleteUser = (user) => {
  userToDelete.value = user;
  showDeleteConfirm.value = true;
};

const deleteUser = async (id) => {
  try {
    await api.delete(`/api/users/${id}`);
    await fetchUsers();
    showDeleteConfirm.value = false;
    userToDelete.value = null;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur :", error);
    errorMessage.value = "Erreur lors de la suppression de l'utilisateur.";
  }
};

const exportUsers = () => {
  // Export functionality
  const csv = users.value.map(u => `${u.name},${u.email},${u.Role?.name || 'user'},${u.status}`).join('\n');
  const blob = new Blob(['Name,Email,Role,Status\n' + csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users.csv';
  a.click();
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
button {
  margin-left: 1rem;
}
.error {
  color: red;
  font-size: 0.875rem;
  margin-left: 0.5rem;
}
</style>
