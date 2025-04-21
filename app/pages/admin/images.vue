<template>
  <div>
    <h1>Gestion des Images</h1>
    <p>Ajoutez ou supprimez des images utilisées sur le site.</p>
    <h2 class="text-lg font-semibold mb-2">Uploader une image</h2>
    <form class="flex items-center gap-2 mb-4" @submit.prevent="uploadImage">
      <input
        type="file"
        accept="image/*"
        class="block"
        @change="onFileChange"
      />
      <button
        type="submit"
        class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Envoyer
      </button>
    </form>
    <div v-if="imageUrl" class="flex flex-col items-start gap-2">
      <img
        :src="imageUrl"
        alt="Image uploadée"
        class="max-w-xs rounded shadow"
      />
      <button
        class="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        @click="deleteImage"
      >
        Supprimer
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useToast } from "~/composables/useAppToast";

const file = ref(null);
const imageUrl = ref("");
const { addToast } = useToast();

const onFileChange = (e) => {
  file.value = e.target.files[0];
};

const uploadImage = async () => {
  const formData = new FormData();
  formData.append("image", file.value);
  try {
    const res = await $fetch("/api/images", {
      method: "POST",
      body: formData,
    });
    imageUrl.value = res.url;
  } catch (e) {
    console.error(e);
  }
};

const deleteImage = async () => {
  try {
    await axios.delete("/api/images", { data: { url: imageUrl.value } });
    imageUrl.value = "";
    addToast("Image supprimée.", "warning", 4000);
  } catch (e) {
    addToast("Erreur lors de la suppression.", "error", 4000);
  }
};
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
</style>
