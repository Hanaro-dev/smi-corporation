<template>
  <form class="space-y-6" novalidate @submit.prevent="onSubmit">
    <FormField
      id="name"
      v-model="formData.name"
      :error="errors.name || localErrors.name"
      :required="true"
      label="Nom"
      placeholder="Entrez le nom de l'utilisateur"
      autocomplete="name"
      @blur="validateField('name')"
    />
    
    <FormField
      id="email"
      v-model="formData.email"
      :error="errors.email || localErrors.email"
      :required="true"
      type="email"
      label="Email"
      placeholder="utilisateur@exemple.com"
      autocomplete="email"
      @blur="validateField('email')"
    />
    
    <FormField
      id="role"
      v-model="formData.role_id"
      :error="errors.role || localErrors.role"
      :required="true"
      type="select"
      label="Rôle"
      :options="roleOptions"
      placeholder="Choisissez un rôle"
      @change="validateField('role')"
    />
    
    <div class="flex items-center justify-between pt-4">
      <UButton
        v-if="showCancelButton"
        type="button"
        variant="ghost"
        @click="onCancel"
      >
        Annuler
      </UButton>
      
      <UButton
        type="submit"
        :loading="isSubmitting"
        :disabled="!isFormValid"
        color="primary"
      >
        {{ submitLabel }}
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { User, Role, ValidationErrors } from '~/types';

// Props with proper TypeScript definitions
interface Props {
  user: Partial<User>;
  errors?: ValidationErrors;
  submitLabel?: string;
  roles?: Role[];
  isSubmitting?: boolean;
  showCancelButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  submitLabel: 'Soumettre',
  roles: () => [],
  isSubmitting: false,
  showCancelButton: false
});

// Emits with proper typing
const emit = defineEmits<{
  submit: [formData: Partial<User>];
  cancel: [];
}>();

// Reactive state
const formData = ref<Partial<User>>({ ...props.user });
const localErrors = ref<ValidationErrors>({});

// Computed properties
const roleOptions = computed(() => 
  props.roles.map(role => ({
    value: role.id,
    label: role.name,
    disabled: role.disabled || false
  }))
);

const isFormValid = computed(() => {
  const hasRequiredFields = !!(formData.value.name && formData.value.email && formData.value.role_id);
  const hasNoErrors = Object.keys(localErrors.value).length === 0;
  return hasRequiredFields && hasNoErrors && !props.isSubmitting;
});

// Validation composable
const { validateField: validateSingleField, clearErrors } = useFormValidation();

// Methods
const validateField = async (field: keyof User) => {
  try {
    clearErrors(field);
    await validateSingleField(field, formData.value[field]);
    // Remove the field error by creating a new object without it
    const { [field]: _, ...restErrors } = localErrors.value;
    localErrors.value = restErrors;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Validation error';
    localErrors.value = { ...localErrors.value, [field]: errorMessage };
  }
};

const validateForm = async (): Promise<boolean> => {
  localErrors.value = {};
  
  const fieldsToValidate: (keyof User)[] = ['name', 'email', 'role_id'];
  const validationPromises = fieldsToValidate.map(field => validateField(field));
  
  await Promise.allSettled(validationPromises);
  
  return Object.keys(localErrors.value).length === 0;
};

const onSubmit = async () => {
  const isValid = await validateForm();
  
  if (isValid) {
    emit('submit', formData.value);
  } else {
    // Focus first field with error
    await nextTick();
    const firstErrorField = Object.keys(localErrors.value)[0];
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField);
      element?.focus();
    }
  }
};

const onCancel = () => {
  emit('cancel');
};

// Watchers
watch(() => props.user, (newUser) => {
  formData.value = { ...newUser };
  localErrors.value = {};
}, { deep: true });

watch(() => props.errors, (newErrors) => {
  // Clear local errors when parent errors change
  if (newErrors && Object.keys(newErrors).length === 0) {
    localErrors.value = {};
  }
}, { deep: true });
</script>
