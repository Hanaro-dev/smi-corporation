<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700"
        >Nom</label
      >
      <input
        id="name"
        v-model="formData.name"
        placeholder="Nom"
        aria-describedby="name-error"
        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" >
      <span
        v-if="errors.name"
        id="name-error"
        class="text-red-600 text-sm ml-2">
        {{ errors.name }}
      </span>
    </div>
    <div>
      <label for="role" class="block text-sm font-medium text-gray-700"
        >Rôle</label
      >
      <select
        id="role"
        v-model="formData.role_id"
        aria-describedby="role-error"
        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
        <option value="" disabled>Choisissez un rôle</option>
        <option v-for="role in roles" :key="role.id" :value="role.id">
          {{ role.name }}
        </option>
      </select>
      <span
        v-if="errors.role"
        id="role-error"
        class="text-red-600 text-sm ml-2">
        {{ errors.role }}
      </span>
    </div>
    <button
      type="submit"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      {{ submitLabel }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  errors: {
    type: Object,
    default: () => ({})
  },
  submitLabel: {
    type: String,
    default: "Soumettre"
  },
  handleSubmit: {
    type: Function,
    required: true
  },
  roles: {
    type: Array,
    default: () => ([])
  }
});

const formData = ref({ ...props.user });

watch(() => props.user, (newUser) => {
  formData.value = { ...newUser };
}, { deep: true });
</script>
