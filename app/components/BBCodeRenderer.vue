<template>
  <!-- 
    Conteneur pour le rendu du contenu BBCode
    Utilise v-html de manière sécurisée grâce à DOMPurify
  -->
  <div 
    class="bbcode-content" 
    v-html="renderedContent"
    role="article"
    aria-label="Contenu BBCode rendu"
  ></div>
</template>

<script setup>
// === IMPORTS ===
import { computed, onMounted, nextTick } from 'vue'
import { useBBCode } from '~/composables/useBBCode'

/**
 * BBCodeRenderer - Composant de rendu BBCode avec éléments interactifs
 * 
 * Ce composant convertit le contenu BBCode en HTML et gère le rendu
 * des éléments personnalisés qui nécessitent des appels API dynamiques.
 * 
 * Fonctionnalités :
 * - Conversion BBCode vers HTML sécurisée
 * - Rendu dynamique des organigrammes via API
 * - Galeries d'images responsives avec lazy loading
 * - Informations utilisateur en temps réel
 * - Navigation breadcrumb automatique
 * 
 * @component BBCodeRenderer
 * @author SMI Corporation Dev Team
 */

// === PROPS DE CONFIGURATION ===
const props = defineProps({
  /**
   * Contenu BBCode à rendre en HTML
   * @type {String}
   */
  content: {
    type: String,
    required: true
  },
  
  /**
   * Type de page pour déterminer les BBCodes autorisés
   * @type {String} 'default' | 'admin' | 'public' | 'restricted'
   */
  pageType: {
    type: String,
    default: 'default'
  },
  
  /**
   * Liste spécifique de tags autorisés (surcharge pageType)
   * @type {Array<String>}
   */
  enabledTags: {
    type: Array,
    default: () => []
  }
})

// === HOOKS ET COMPOSABLES ===
const { parseCustomBBCode, getAvailableBBCodes } = useBBCode()

// === COMPUTED PROPERTIES ===

/**
 * Détermine les tags BBCode autorisés pour ce rendu
 * Priorité : enabledTags > pageType
 */
const allowedTags = computed(() => {
  return props.enabledTags.length > 0 
    ? props.enabledTags 
    : getAvailableBBCodes(props.pageType)
})

/**
 * Convertit le contenu BBCode en HTML sécurisé
 * Le HTML est prêt pour l'injection via v-html
 */
const renderedContent = computed(() => {
  try {
    return parseCustomBBCode(props.content, allowedTags.value)
  } catch (error) {
    console.error('Erreur lors du rendu BBCode:', error)
    return `<p class="text-red-500">Erreur de rendu du contenu</p>`
  }
})

// === LIFECYCLE HOOKS ===

/**
 * Traitement post-rendu des composants dynamiques
 * Exécuté après que le DOM soit mis à jour
 */
onMounted(async () => {
  await nextTick()
  processCustomComponents()
})

// === FONCTIONS DE TRAITEMENT DYNAMIQUE ===

/**
 * Traite les composants personnalisés après le rendu HTML initial
 * Recherche les éléments avec attributs data-* et les hydrate avec du contenu dynamique
 */
const processCustomComponents = () => {
  const container = document.querySelector('.bbcode-content')
  if (!container) {
    console.warn('BBCodeRenderer: Container .bbcode-content introuvable')
    return
  }

  // === TRAITEMENT DES ORGANIGRAMMES ===
  /**
   * Charge et affiche les organigrammes dynamiquement
   * Récupère les données via l'API et génère le HTML
   */
  const orgCharts = container.querySelectorAll('.orgchart-wrapper')
  orgCharts.forEach(async (element) => {
    const id = element.dataset.id
    if (!id) {
      element.innerHTML = '<p class="text-yellow-600">ID d\'organigramme manquant</p>'
      return
    }
    
    try {
      // Indicateur de chargement
      element.innerHTML = '<div class="animate-spin w-6 h-6 border-2 border-blue-500 rounded-full"></div>'
      
      const orgData = await $fetch(`/api/organigrammes/${id}`)
      element.innerHTML = renderOrgChart(orgData)
    } catch (error) {
      console.error(`Erreur chargement organigramme ${id}:`, error)
      element.innerHTML = `<p class="text-red-500">Erreur lors du chargement de l'organigramme (ID: ${id})</p>`
    }
  })

  // === TRAITEMENT DES GALERIES D'IMAGES ===
  /**
   * Charge et affiche les galeries d'images avec lazy loading
   * Supporte plusieurs images avec prévisualisation responsive
   */
  const galleries = container.querySelectorAll('.image-gallery')
  galleries.forEach(async (element) => {
    const ids = element.dataset.ids?.split(',').map(id => id.trim()).filter(Boolean)
    
    if (!ids?.length) {
      element.innerHTML = '<p class="text-yellow-600">Aucun ID d\'image spécifié</p>'
      return
    }
    
    try {
      // Indicateur de chargement
      element.innerHTML = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4"><div class="animate-pulse bg-gray-200 rounded h-32"></div></div>'
      
      const images = await $fetch(`/api/images?ids=${ids.join(',')}`)
      element.innerHTML = renderImageGallery(images)
      
      // Initialiser le lazy loading après rendu
      initializeLazyLoading(element)
    } catch (error) {
      console.error(`Erreur chargement galerie [${ids.join(', ')}]:`, error)
      element.innerHTML = `<p class="text-red-500">Erreur lors du chargement de la galerie (IDs: ${ids.join(', ')})</p>`
    }
  })

  // === TRAITEMENT DES INFORMATIONS UTILISATEUR ===
  /**
   * Affiche les informations de l'utilisateur connecté en temps réel
   * Sécurisé et respecte la confidentialité
   */
  const userInfos = container.querySelectorAll('.user-info')
  userInfos.forEach(async (element) => {
    const field = element.dataset.field
    
    if (!field) {
      element.textContent = 'Champ non spécifié'
      return
    }
    
    try {
      // Indicateur de chargement
      element.textContent = '...'
      
      const { user } = await $fetch('/api/_auth/session')
      
      if (!user) {
        element.textContent = 'Non connecté'
        element.className += ' text-gray-500'
        return
      }
      
      // Champs autorisés pour la sécurité
      const allowedFields = ['name', 'email', 'role', 'username']
      if (!allowedFields.includes(field)) {
        element.textContent = 'Champ non autorisé'
        console.warn(`Champ utilisateur non autorisé: ${field}`)
        return
      }
      
      element.textContent = user[field] || 'Non défini'
    } catch (error) {
      console.error(`Erreur récupération info utilisateur (${field}):`, error)
      element.textContent = 'Erreur'
      element.className += ' text-red-500'
    }
  })

  // === TRAITEMENT DES BREADCRUMBS ===
  /**
   * Génère la navigation breadcrumb basée sur l'URL courante
   * Navigation contextuelle et responsive
   */
  const breadcrumbs = container.querySelectorAll('.custom-breadcrumb')
  breadcrumbs.forEach((element) => {
    try {
      element.innerHTML = renderCustomBreadcrumb()
    } catch (error) {
      console.error('Erreur génération breadcrumb:', error)
      element.innerHTML = '<span class="text-gray-500">Navigation indisponible</span>'
    }
  })
}

// === FONCTIONS DE RENDU POUR COMPOSANTS PERSONNALISÉS ===

/**
 * Rend un organigramme interactif en HTML
 * Structure hiérarchique avec design moderne
 * 
 * @param {Object} orgData - Données de l'organigramme
 * @returns {String} HTML de l'organigramme
 */
const renderOrgChart = (orgData) => {
  if (!orgData || typeof orgData !== 'object') {
    return '<p class="text-gray-500">Aucune donnée d\'organigramme disponible</p>'
  }
  
  const title = orgData.title || 'Organigramme'
  const structure = orgData.structure || []
  
  return `
    <div class="org-chart bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 my-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${title}</h3>
        <span class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          ${structure.length} personne${structure.length > 1 ? 's' : ''}
        </span>
      </div>
      <div class="org-structure">
        ${structure.length > 0 ? renderOrgStructure(structure) : '<p class="text-gray-500">Structure non définie</p>'}
      </div>
    </div>
  `
}

/**
 * Rend la structure hiérarchique de l'organigramme
 * Supporte l'imbriqué récursive et le thème sombre
 * 
 * @param {Array} structure - Tableau des personnes avec hiérarchie
 * @returns {String} HTML de la structure
 */
const renderOrgStructure = (structure) => {
  if (!Array.isArray(structure)) return ''
  
  return structure.map(person => {
    if (!person || typeof person !== 'object') return ''
    
    const name = person.name || 'Nom non défini'
    const position = person.position || 'Poste non défini'
    const children = person.children || []
    
    return `
      <div class="org-person bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-3 transition-all hover:shadow-md">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h4 class="font-medium text-gray-900 dark:text-white">${name}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-300">${position}</p>
          </div>
          ${children.length > 0 ? `<span class="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">${children.length} subordonné${children.length > 1 ? 's' : ''}</span>` : ''}
        </div>
        ${children.length > 0 ? `<div class="mt-3 ml-4 border-l-2 border-gray-300 dark:border-gray-600 pl-4">${renderOrgStructure(children)}</div>` : ''}
      </div>
    `
  }).join('')
}

/**
 * Rend une galerie d'images responsive avec effets hover
 * Support du lazy loading et des légendes
 * 
 * @param {Array} images - Tableau des images à afficher
 * @returns {String} HTML de la galerie
 */
const renderImageGallery = (images) => {
  if (!Array.isArray(images) || images.length === 0) {
    return '<p class="text-gray-500">Aucune image trouvée</p>'
  }
  
  // Adapter le nombre de colonnes selon le nombre d'images
  let gridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  if (images.length === 1) gridCols = 'grid-cols-1 max-w-md mx-auto'
  else if (images.length === 2) gridCols = 'grid-cols-1 md:grid-cols-2'
  else if (images.length === 3) gridCols = 'grid-cols-1 md:grid-cols-3'
  
  return `
    <div class="image-gallery-container my-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Galerie d'images</h4>
        <span class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          ${images.length} image${images.length > 1 ? 's' : ''}
        </span>
      </div>
      <div class="image-gallery grid ${gridCols} gap-4">
        ${images.map((image, index) => {
          if (!image || typeof image !== 'object') return ''
          
          const url = image.url || '/placeholder-image.jpg'
          const alt = image.alt || `Image ${index + 1}`
          const caption = image.caption || ''
          
          return `
            <div class="gallery-item group cursor-pointer" data-image-index="${index}">
              <div class="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                <img 
                  src="${url}" 
                  alt="${alt}"
                  class="w-full h-32 sm:h-40 object-cover transition-all duration-300 group-hover:scale-105"
                  loading="lazy"
                  onerror="this.src='/placeholder-image.jpg'"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
              </div>
              ${caption ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">${caption}</p>` : ''}
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

/**
 * Initialise le lazy loading pour les images de la galerie
 * Améliore les performances de chargement
 */
const initializeLazyLoading = (galleryElement) => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        }
      })
    })
    
    galleryElement.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }
}

/**
 * Génère un fil d'ariane (breadcrumb) basé sur l'URL courante
 * Navigation contextuelle avec support du thème sombre
 * 
 * @returns {String} HTML du breadcrumb
 */
const renderCustomBreadcrumb = () => {
  // Utiliser l'URL courante si useRoute n'est pas disponible côté serveur
  let currentPath = '/'
  try {
    const route = useRoute()
    currentPath = route.path
  } catch (error) {
    // Fallback pour le rendu côté serveur
    if (typeof window !== 'undefined') {
      currentPath = window.location.pathname
    }
  }
  
  const pathSegments = currentPath.split('/').filter(Boolean)
  
  // Si on est sur la page d'accueil, ne rien afficher
  if (pathSegments.length === 0) {
    return '<span class="text-sm text-gray-500 dark:text-gray-400">Accueil</span>'
  }
  
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/')
    
    // Nettoyer et formatter le label
    const label = segment
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .charAt(0).toUpperCase() + segment.slice(1)
    
    return {
      label,
      path,
      isLast: index === pathSegments.length - 1
    }
  })

  return `
    <nav class="flex items-center space-x-2 text-sm py-2" aria-label="Fil d'ariane">
      <a href="/" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors">
        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
        Accueil
      </a>
      ${breadcrumbItems.map(item => `
        <span class="text-gray-400 dark:text-gray-500">à</span>
        ${item.isLast 
          ? `<span class="text-gray-600 dark:text-gray-300 font-medium">${item.label}</span>`
          : `<a href="${item.path}" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors">${item.label}</a>`
        }
      `).join('')}
    </nav>
  `
}
</script>

<style scoped>
/* === STYLES DU RENDU BBCODE === */

/**
 * Configuration pour le contenu BBCode
 * Optimisé pour la lisibilité et l'accessibilité
 */
.bbcode-content {
  max-width: none;
  color: #111827;
  line-height: 1.75;
}

.dark .bbcode-content {
  color: #f9fafb;
}

.bbcode-content h1 { 
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #111827;
}

.dark .bbcode-content h1 { color: #ffffff; }

.bbcode-content h2 { 
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #111827;
}

.dark .bbcode-content h2 { color: #ffffff; }

.bbcode-content h3 { 
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #111827;
}

.dark .bbcode-content h3 { color: #ffffff; }

.bbcode-content p { 
  margin-bottom: 1rem;
  line-height: 1.625;
}

.bbcode-content ul { 
  list-style-type: disc;
  list-style-position: inside;
  margin-bottom: 1rem;
}

.bbcode-content ol { 
  list-style-type: decimal;
  list-style-position: inside;
  margin-bottom: 1rem;
}

.bbcode-content li { 
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

.bbcode-content strong { 
  font-weight: 600;
}

.bbcode-content em { 
  font-style: italic;
}

.bbcode-content code { 
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
}

.dark .bbcode-content code {
  background-color: #1f2937;
}

.bbcode-content pre { 
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.dark .bbcode-content pre {
  background-color: #1f2937;
}

.bbcode-content blockquote { 
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  font-style: italic;
  color: #374151;
  margin-bottom: 1rem;
}

.dark .bbcode-content blockquote {
  color: #d1d5db;
}

/**
 * Styles pour les éléments personnalisés
 * Espacement et présentation cohérents
 */
.bbcode-content :deep(.callout) {
  @apply my-4;
}

.bbcode-content :deep(.image-gallery-container) {
  @apply my-6;
}

.bbcode-content :deep(.org-chart) {
  @apply my-6;
}

.bbcode-content :deep(.custom-breadcrumb) {
  @apply my-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg;
}

/**
 * Animations pour les éléments interactifs
 * Améliore l'expérience utilisateur
 */
.bbcode-content :deep(.gallery-item) {
  transition: transform 0.2s ease-in-out;
}

.bbcode-content :deep(.gallery-item:hover) {
  transform: translateY(-2px);
}

/**
 * Styles responsive pour les petits écrans
 * Assure une bonne lisibilité sur mobile
 */
@media (max-width: 640px) {
  .bbcode-content :deep(.image-gallery) {
    @apply grid-cols-1;
  }
  
  .bbcode-content :deep(.org-person) {
    @apply text-sm;
  }
}
</style>