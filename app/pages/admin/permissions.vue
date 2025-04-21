<template>
  <div>
    <h1>Gestion des Permissions</h1>
    <p>Attribuez des permissions aux rôles existants.</p>

    <form @submit.prevent="assignPermission">
      <div>
        <label for="role">Rôle</label>
        <select v-model="selectedRole">
          <option value="" disabled>Choisissez un rôle</option>
          <option v-for="role in roles" :key="role.id" :value="role.name">
            {{ role.name }}
          </option>
        </select>
      </div>

      <div>
        <label for="permission">Permission</label>
        <select v-model="selectedPermission">
          <option value="" disabled>Choisissez une permission</option>
          <option
            v-for="permission in permissions"
            :key="permission.id"
            :value="permission.name">
            {{ permission.name }}
          </option>
        </select>
      </div>

      <button type="submit">Attribuer</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const roles = ref([]);
const permissions = ref([]);
const selectedRole = ref("");
const selectedPermission = ref("");

onMounted(async () => {
  try {
    roles.value = await $fetch("/api/roles");
    permissions.value = await $fetch("/api/permissions");
  } catch (error) {
    console.error("Erreur lors du chargement des données :", error);
  }
});

const assignPermission = async () => {
  if (!selectedRole.value || !selectedPermission.value) {
    alert("Veuillez sélectionner un rôle et une permission.");
    return;
  }

  try {
    await $fetch("/api/roles/assign-permission", {
      method: "POST",
      body: {
        role: selectedRole.value,
        permission: selectedPermission.value,
      },
    });
    alert("Permission attribuée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'attribution de la permission :", error);
    alert("Erreur lors de l'attribution de la permission.");
  }
};
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
</style>
