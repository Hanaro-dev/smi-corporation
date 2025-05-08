<template>
  <div>
    <UButton
      icon="i-lucide-laptop"
      size="md"
      color="primary"
      variant="subtle"
      class="m-1 rounded-full"
      @click="$colorMode.preference = 'system'"
    />
    <UButton
      icon="i-lucide-sun"
      size="md"
      color="primary"
      variant="subtle"
      class="m-1 rounded-full"
      @click="$colorMode.preference = 'light'"
    />
    <UButton
      icon="i-lucide-moon"
      size="md"
      color="primary"
      variant="subtle"
      class="m-1 rounded-full"
      @click="$colorMode.preference = 'dark'"
    />
  </div>
</template>

<script setup>
// Ce composant permet de changer le mode de couleur (système, clair, sombre)
</script>

<style scoped>
.button {
  margin: 0.1rem;
}
</style>
