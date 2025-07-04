<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="visible"
        :class="[
          'fixed z-50 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          positionClass
        ]"
        role="alert"
      >
        <div class="flex items-start p-4">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <Icon 
              :name="iconName" 
              :class="[
                'w-5 h-5',
                iconColorClass
              ]"
            />
          </div>
          
          <!-- Content -->
          <div class="ml-3 flex-1">
            <p v-if="title" class="text-sm font-medium text-gray-900 dark:text-white">
              {{ title }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {{ message }}
            </p>
          </div>
          
          <!-- Close button -->
          <div class="ml-4 flex-shrink-0 flex">
            <button
              class="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              @click="close"
            >
              <Icon name="heroicons:x-mark" class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div v-if="showProgress" class="h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            :class="[
              'h-full transition-all duration-100 ease-linear',
              progressColorClass
            ]"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 5000
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(value)
  },
  showProgress: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const visible = ref(true)
const progress = ref(100)
let timer = null
let progressTimer = null

// Computed properties
const iconName = computed(() => {
  const icons = {
    success: 'heroicons:check-circle',
    error: 'heroicons:x-circle',
    warning: 'heroicons:exclamation-triangle',
    info: 'heroicons:information-circle'
  }
  return icons[props.type]
})

const iconColorClass = computed(() => {
  const colors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  }
  return colors[props.type]
})

const progressColorClass = computed(() => {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }
  return colors[props.type]
})

const positionClass = computed(() => {
  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }
  return positions[props.position]
})

// Methods
const close = () => {
  visible.value = false
  emit('close')
}

const startTimer = () => {
  if (props.persistent) return
  
  timer = setTimeout(() => {
    close()
  }, props.duration)
  
  if (props.showProgress) {
    const interval = 50
    const step = (interval / props.duration) * 100
    
    progressTimer = setInterval(() => {
      progress.value -= step
      if (progress.value <= 0) {
        progress.value = 0
        clearInterval(progressTimer)
      }
    }, interval)
  }
}

const pauseTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const resumeTimer = () => {
  if (!props.persistent && !timer) {
    const remainingTime = (progress.value / 100) * props.duration
    timer = setTimeout(() => {
      close()
    }, remainingTime)
    
    if (props.showProgress) {
      const interval = 50
      const step = (interval / remainingTime) * progress.value
      
      progressTimer = setInterval(() => {
        progress.value -= step
        if (progress.value <= 0) {
          progress.value = 0
          clearInterval(progressTimer)
        }
      }, interval)
    }
  }
}

// Lifecycle
onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (progressTimer) clearInterval(progressTimer)
})
</script>