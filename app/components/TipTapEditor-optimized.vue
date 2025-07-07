<template>
  <div class="tiptap-editor-optimized">
    <!-- Toolbar optimisée avec icônes Heroicons -->
    <div class="toolbar" v-if="editor">
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          class="toolbar-btn"
          title="Gras (Ctrl+B)"
        >
          <Icon name="heroicons:bold" size="16" />
        </button>
        
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          class="toolbar-btn"
          title="Italique (Ctrl+I)"
        >
          <Icon name="heroicons:italic" size="16" />
        </button>

        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
          class="toolbar-btn"
          title="Barré"
        >
          <Icon name="heroicons:strikethrough" size="16" />
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button
          @click="toggleHeading(1)"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          class="toolbar-btn"
          title="Titre 1"
        >
          H1
        </button>
        
        <button
          @click="toggleHeading(2)"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          class="toolbar-btn"
          title="Titre 2"
        >
          H2
        </button>
        
        <button
          @click="toggleHeading(3)"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          class="toolbar-btn"
          title="Titre 3"
        >
          H3
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          class="toolbar-btn"
          title="Liste à puces"
        >
          <Icon name="heroicons:list-bullet" size="16" />
        </button>
        
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          class="toolbar-btn"
          title="Liste numérotée"
        >
          <Icon name="lucide:list-ordered" size="16" />
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          class="toolbar-btn"
          title="Annuler (Ctrl+Z)"
        >
          <Icon name="heroicons:arrow-uturn-left" size="16" />
        </button>
        
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          class="toolbar-btn"
          title="Refaire (Ctrl+Y)"
        >
          <Icon name="heroicons:arrow-uturn-right" size="16" />
        </button>
      </div>

      <!-- Bouton pour charger les extensions avancées -->
      <div class="toolbar-separator"></div>
      
      <div class="toolbar-group">
        <button
          @click="loadAdvancedFeatures"
          v-if="!advancedLoaded"
          class="toolbar-btn toolbar-btn-advanced"
          title="Charger les fonctionnalités avancées"
          :disabled="loadingAdvanced"
        >
          <Icon name="heroicons:plus" size="16" v-if="!loadingAdvanced" />
          <Icon name="svg-spinners:3-dots-bounce" size="16" v-else />
          <span class="ml-1">Avancé</span>
        </button>
      </div>
    </div>

    <!-- Éditeur principal -->
    <div class="editor-wrapper">
      <EditorContent :editor="editor" class="editor-content" />
    </div>

    <!-- Toolbar avancée (chargée dynamiquement) -->
    <div class="advanced-toolbar" v-if="advancedLoaded && editor">
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          class="toolbar-btn"
          title="Citation"
        >
          <Icon name="heroicons:chat-bubble-left-ellipsis" size="16" />
        </button>
        
        <button
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          class="toolbar-btn"
          title="Bloc de code"
        >
          <Icon name="heroicons:code-bracket-square" size="16" />
        </button>
        
        <button
          @click="editor.chain().focus().setHorizontalRule().run()"
          class="toolbar-btn"
          title="Ligne horizontale"
        >
          <Icon name="heroicons:minus" size="16" />
        </button>
      </div>
    </div>

    <!-- Indicateur de chargement -->
    <div v-if="!editor" class="loading-indicator">
      <Icon name="svg-spinners:3-dots-bounce" size="24" />
      <span>Chargement de l'éditeur...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// OPTIMISATION: Imports sélectifs au lieu de StarterKit
import { Editor, EditorContent } from '@tiptap/vue-3';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import History from '@tiptap/extension-history';

// Extensions de base (toujours chargées)
const baseExtensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Strike,
  History
];

// Props du composant
interface Props {
  modelValue?: string;
  placeholder?: string;
  editable?: boolean;
  autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Commencez à écrire...',
  editable: true,
  autofocus: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'focus': [];
  'blur': [];
}>();

// État de l'éditeur
const editor = ref<Editor | null>(null);
const advancedLoaded = ref(false);
const loadingAdvanced = ref(false);

// OPTIMISATION: Chargement des extensions avancées à la demande
const loadAdvancedFeatures = async () => {
  if (advancedLoaded.value || loadingAdvanced.value) return;
  
  loadingAdvanced.value = true;
  
  try {
    // Dynamic imports des extensions avancées
    const [
      { default: Heading },
      { default: BulletList },
      { default: OrderedList },
      { default: ListItem },
      { default: Blockquote },
      { default: CodeBlock },
      { default: HorizontalRule }
    ] = await Promise.all([
      import('@tiptap/extension-heading'),
      import('@tiptap/extension-bullet-list'),
      import('@tiptap/extension-ordered-list'),
      import('@tiptap/extension-list-item'),
      import('@tiptap/extension-blockquote'),
      import('@tiptap/extension-code-block'),
      import('@tiptap/extension-horizontal-rule')
    ]);

    // Ajouter les extensions à l'éditeur existant
    if (editor.value) {
      const currentContent = editor.value.getHTML();
      
      // Recréer l'éditeur avec toutes les extensions
      editor.value.destroy();
      
      const allExtensions = [
        ...baseExtensions,
        Heading.configure({
          levels: [1, 2, 3]
        }),
        BulletList,
        OrderedList,
        ListItem,
        Blockquote,
        CodeBlock.configure({
          HTMLAttributes: {
            class: 'code-block'
          }
        }),
        HorizontalRule
      ];

      editor.value = new Editor({
        extensions: allExtensions,
        content: currentContent,
        editable: props.editable,
        autofocus: props.autofocus,
        onUpdate: ({ editor }) => {
          emit('update:modelValue', editor.getHTML());
        },
        onFocus: () => {
          emit('focus');
        },
        onBlur: () => {
          emit('blur');
        }
      });
    }

    advancedLoaded.value = true;
    
  } catch (error) {
    console.error('Erreur lors du chargement des extensions avancées:', error);
  } finally {
    loadingAdvanced.value = false;
  }
};

// Actions de toolbar
const toggleHeading = (level: 1 | 2 | 3) => {
  if (!editor.value) return;
  
  if (advancedLoaded.value) {
    editor.value.chain().focus().toggleHeading({ level }).run();
  } else {
    // Charger les extensions si nécessaire
    loadAdvancedFeatures().then(() => {
      if (editor.value) {
        editor.value.chain().focus().toggleHeading({ level }).run();
      }
    });
  }
};

// Initialisation de l'éditeur
onMounted(() => {
  editor.value = new Editor({
    extensions: baseExtensions,
    content: props.modelValue,
    editable: props.editable,
    autofocus: props.autofocus,
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML());
    },
    onFocus: () => {
      emit('focus');
    },
    onBlur: () => {
      emit('blur');
    }
  });
});

// Cleanup
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue);
  }
});

watch(() => props.editable, (newValue) => {
  if (editor.value) {
    editor.value.setEditable(newValue);
  }
});
</script>

<style scoped>
.tiptap-editor-optimized {
  @apply border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800;
}

.toolbar {
  @apply flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700;
  flex-wrap: wrap;
}

.toolbar-group {
  @apply flex items-center gap-1;
}

.toolbar-separator {
  @apply w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2;
}

.toolbar-btn {
  @apply p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed;
}

.toolbar-btn.is-active {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300;
}

.toolbar-btn-advanced {
  @apply bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 px-3;
}

.editor-wrapper {
  @apply relative;
}

.editor-content {
  @apply p-4 min-h-[200px] prose max-w-none dark:prose-invert;
}

.advanced-toolbar {
  @apply flex items-center gap-1 p-2 border-t border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900;
}

.loading-indicator {
  @apply flex items-center justify-center gap-2 p-8 text-gray-500 dark:text-gray-400;
}

/* Styles pour le contenu de l'éditeur */
:deep(.ProseMirror) {
  @apply outline-none;
}

:deep(.ProseMirror h1) {
  @apply text-2xl font-bold mt-6 mb-4;
}

:deep(.ProseMirror h2) {
  @apply text-xl font-bold mt-5 mb-3;
}

:deep(.ProseMirror h3) {
  @apply text-lg font-bold mt-4 mb-2;
}

:deep(.ProseMirror blockquote) {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 ml-4 italic;
}

:deep(.ProseMirror .code-block) {
  @apply bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm;
}

:deep(.ProseMirror hr) {
  @apply border-t-2 border-gray-300 dark:border-gray-600 my-6;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  @apply ml-6;
}
</style>