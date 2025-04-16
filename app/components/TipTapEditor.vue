<template>
  <div class="border rounded min-h-[120px] p-2 bg-white dark:bg-gray-700">
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const editor = ref(
  new Editor({
    extensions: [StarterKit],
    content: props.modelValue,
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML())
    }
  })
)

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && editor.value.getHTML() !== val) {
      editor.value.commands.setContent(val || '')
    }
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>