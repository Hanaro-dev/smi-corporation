<template>
  <div class="max-w-4xl mx-auto p-4">
    <PageRenderer
      :page-id="pageId"
      :page-slug="pageSlug"
      @update:title="updatePageTitle"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const pageId = computed(() => route.query.id || null);
const pageSlug = computed(() => route.query.slug || null);

// Mettre à jour le titre de la page dans le navigateur
useHead(() => ({
  title: pageTitle.value || 'Page',
}));

const pageTitle = ref('');

const updatePageTitle = (title) => {
  pageTitle.value = title;
};
</script>