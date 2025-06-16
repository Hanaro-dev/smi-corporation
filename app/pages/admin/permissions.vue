<template>
  <div class="permissions-manager">
    <h1>Gestion des Rôles et Permissions</h1>
    
    <div class="container">
      <!-- Gestion des rôles -->
      <div class="roles-section">
        <h2>Rôles</h2>
        
        <!-- Formulaire de création de rôle -->
        <div class="card">
          <h3>Créer un nouveau rôle</h3>
          <form @submit.prevent="createRole">
            <div class="form-group">
              <label for="newRoleName">Nom du rôle</label>
              <input 
                id="newRoleName" 
                v-model="newRoleName" 
                required 
                placeholder="Ex: Éditeur, Gestionnaire..."
              />
            </div>
            <button type="submit" class="btn primary">Créer</button>
          </form>
        </div>
        
        <!-- Liste des rôles existants -->
        <div class="card" v-if="roles.length > 0">
          <h3>Rôles existants</h3>
          <div v-for="role in roles" :key="role.id" class="role-item">
            <div class="role-header">
              <h4>{{ role.name }}</h4>
              <div class="role-actions">
                <button @click="selectRoleForEdit(role)" class="btn small">Modifier</button>
                <button @click="confirmDeleteRole(role)" class="btn small danger">Supprimer</button>
              </div>
            </div>
            
            <!-- Liste des permissions du rôle -->
            <div class="permissions-list">
              <h5>Permissions:</h5>
              <div v-if="role.Permissions && role.Permissions.length > 0" class="permission-tags">
                <span v-for="permission in role.Permissions" :key="permission.id" class="permission-tag">
                  {{ permission.name }}
                  <button @click="removePermission(role.id, permission.id)" class="remove-permission">&times;</button>
                </span>
              </div>
              <p v-else class="no-items">Aucune permission</p>
            </div>
            
            <!-- Formulaire d'ajout de permission -->
            <div class="add-permission-form">
              <select v-model="rolePermissions[role.id]" :disabled="!permissions.length">
                <option value="" disabled>Ajouter une permission...</option>
                <option 
                  v-for="permission in getAvailablePermissions(role)" 
                  :key="permission.id" 
                  :value="permission.id"
                >
                  {{ permission.name }}
                </option>
              </select>
              <button 
                @click="addPermissionToRole(role.id)" 
                class="btn small" 
                :disabled="!rolePermissions[role.id]"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
        <p v-else class="no-items">Aucun rôle défini</p>
      </div>
      
      <!-- Gestion des permissions -->
      <div class="permissions-section">
        <h2>Permissions</h2>
        
        <!-- Formulaire de création de permission -->
        <div class="card">
          <h3>Créer une nouvelle permission</h3>
          <form @submit.prevent="createPermission">
            <div class="form-group">
              <label for="newPermissionName">Nom de la permission</label>
              <input 
                id="newPermissionName" 
                v-model="newPermissionName" 
                required 
                placeholder="Ex: create_user, edit_content..."
              />
            </div>
            <button type="submit" class="btn primary">Créer</button>
          </form>
        </div>
        
        <!-- Liste des permissions existantes -->
        <div class="card" v-if="permissions.length > 0">
          <h3>Permissions existantes</h3>
          <div v-for="permission in permissions" :key="permission.id" class="permission-item">
            <div class="permission-name">{{ permission.name }}</div>
            <div class="permission-actions">
              <button @click="selectPermissionForEdit(permission)" class="btn small">Modifier</button>
              <button @click="confirmDeletePermission(permission)" class="btn small danger">Supprimer</button>
            </div>
          </div>
        </div>
        <p v-else class="no-items">Aucune permission définie</p>
      </div>
    </div>
    
    <!-- Modals -->
    <div v-if="editingRole" class="modal">
      <div class="modal-content">
        <h3>Modifier le rôle</h3>
        <form @submit.prevent="updateRole">
          <div class="form-group">
            <label for="editRoleName">Nom du rôle</label>
            <input id="editRoleName" v-model="editingRole.name" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="cancelEditRole">Annuler</button>
            <button type="submit" class="btn primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
    
    <div v-if="editingPermission" class="modal">
      <div class="modal-content">
        <h3>Modifier la permission</h3>
        <form @submit.prevent="updatePermission">
          <div class="form-group">
            <label for="editPermissionName">Nom de la permission</label>
            <input id="editPermissionName" v-model="editingPermission.name" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="cancelEditPermission">Annuler</button>
            <button type="submit" class="btn primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
    
    <div v-if="confirmDialog.show" class="modal">
      <div class="modal-content">
        <h3>{{ confirmDialog.title }}</h3>
        <p>{{ confirmDialog.message }}</p>
        <div class="modal-actions">
          <button type="button" class="btn" @click="confirmDialog.show = false">Annuler</button>
          <button type="button" class="btn danger" @click="confirmDialog.onConfirm">Confirmer</button>
        </div>
      </div>
    </div>
    
    <!-- Notifications -->
    <div v-if="notification.show" :class="['notification', notification.type]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAppToast } from '@/composables/useAppToast';

// État de l'application
const roles = ref([]);
const permissions = ref([]);
const newRoleName = ref("");
const newPermissionName = ref("");
const editingRole = ref(null);
const editingPermission = ref(null);
const rolePermissions = ref({});
const { showToast } = useAppToast();

// Gestion des notifications et confirmations
const notification = ref({ show: false, message: "", type: "info" });
const confirmDialog = ref({
  show: false,
  title: "",
  message: "",
  onConfirm: () => {},
});

// Charger les données
onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  try {
    // Charger les rôles avec leurs permissions
    const rolesData = await $fetch("/api/roles");
    roles.value = rolesData;
    
    // Charger les permissions disponibles
    const permissionsData = await $fetch("/api/permissions");
    permissions.value = permissionsData;
    
    // Initialiser l'état des permissions par rôle
    roles.value.forEach(role => {
      rolePermissions.value[role.id] = "";
    });
  } catch (error) {
    console.error("Erreur lors du chargement des données :", error);
    showNotification("Erreur lors du chargement des données", "error");
  }
};

// Gestion des rôles
const createRole = async () => {
  if (!newRoleName.value) return;
  
  try {
    await $fetch("/api/roles", {
      method: "POST",
      body: { name: newRoleName.value },
    });
    
    newRoleName.value = "";
    await loadData();
    showNotification("Rôle créé avec succès", "success");
  } catch (error) {
    console.error("Erreur lors de la création du rôle :", error);
    showNotification("Erreur lors de la création du rôle", "error");
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
    showNotification("Rôle mis à jour avec succès", "success");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rôle :", error);
    showNotification("Erreur lors de la mise à jour du rôle", "error");
  }
};

const confirmDeleteRole = (role) => {
  confirmDialog.value = {
    show: true,
    title: "Supprimer le rôle",
    message: `Êtes-vous sûr de vouloir supprimer le rôle "${role.name}" ?`,
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
    showNotification("Rôle supprimé avec succès", "success");
  } catch (error) {
    console.error("Erreur lors de la suppression du rôle :", error);
    confirmDialog.value.show = false;
    
    if (error.response && error.response.status === 409) {
      showNotification("Ce rôle est attribué à des utilisateurs et ne peut pas être supprimé", "error");
    } else {
      showNotification("Erreur lors de la suppression du rôle", "error");
    }
  }
};

// Gestion des permissions
const createPermission = async () => {
  if (!newPermissionName.value) return;
  
  try {
    await $fetch("/api/permissions", {
      method: "POST",
      body: { name: newPermissionName.value },
    });
    
    newPermissionName.value = "";
    await loadData();
    showNotification("Permission créée avec succès", "success");
  } catch (error) {
    console.error("Erreur lors de la création de la permission :", error);
    showNotification("Erreur lors de la création de la permission", "error");
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
    showNotification("Permission mise à jour avec succès", "success");
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la permission :", error);
    showNotification("Erreur lors de la mise à jour de la permission", "error");
  }
};

const confirmDeletePermission = (permission) => {
  confirmDialog.value = {
    show: true,
    title: "Supprimer la permission",
    message: `Êtes-vous sûr de vouloir supprimer la permission "${permission.name}" ?`,
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
    showNotification("Permission supprimée avec succès", "success");
  } catch (error) {
    console.error("Erreur lors de la suppression de la permission :", error);
    confirmDialog.value.show = false;
    
    if (error.response && error.response.status === 409) {
      showNotification("Cette permission est attribuée à des rôles et ne peut pas être supprimée", "error");
    } else {
      showNotification("Erreur lors de la suppression de la permission", "error");
    }
  }
};

// Gestion des permissions des rôles
const getAvailablePermissions = (role) => {
  // Filtrer les permissions qui ne sont pas déjà attribuées au rôle
  const rolePermissionIds = (role.Permissions || []).map(p => p.id);
  return permissions.value.filter(p => !rolePermissionIds.includes(p.id));
};

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
    showNotification("Permission ajoutée avec succès", "success");
  } catch (error) {
    console.error("Erreur lors de l'ajout de la permission :", error);
    showNotification("Erreur lors de l'ajout de la permission", "error");
  }
};

const removePermission = async (roleId, permissionId) => {
  try {
    await $fetch(`/api/roles/${roleId}/permissions?permissionId=${permissionId}`, {
      method: "DELETE",
    });
    
    await loadData();
    showNotification("Permission retirée avec succès", "success");
  } catch (error) {
    console.error("Erreur lors du retrait de la permission :", error);
    showNotification("Erreur lors du retrait de la permission", "error");
  }
};

// Notifications
const showNotification = (message, type = "info") => {
  notification.value = { show: true, message, type };
  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
  
  // Utiliser aussi le toast du système
  showToast(message, type);
};
</script>

<style scoped>
.permissions-manager {
  padding: 1rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 0.5rem;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn {
  background-color: #f0f0f0;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #e0e0e0;
}

.btn.primary {
  background-color: #4caf50;
  color: white;
}

.btn.primary:hover {
  background-color: #3e8e41;
}

.btn.danger {
  background-color: #f44336;
  color: white;
}

.btn.danger:hover {
  background-color: #d32f2f;
}

.btn.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.role-item, .permission-item {
  border-bottom: 1px solid #eaeaea;
  padding: 1rem 0;
}

.role-item:last-child, .permission-item:last-child {
  border-bottom: none;
}

.role-header, .permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-actions, .permission-actions {
  display: flex;
  gap: 0.5rem;
}

.permissions-list {
  margin: 0.75rem 0;
  padding-left: 1rem;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.permission-tag {
  background-color: #e0f2f1;
  color: #00796b;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
}

.remove-permission {
  background: none;
  border: none;
  color: #00796b;
  margin-left: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-permission-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  align-items: center;
}

.add-permission-form select {
  flex: 1;
}

.no-items {
  color: #888;
  font-style: italic;
  margin: 0.5rem 0;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.notification {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 1rem;
  border-radius: 4px;
  color: white;
  max-width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
  z-index: 1001;
}

.notification.success {
  background-color: #4caf50;
}

.notification.error {
  background-color: #f44336;
}

.notification.info {
  background-color: #2196f3;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(30px); }
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
}
</style>
