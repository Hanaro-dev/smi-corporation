export default defineNuxtPlugin(async () => {
  const { initAuth } = useAuth()
  
  // Initialiser l'authentification au démarrage de l'application
  if (import.meta.client) {
    await initAuth()
  }
})