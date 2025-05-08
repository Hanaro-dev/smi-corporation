<template>
  <div>
    <h1>Gestion des Permissions</h1>
    <form @submit.prevent="assignPermission">
      <div>
        <label for="role">Rôle</label>
        <select v-model="selectedRole" id="role">
          <option value="" disabled>Choisissez un rôle</option>
          <option v-for="role in roles" :key="role.id" :value="role.name">
            {{ role.name }}
          </option>
        </select>
      </div>
      <div>
        <label for="permission">Permission</label>
        <select v-model="selectedPermission" id="permission">
          <option value="" disabled>Choisissez une permission</option>
          <option v-for="permission in permissions" :key="permission.id" :value="permission.name">
            {{ permission.name }}
          </option>
        </select>
      </div>
      <button type="submit">Attribuer</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success">{{ successMessage }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const roles = ref([]);
const permissions = ref([]);
const selectedRole = ref("");
const selectedPermission = ref("");
const errorMessage = ref("");
const successMessage = ref("");

onMounted(async () => {
  try {
    roles.value = await $fetch("/api/roles");
    permissions.value = await $fetch("/api/permissions");
    await sequelize.sync({ alter: true });
  } catch (error) {
    console.error("Erreur lors du chargement des données :", error);
  }
});

const assignPermission = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!selectedRole.value || !selectedPermission.value) {
    errorMessage.value = "Veuillez sélectionner un rôle et une permission.";
    return;
  }

  try {
    const roleInstance = await Role.findOne({ where: { name: selectedRole.value } });
    if (!roleInstance) {
      return sendError(
        event,
        createError({
          statusCode: 404,
          statusMessage: `Le rôle "${role}" est introuvable.`,
        })
      );
    }
    const permissionInstance = await Permission.findOne({ where: { name: selectedPermission.value } });

    const hasPermission = await roleInstance.hasPermission(permissionInstance);
    if (hasPermission) {
      errorMessage.value = `La permission "${selectedPermission.value}" est déjà attribuée au rôle "${selectedRole.value}".`;
      return;
    }

    await $fetch("/api/roles/assign-permission", {
      method: "POST",
      body: {
        role: selectedRole.value,
        permission: selectedPermission.value,
      },
    });
    successMessage.value = "Permission attribuée avec succès !";
  } catch (error) {
    console.error("Erreur lors de l'attribution de la permission :", error);
    errorMessage.value = "Erreur lors de l'attribution de la permission.";
  }
};
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
.error {
  color: red;
}
.success {
  color: green;
}
</style>
