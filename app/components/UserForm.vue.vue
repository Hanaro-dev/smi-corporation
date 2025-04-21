<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="user.name" placeholder="Nom" />
      <span v-if="errors.name" class="text-red-600 text-sm ml-2">{{
        errors.name
      }}</span>
    </div>
    <div>
      <label for="role">Rôle</label>
      <select v-model="user.role">
        <option value="" disabled>Choisissez un rôle</option>
        <option value="admin">Admin</option>
        <option value="editor">Éditeur</option>
        <option value="viewer">Lecteur</option>
      </select>
      <span v-if="errors.role" class="text-red-600 text-sm ml-2">{{
        errors.role
      }}</span>
    </div>
    <button type="submit">{{ submitLabel }}</button>
  </form>
</template>

<script setup>
defineProps(["user", "errors", "submitLabel", "handleSubmit"]);
</script>

<style></style>
