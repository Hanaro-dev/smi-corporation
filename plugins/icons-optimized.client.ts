/**
 * Plugin d'icônes optimisé
 * Remplace FontAwesome par des imports sélectifs et @nuxt/icon
 */

// Map des icônes FontAwesome vers Heroicons pour migration progressive
export const iconMap = {
  // Icônes de statut (toasts)
  'fa-check-circle': 'heroicons:check-circle',
  'fa-times-circle': 'heroicons:x-circle', 
  'fa-info-circle': 'heroicons:information-circle',
  'fa-exclamation-circle': 'heroicons:exclamation-circle',
  'fa-exclamation-triangle': 'heroicons:exclamation-triangle',
  
  // Icônes d'interface commune
  'fa-user': 'heroicons:user',
  'fa-users': 'heroicons:users',
  'fa-cog': 'heroicons:cog-6-tooth',
  'fa-edit': 'heroicons:pencil',
  'fa-trash': 'heroicons:trash',
  'fa-plus': 'heroicons:plus',
  'fa-save': 'heroicons:check',
  'fa-eye': 'heroicons:eye',
  'fa-eye-slash': 'heroicons:eye-slash',
  'fa-home': 'heroicons:home',
  'fa-folder': 'heroicons:folder',
  'fa-file': 'heroicons:document',
  'fa-image': 'heroicons:photo',
  'fa-search': 'heroicons:magnifying-glass',
  'fa-filter': 'heroicons:funnel',
  'fa-sort': 'heroicons:arrows-up-down',
  'fa-download': 'heroicons:arrow-down-tray',
  'fa-upload': 'heroicons:arrow-up-tray',
  'fa-link': 'heroicons:link',
  'fa-external-link': 'heroicons:arrow-top-right-on-square',
  'fa-lock': 'heroicons:lock-closed',
  'fa-unlock': 'heroicons:lock-open',
  'fa-calendar': 'heroicons:calendar-days',
  'fa-clock': 'heroicons:clock',
  'fa-bell': 'heroicons:bell',
  'fa-envelope': 'heroicons:envelope',
  'fa-phone': 'heroicons:phone',
  'fa-map-marker': 'heroicons:map-pin',
  
  // Icônes de navigation
  'fa-chevron-left': 'heroicons:chevron-left',
  'fa-chevron-right': 'heroicons:chevron-right',
  'fa-chevron-up': 'heroicons:chevron-up',
  'fa-chevron-down': 'heroicons:chevron-down',
  'fa-arrow-left': 'heroicons:arrow-left',
  'fa-arrow-right': 'heroicons:arrow-right',
  'fa-arrow-up': 'heroicons:arrow-up',
  'fa-arrow-down': 'heroicons:arrow-down',
  
  // Icônes d'édition TipTap
  'fa-bold': 'heroicons:bold',
  'fa-italic': 'heroicons:italic',
  'fa-underline': 'heroicons:underline',
  'fa-strikethrough': 'heroicons:strikethrough',
  'fa-list-ul': 'heroicons:list-bullet',
  'fa-list-ol': 'heroicons:numbered-list',
  'fa-quote': 'heroicons:chat-bubble-quote',
  'fa-code': 'heroicons:code-bracket',
  'fa-heading': 'heroicons:h1',
  
  // Icônes de status/feedback
  'fa-spinner': 'heroicons:arrow-path',
  'fa-loading': 'svg-spinners:3-dots-bounce',
  'fa-success': 'heroicons:check-circle',
  'fa-error': 'heroicons:x-circle',
  'fa-warning': 'heroicons:exclamation-triangle',
  'fa-info': 'heroicons:information-circle'
};

// Composant wrapper pour migration en douceur
export default defineNuxtPlugin(() => {
  return {
    provide: {
      icon: {
        // Fonction helper pour migrer les icônes FontAwesome
        migrate: (faIcon: string): string => {
          return iconMap[faIcon] || faIcon;
        },
        
        // Map complet pour référence
        map: iconMap,
        
        // Vérifier si une icône est disponible
        isAvailable: (iconName: string): boolean => {
          return Object.values(iconMap).includes(iconName) || iconName.includes(':');
        }
      }
    }
  };
});

// Types TypeScript pour l'auto-complétion
declare module '#app' {
  interface NuxtApp {
    $icon: {
      migrate: (faIcon: string) => string;
      map: Record<string, string>;
      isAvailable: (iconName: string) => boolean;
    };
  }
}

// Utilisation dans les composants:
// const { $icon } = useNuxtApp()
// const iconName = $icon.migrate('fa-check-circle') // Retourne 'heroicons:check-circle'