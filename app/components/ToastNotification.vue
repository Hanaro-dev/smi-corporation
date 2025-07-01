<template>
  <div class="fixed top-4 right-4 z-[1000]">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="[
        'flex items-center mb-2 px-4 py-3 rounded text-white font-bold shadow-lg animate-fade-in',
        toast.type === 'success' && 'bg-green-600',
        toast.type === 'error' && 'bg-red-600',
        toast.type === 'info' && 'bg-blue-600',
        toast.type === 'warning' && 'bg-orange-500'
      ]"
    >
      <span class="mr-2 text-xl">
        <i v-if="toast.type === 'success'" class="fas fa-check-circle" />
        <i v-else-if="toast.type === 'error'" class="fas fa-times-circle" />
        <i v-else-if="toast.type === 'info'" class="fas fa-info-circle" />
        <i v-else-if="toast.type === 'warning'" class="fas fa-exclamation-circle" />
      </span>
      <span class="flex-1">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { toast } from "~/composables/useToast";

const { toasts } = toast;
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
