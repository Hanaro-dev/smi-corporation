import { ref } from "vue";

const toasts = ref([]);

export const useAppToast = () => {
  const addToast = (message, type = "success", duration = 3000) => {
    const id = Date.now();
    toasts.value.push({ id, message, type, duration });

    // Supprimer automatiquement la notification après la durée spécifiée
    setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id);
    }, duration);
  };

  return {
    toasts,
    addToast,
  };
};