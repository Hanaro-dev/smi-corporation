<template>
  <div v-if="page" class="max-w-4xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">{{ page.title }}</h1>
    
    <!-- Contenu de la page avec le rendu BBCode en HTML -->
    <div 
      class="prose dark:prose-invert max-w-none"
      v-html="renderedContent"
    ></div>
    
    <!-- Pages enfants (navigation) -->
    <div v-if="childPages.length > 0" class="mt-8 border-t pt-4">
      <h2 class="text-xl font-semibold mb-3">Pages associées</h2>
      <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <li 
          v-for="childPage in childPages" 
          :key="childPage.id"
          class="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <NuxtLink 
            :to="`/${childPage.slug}`"
            class="block"
          >
            <h3 class="font-medium mb-2">{{ childPage.title }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ truncateContent(childPage.content) }}
            </p>
          </NuxtLink>
        </li>
      </ul>
    </div>
    
    <!-- Pagination (si page parente) -->
    <div v-if="parentPage" class="mt-8 border-t pt-4">
      <NuxtLink 
        :to="`/${parentPage.slug}`" 
        class="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
      >
        <span class="mr-1">←</span> Retour à {{ parentPage.title }}
      </NuxtLink>
    </div>
    
    <!-- Méta-informations -->
    <div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
      Dernière mise à jour : {{ formatDate(page.updatedAt) }}
    </div>
  </div>
  
  <div v-else-if="loading" class="max-w-4xl mx-auto p-4 text-center">
    <p>Chargement de la page...</p>
  </div>
  
  <div v-else class="max-w-4xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Page non trouvée</h1>
    <p>La page que vous recherchez n'existe pas ou n'est pas publiée.</p>
    <NuxtLink to="/" class="text-blue-600 dark:text-blue-400 hover:underline">
      Retour à l'accueil
    </NuxtLink>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import bbcode2html from 'bbcode-to-html';
import DOMPurify from 'dompurify';

const route = useRoute();
const page = ref(null);
const parentPage = ref(null);
const childPages = ref([]);
const loading = ref(true);

onMounted(async () => {
  await fetchPage();
});

const fetchPage = async () => {
  const { id, slug } = route.query;

  if (!id && !slug) {
    loading.value = false;
    return;
  }

  try {
    // Si on a l'ID, récupérer la page par ID
    if (id) {
      page.value = await $fetch(`/api/pages/${id}`);
    } 
    // Sinon, récupérer par slug
    else if (slug) {
      page.value = await $fetch(`/api/pages/by-slug/${slug}`);
    }

    if (page.value) {
      // Récupérer les pages enfantes
      await fetchChildPages();
      
      // Récupérer la page parente si elle existe
      if (page.value.parentId) {
        await fetchParentPage();
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la page:', error);
  } finally {
    loading.value = false;
  }
};

const fetchChildPages = async () => {
  try {
    const response = await $fetch('/api/pages', {
      params: {
        parentId: page.value.id,
        status: 'published'
      }
    });
    
    childPages.value = response.pages || [];
  } catch (error) {
    console.error('Erreur lors du chargement des pages enfants:', error);
    childPages.value = [];
  }
};

const fetchParentPage = async () => {
  try {
    parentPage.value = await $fetch(`/api/pages/${page.value.parentId}`);
  } catch (error) {
    console.error('Erreur lors du chargement de la page parente:', error);
    parentPage.value = null;
  }
};

const renderedContent = computed(() => {
  if (!page.value || !page.value.content) return '';
  // Convertir le BBCode en HTML et sanitiser
  const html = bbcode2html(page.value.content);
  return DOMPurify.sanitize(html);
});

const truncateContent = (bbcodeContent) => {
  if (!bbcodeContent) return '';
  
  // Convertir le BBCode en texte brut
  const html = bbcode2html(bbcodeContent);
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || div.innerText || '';
  
  // Tronquer à 100 caractères
  return text.length > 100 ? text.substring(0, 100) + '...' : text;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Mettre à jour le titre de la page dans le navigateur
useHead(() => ({
  title: page.value ? page.value.title : 'Page',
}));
</script>

<style scoped>
.prose {
  max-width: 100%;
}
</style>