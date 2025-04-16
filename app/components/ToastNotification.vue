<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', toast.type]"
    >
      <span class="icon">
        <i v-if="toast.type === 'success'" class="fas fa-check-circle" />
        <i v-else-if="toast.type === 'error'" class="fas fa-times-circle" />
        <i v-else-if="toast.type === 'info'" class="fas fa-info-circle" />
        <i v-else-if="toast.type === 'warning'" class="fas fa-exclamation-circle" />
      </span>
      <span class="message">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { useToast } from "~/composables/useToast";

const { toasts } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.toast {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 1rem;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease-out;
}

.toast.success {
  background-color: #4caf50; /* Vert */
}

.toast.error {
  background-color: #f44336; /* Rouge */
}

.toast.info {
  background-color: #2196f3; /* Bleu */
}

.toast.warning {
  background-color: #ff9800; /* Orange */
}

.icon {
  margin-right: 0.5rem;
  font-size: 1.5rem;
}

.message {
  flex: 1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>