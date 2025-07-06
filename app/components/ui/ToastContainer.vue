<template>
  <div class="fixed inset-0 pointer-events-none z-50">
    <!-- Top Right -->
    <div class="absolute top-4 right-4 space-y-2">
      <Toast
        v-for="toastItem in topRightToasts"
        :key="toastItem.id"
        v-bind="toastItem"
        @close="removeToast(toastItem.id)"
      />
    </div>
    
    <!-- Top Left -->
    <div class="absolute top-4 left-4 space-y-2">
      <Toast
        v-for="toastItem in topLeftToasts"
        :key="toastItem.id"
        v-bind="toastItem"
        @close="removeToast(toastItem.id)"
      />
    </div>
    
    <!-- Bottom Right -->
    <div class="absolute bottom-4 right-4 space-y-2">
      <Toast
        v-for="toastItem in bottomRightToasts"
        :key="toastItem.id"
        v-bind="toastItem"
        @close="removeToast(toastItem.id)"
      />
    </div>
    
    <!-- Bottom Left -->
    <div class="absolute bottom-4 left-4 space-y-2">
      <Toast
        v-for="toastItem in bottomLeftToasts"
        :key="toastItem.id"
        v-bind="toastItem"
        @close="removeToast(toastItem.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { toast } from '~/composables/useToast'
import Toast from './Toast.vue'

const { toasts, remove } = toast

// Group toasts by position
const topRightToasts = computed(() => 
  toasts.value.filter(t => t.position === 'top-right')
)

const topLeftToasts = computed(() => 
  toasts.value.filter(t => t.position === 'top-left')
)

const bottomRightToasts = computed(() => 
  toasts.value.filter(t => t.position === 'bottom-right')
)

const bottomLeftToasts = computed(() => 
  toasts.value.filter(t => t.position === 'bottom-left')
)

const removeToast = (id) => {
  remove(id)
}
</script>