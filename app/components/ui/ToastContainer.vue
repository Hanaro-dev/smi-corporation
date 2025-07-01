<template>
  <div class="fixed inset-0 pointer-events-none z-50">
    <!-- Top Right -->
    <div class="absolute top-4 right-4 space-y-2">
      <Toast
        v-for="toast in topRightToasts"
        :key="toast.id"
        v-bind="toast"
        @close="removeToast(toast.id)"
      />
    </div>
    
    <!-- Top Left -->
    <div class="absolute top-4 left-4 space-y-2">
      <Toast
        v-for="toast in topLeftToasts"
        :key="toast.id"
        v-bind="toast"
        @close="removeToast(toast.id)"
      />
    </div>
    
    <!-- Bottom Right -->
    <div class="absolute bottom-4 right-4 space-y-2">
      <Toast
        v-for="toast in bottomRightToasts"
        :key="toast.id"
        v-bind="toast"
        @close="removeToast(toast.id)"
      />
    </div>
    
    <!-- Bottom Left -->
    <div class="absolute bottom-4 left-4 space-y-2">
      <Toast
        v-for="toast in bottomLeftToasts"
        :key="toast.id"
        v-bind="toast"
        @close="removeToast(toast.id)"
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