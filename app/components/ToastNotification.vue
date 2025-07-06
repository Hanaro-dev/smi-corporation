<template>
  <div class="fixed top-4 right-4 z-[1000]">
    <div
      v-for="toastItem in toasts"
      :key="toastItem.id"
      :class="[
        'flex items-center mb-2 px-4 py-3 rounded text-white font-bold shadow-lg animate-fade-in',
        toastItem.type === 'success' && 'bg-green-600',
        toastItem.type === 'error' && 'bg-red-600',
        toastItem.type === 'info' && 'bg-blue-600',
        toastItem.type === 'warning' && 'bg-orange-500'
      ]"
    >
      <span class="mr-2 text-xl">
        <i v-if="toastItem.type === 'success'" class="fas fa-check-circle" />
        <i v-else-if="toastItem.type === 'error'" class="fas fa-times-circle" />
        <i v-else-if="toastItem.type === 'info'" class="fas fa-info-circle" />
        <i v-else-if="toastItem.type === 'warning'" class="fas fa-exclamation-circle" />
      </span>
      <span class="flex-1">{{ toastItem.message }}</span>
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
