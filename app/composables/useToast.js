import { ref, readonly } from 'vue'

const toasts = ref([])

let toastId = 0

export const useCustomToast = () => {
  const add = (toast) => {
    const id = ++toastId
    const newToast = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      position: 'top-right',
      showProgress: true,
      persistent: false,
      ...toast
    }
    
    toasts.value.push(newToast)
    
    // Auto-remove after duration (if not persistent)
    if (!newToast.persistent) {
      setTimeout(() => {
        remove(id)
      }, newToast.duration)
    }
    
    return id
  }
  
  const remove = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const clear = () => {
    toasts.value = []
  }
  
  // Convenience methods
  const success = (message, options = {}) => {
    return add({ type: 'success', message, ...options })
  }
  
  const error = (message, options = {}) => {
    return add({ type: 'error', message, persistent: true, ...options })
  }
  
  const warning = (message, options = {}) => {
    return add({ type: 'warning', message, ...options })
  }
  
  const info = (message, options = {}) => {
    return add({ type: 'info', message, ...options })
  }
  
  return {
    toasts: readonly(toasts),
    add,
    remove,
    clear,
    success,
    error,
    warning,
    info
  }
}

// Global toast instance
export const toast = useCustomToast()