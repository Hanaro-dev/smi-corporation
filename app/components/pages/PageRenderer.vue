<template>
  <div v-if="page" class="page-content">
    <h1 class="text-3xl font-bold mb-6">{{ page.title }}</h1>
    
    <!-- Contenu de la page avec le rendu BBCode en HTML -->
    <div 
      class="prose dark:prose-invert max-w-none"
      v-html="renderedContent"
    />
    
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
    
    <!-- Fil d'Ariane (breadcrumb) -->
    <div v-if="breadcrumbs.length > 1" class="mb-6 flex items-center text-sm">
      <ul class="flex flex-wrap items-center">
        <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
          <NuxtLink 
            v-if="index < breadcrumbs.length - 1"
            :to="`/${crumb.slug}`" 
            class="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ crumb.title }}
          </NuxtLink>
          <span v-else class="font-medium">{{ crumb.title }}</span>
          
          <span v-if="index < breadcrumbs.length - 1" class="mx-2 text-gray-500">/</span>
        </li>
      </ul>
    </div>
    
    <!-- Méta-informations -->
    <div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
      Dernière mise à jour : {{ formatDate(page.updatedAt) }}
    </div>
  </div>
  
  <div v-else-if="loading" class="text-center p-4">
    <p>Chargement de la page...</p>
  </div>
  
  <div v-else class="not-found p-4">
    <h1 class="text-3xl font-bold mb-6">Page non trouvée</h1>
    <p>La page que vous recherchez n'existe pas ou n'est pas publiée.</p>
    <NuxtLink to="/" class="text-blue-600 dark:text-blue-400 hover:underline">
      Retour à l'accueil
    </NuxtLink>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import bbcode2html from 'bbcode-to-html';
import DOMPurify from 'dompurify';

const props = defineProps({
  pageId: {
    type: [Number, String],
    default: null
  },
  pageSlug: {
    type: String,
    default: null
  },
  initialPageData: {
    type: Object,
    default: null
  }
});

const page = ref(props.initialPageData || null);
const parentPage = ref(null);
const childPages = ref([]);
const breadcrumbs = ref([]);
const loading = ref(true);

// Observer les changements de propriétés pour recharger la page si nécessaire
watch(() => props.pageId, fetchPage);
watch(() => props.pageSlug, fetchPage);
watch(() => props.initialPageData, (newValue) => {
  if (newValue) {
    page.value = newValue;
    fetchRelatedPages();
  }
});

onMounted(async () => {
  if (!page.value) {
    await fetchPage();
  } else {
    await fetchRelatedPages();
  }
});

const fetchPage = async () => {
  if (!props.pageId && !props.pageSlug) {
    loading.value = false;
    return;
  }

  try {
    // Si on a l'ID, récupérer la page par ID
    if (props.pageId) {
      page.value = await $fetch(`/api/pages/${props.pageId}`);
    } 
    // Sinon, récupérer par slug
    else if (props.pageSlug) {
      page.value = await $fetch(`/api/pages/by-slug/${props.pageSlug}`);
    }

    if (page.value) {
      await fetchRelatedPages();
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la page:', error);
    page.value = null;
  } finally {
    loading.value = false;
  }
};

const fetchRelatedPages = async () => {
  if (!page.value) return;
  
  await Promise.all([
    fetchChildPages(),
    fetchParentPage(),
    buildBreadcrumbs()
  ]);
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
  if (!page.value.parentId) {
    parentPage.value = null;
    return;
  }
  
  try {
    parentPage.value = await $fetch(`/api/pages/${page.value.parentId}`);
  } catch (error) {
    console.error('Erreur lors du chargement de la page parente:', error);
    parentPage.value = null;
  }
};

const buildBreadcrumbs = async () => {
  breadcrumbs.value = [];
  
  if (!page.value) return;
  
  // Ajouter la page courante
  breadcrumbs.value.push({
    id: page.value.id,
    title: page.value.title,
    slug: page.value.slug
  });
  
  // Construire le fil d'Ariane en remontant l'arborescence
  let currentParentId = page.value.parentId;
  
  while (currentParentId) {
    try {
      const parent = await $fetch(`/api/pages/${currentParentId}`);
      
      breadcrumbs.value.unshift({
        id: parent.id,
        title: parent.title,
        slug: parent.slug
      });
      
      currentParentId = parent.parentId;
    } catch (error) {
      console.error('Erreur lors de la construction du fil d\'Ariane:', error);
      currentParentId = null;
    }
  }
  
  // Ajouter l'accueil au début
  breadcrumbs.value.unshift({
    id: 0,
    title: 'Accueil',
    slug: ''
  });
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

// Émettre les événements pour le titre de la page
const emit = defineEmits(['update:title']);

watch(() => page.value?.title, (newTitle) => {
  if (newTitle) {
    emit('update:title', newTitle);
  }
});
</script>

<style scoped>
.page-content {
  width: 100%;
}

.prose {
  max-width: 100%;
}

.not-found {
  min-height: 300px;
}
</style>