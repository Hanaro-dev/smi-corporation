<template>
  <div>
    <div>
      <!-- <h1>Color mode : {{ $colorMode.value }}</h1> -->
      <UButton
        icon="i-lucide-laptop"
        size="md"
        color="primary"
        variant="subtle"
        class="button rounded-full"
        @click="$colorMode.preference = 'system'"
      />
      <UButton
        icon="i-lucide-sun"
        size="md"
        color="primary"
        variant="subtle"
        class="button rounded-full"
        @click="$colorMode.preference = 'light'"
      />
      <UButton
        icon="i-lucide-moon"
        size="md"
        color="primary"
        variant="subtle"
        class="button rounded-full"
        @click="$colorMode.preference = 'dark'"
      /> 
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.button {
  margin: 0.1rem;
}
</style>
