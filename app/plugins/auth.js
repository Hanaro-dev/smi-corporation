export default defineNuxtPlugin(async () => {
  const user = useState('user', () => null);
  
  // Récupérer la session utilisateur au chargement de l'application
  try {
    const { data } = await useFetch('/api/_auth/session');
    
    if (data.value && data.value.user) {
      // Mise à jour de l'état utilisateur
      user.value = data.value.user;
      
      // Mise à jour du store Pinia
      const authStore = useAuthStore();
      authStore.login(data.value.user);
      
      console.log('Session utilisateur récupérée :', data.value.user.name);
    } else {
      console.log('Aucune session utilisateur active');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la session :', error);
  }
});