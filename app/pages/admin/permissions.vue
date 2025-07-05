<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Rôles et Permissions</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Gérez les rôles utilisateurs et leurs permissions</p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="activeTab = activeTab === 'roles' ? 'permissions' : 'roles'"
        >
          <Icon :name="activeTab === 'roles' ? 'heroicons:key' : 'heroicons:user-group'" class="w-4 h-4 mr-2" />
          {{ activeTab === 'roles' ? 'Voir permissions' : 'Voir rôles' }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:user-group" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total rôles</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ roles.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:key" class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total permissions</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ permissions.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:link" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Associations</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ totalAssociations }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:shield-check" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Niveau max</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ maxPermissionsRole }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div class="border-b border-gray-200 dark:border-gray-700 px-4">
        <div class="flex space-x-8">
          <button 
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'roles' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
            @click="activeTab = 'roles'"
          >
            <Icon name="heroicons:user-group" class="w-4 h-4 mr-2 inline" />
            Rôles ({{ roles.length }})
          </button>
          <button 
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'permissions' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
            @click="activeTab = 'permissions'"
          >
            <Icon name="heroicons:key" class="w-4 h-4 mr-2 inline" />
            Permissions ({{ permissions.length }})
          </button>
        </div>
      </div>

      <!-- Contenu des onglets -->
      <div class="p-6">
        <!-- Onglet Rôles -->
        <div v-if="activeTab === 'roles'" class="space-y-6">
          <!-- Formulaire de création de rôle -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Créer un nouveau rôle</h3>
            <form class="flex space-x-3" @submit.prevent="createRole">
              <div class="flex-1">
                <input
                  v-model="newRoleName"
                  type="text"
                  placeholder="Nom du rôle (ex: Éditeur, Gestionnaire...)"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
              </div>
              <button
                type="submit"
                class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
                Créer
              </button>
            </form>
          </div>

          <!-- Liste des rôles -->
          <div v-if="roles.length > 0" class="space-y-4">
            <div v-for="role in roles" :key="role.id" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ role.name }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ role.Permissions?.length || 0 }} permission(s) attribuée(s)</p>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    @click="selectRoleForEdit(role)"
                  >
                    <Icon name="heroicons:pencil" class="w-4 h-4 mr-1" />
                    Modifier
                  </button>
                  <button
                    class="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                    @click="confirmDeleteRole(role)"
                  >
                    <Icon name="heroicons:trash" class="w-4 h-4 mr-1" />
                    Supprimer
                  </button>
                </div>
              </div>

              <!-- Permissions du rôle -->
              <div class="mb-4">
                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions actuelles :</h5>
                <div v-if="role.Permissions && role.Permissions.length > 0" class="flex flex-wrap gap-2">
                  <span 
                    v-for="permission in role.Permissions" 
                    :key="permission.id"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  >
                    {{ permission.name }}
                    <button
                      class="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                      @click="removePermission(role.id, permission.id)"
                    >
                      <Icon name="heroicons:x-mark" class="w-3 h-3" />
                    </button>
                  </span>
                </div>
                <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">Aucune permission attribuée</p>
              </div>

              <!-- Formulaire d'ajout de permission -->
              <div class="flex space-x-3">
                <select
                  v-model="rolePermissions[role.id]"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  :disabled="!getAvailablePermissions(role).length"
                >
                  <option value="" disabled>
                    {{ getAvailablePermissions(role).length ? 'Sélectionner une permission à ajouter...' : 'Toutes les permissions sont déjà attribuées' }}
                  </option>
                  <option 
                    v-for="permission in getAvailablePermissions(role)" 
                    :key="permission.id" 
                    :value="permission.id"
                  >
                    {{ permission.name }}
                  </option>
                </select>
                <button
                  class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!rolePermissions[role.id]"
                  @click="addPermissionToRole(role.id)"
                >
                  <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
                  Ajouter
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <Icon name="heroicons:user-group" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">Aucun rôle défini. Créez votre premier rôle ci-dessus.</p>
          </div>
        </div>

        <!-- Onglet Permissions -->
        <div v-else class="space-y-6">
          <!-- Formulaire de création de permission -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Créer une nouvelle permission</h3>
            <form class="flex space-x-3" @submit.prevent="createPermission">
              <div class="flex-1">
                <input
                  v-model="newPermissionName"
                  type="text"
                  placeholder="Nom de la permission (ex: create_user, edit_content...)"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
              </div>
              <button
                type="submit"
                class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
                Créer
              </button>
            </form>
          </div>

          <!-- Liste des permissions -->
          <div v-if="permissions.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="permission in permissions"
              :key="permission.id"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ permission.name }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Utilisée dans {{ getRolesUsingPermission(permission.id).length }} rôle(s)
                  </p>
                  <div v-if="getRolesUsingPermission(permission.id).length > 0" class="mt-2">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="role in getRolesUsingPermission(permission.id)"
                        :key="role.id"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        {{ role.name }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col space-y-2 ml-4">
                  <button
                    class="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    @click="selectPermissionForEdit(permission)"
                  >
                    <Icon name="heroicons:pencil" class="w-3 h-3 mr-1" />
                    Modifier
                  </button>
                  <button
                    class="inline-flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                    @click="confirmDeletePermission(permission)"
                  >
                    <Icon name="heroicons:trash" class="w-3 h-3 mr-1" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <Icon name="heroicons:key" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">Aucune permission définie. Créez votre première permission ci-dessus.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div class="flex items-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600 dark:text-gray-400">Chargement...</span>
        </div>
      </div>
    </div>

    <!-- Modal d'édition de rôle -->
    <div v-if="editingRole" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Modifier le rôle</h3>
        <form @submit.prevent="updateRole">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom du rôle</label>
            <input
              v-model="editingRole.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
          </div>
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="cancelEditRole"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal d'édition de permission -->
    <div v-if="editingPermission" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Modifier la permission</h3>
        <form @submit.prevent="updatePermission">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de la permission</label>
            <input
              v-model="editingPermission.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
          </div>
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="cancelEditPermission"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="confirmDialog.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{{ confirmDialog.title }}</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ confirmDialog.message }}</p>
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="confirmDialog.show = false"
          >
            Annuler
          </button>
          <button
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            @click="confirmDialog.onConfirm"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { toast } from "~/composables/useToast";

// Configuration de la page
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  permission: 'manage_permissions'
});

const { success, error: showError, warning } = toast;

// État
const roles = ref([]);
const permissions = ref([]);
const isLoading = ref(false);
const activeTab = ref('roles');
const newRoleName = ref("");
const newPermissionName = ref("");
const editingRole = ref(null);
const editingPermission = ref(null);
const rolePermissions = ref({});

// Dialog de confirmation
const confirmDialog = ref({
  show: false,
  title: "",
  message: "",
  onConfirm: () => {},
});

// Computed properties
const totalAssociations = computed(() => {
  return roles.value.reduce((total, role) => {
    return total + (role.Permissions?.length || 0);
  }, 0);
});

const maxPermissionsRole = computed(() => {
  if (roles.value.length === 0) return 'N/A';
  const maxPerms = Math.max(...roles.value.map(role => role.Permissions?.length || 0));
  const roleWithMax = roles.value.find(role => (role.Permissions?.length || 0) === maxPerms);
  return roleWithMax ? `${roleWithMax.name} (${maxPerms})` : 'N/A';
});

// Utility functions
const getAvailablePermissions = (role) => {
  const rolePermissionIds = (role.Permissions || []).map(p => p.id);
  return permissions.value.filter(p => !rolePermissionIds.includes(p.id));
};

const getRolesUsingPermission = (permissionId) => {
  return roles.value.filter(role => 
    (role.Permissions || []).some(p => p.id === permissionId)
  );
};

// API functions
const loadData = async () => {
  isLoading.value = true;
  try {
    // Charger les rôles et permissions en parallèle
    const [rolesData, permissionsData] = await Promise.all([
      $fetch("/api/roles"),
      $fetch("/api/permissions")
    ]);
    
    roles.value = rolesData;
    permissions.value = permissionsData;
    
    // Initialiser l'état des permissions par rôle
    roles.value.forEach(role => {
      rolePermissions.value[role.id] = "";
    });
  } catch (error) {
    console.error("Erreur lors du chargement des données :", error);
    showError("Erreur lors du chargement des données");
  } finally {
    isLoading.value = false;
  }
};

// Gestion des rôles
const createRole = async () => {
  if (!newRoleName.value.trim()) return;
  
  try {
    await $fetch("/api/roles", {
      method: "POST",
      body: { name: newRoleName.value.trim() },
    });
    
    newRoleName.value = "";
    await loadData();
    success("Rôle créé avec succès");
  } catch (error) {
    console.error("Erreur lors de la création du rôle :", error);
    showError(error.data?.message || "Erreur lors de la création du rôle");
  }
};

const selectRoleForEdit = (role) => {
  editingRole.value = { ...role };
};

const cancelEditRole = () => {
  editingRole.value = null;
};

const updateRole = async () => {
  if (!editingRole.value) return;
  
  try {
    await $fetch(`/api/roles/${editingRole.value.id}`, {
      method: "PUT",
      body: { name: editingRole.value.name },
    });
    
    editingRole.value = null;
    await loadData();
    success("Rôle mis à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rôle :", error);
    showError(error.data?.message || "Erreur lors de la mise à jour du rôle");
  }
};

const confirmDeleteRole = (role) => {
  confirmDialog.value = {
    show: true,
    title: "Supprimer le rôle",
    message: `Êtes-vous sûr de vouloir supprimer le rôle "${role.name}" ? Cette action est irréversible.`,
    onConfirm: () => deleteRole(role.id),
  };
};

const deleteRole = async (roleId) => {
  try {
    await $fetch(`/api/roles/${roleId}`, {
      method: "DELETE",
    });
    
    confirmDialog.value.show = false;
    await loadData();
    warning("Rôle supprimé avec succès");
  } catch (error) {
    console.error("Erreur lors de la suppression du rôle :", error);
    confirmDialog.value.show = false;
    showError(error.data?.message || "Erreur lors de la suppression du rôle");
  }
};

// Gestion des permissions
const createPermission = async () => {
  if (!newPermissionName.value.trim()) return;
  
  try {
    await $fetch("/api/permissions", {
      method: "POST",
      body: { name: newPermissionName.value.trim() },
    });
    
    newPermissionName.value = "";
    await loadData();
    success("Permission créée avec succès");
  } catch (error) {
    console.error("Erreur lors de la création de la permission :", error);
    showError(error.data?.message || "Erreur lors de la création de la permission");
  }
};

const selectPermissionForEdit = (permission) => {
  editingPermission.value = { ...permission };
};

const cancelEditPermission = () => {
  editingPermission.value = null;
};

const updatePermission = async () => {
  if (!editingPermission.value) return;
  
  try {
    await $fetch(`/api/permissions/${editingPermission.value.id}`, {
      method: "PUT",
      body: { name: editingPermission.value.name },
    });
    
    editingPermission.value = null;
    await loadData();
    success("Permission mise à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la permission :", error);
    showError(error.data?.message || "Erreur lors de la mise à jour de la permission");
  }
};

const confirmDeletePermission = (permission) => {
  confirmDialog.value = {
    show: true,
    title: "Supprimer la permission",
    message: `Êtes-vous sûr de vouloir supprimer la permission "${permission.name}" ? Cette action est irréversible.`,
    onConfirm: () => deletePermission(permission.id),
  };
};

const deletePermission = async (permissionId) => {
  try {
    await $fetch(`/api/permissions/${permissionId}`, {
      method: "DELETE",
    });
    
    confirmDialog.value.show = false;
    await loadData();
    warning("Permission supprimée avec succès");
  } catch (error) {
    console.error("Erreur lors de la suppression de la permission :", error);
    confirmDialog.value.show = false;
    showError(error.data?.message || "Erreur lors de la suppression de la permission");
  }
};

// Gestion des associations rôle-permission
const addPermissionToRole = async (roleId) => {
  const permissionId = rolePermissions.value[roleId];
  if (!permissionId) return;
  
  try {
    await $fetch(`/api/roles/${roleId}/permissions`, {
      method: "POST",
      body: { permissionId },
    });
    
    rolePermissions.value[roleId] = "";
    await loadData();
    success("Permission ajoutée avec succès");
  } catch (error) {
    console.error("Erreur lors de l'ajout de la permission :", error);
    showError(error.data?.message || "Erreur lors de l'ajout de la permission");
  }
};

const removePermission = async (roleId, permissionId) => {
  try {
    await $fetch(`/api/roles/${roleId}/permissions?permissionId=${permissionId}`, {
      method: "DELETE",
    });
    
    await loadData();
    success("Permission retirée avec succès");
  } catch (error) {
    console.error("Erreur lors du retrait de la permission :", error);
    showError(error.data?.message || "Erreur lors du retrait de la permission");
  }
};

onMounted(() => {
  loadData();
});
</script>