// Plugin pour afficher une notification concernant la base de données simulée
import { useAppToast } from '~/composables/useAppToast';

export default defineNuxtPlugin((nuxtApp) => {
  // Attendre que l'application soit chargée côté client pour afficher la notification
  if (import.meta.client) {
    // Utiliser le composable de notification
    const { addToast } = useAppToast();
    
    // Utiliser setTimeout pour s'assurer que la notification s'affiche après le chargement complet
    setTimeout(() => {
      addToast(
        "Mode développement : Base de données simulée en cours d'utilisation. Certaines fonctionnalités sont limitées.",
        "warning",
        10000 // Afficher pendant 10 secondes
      );
    }, 1000); // Attendre 1 seconde après le chargement
  }
});