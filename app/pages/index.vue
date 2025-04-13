<template>
  <UContainer class="page-container">
    <div class="title">
      Veuillez noter que cet espace matriciel est en cours de construction.
      Merci de votre compréhension.
    </div>
  </UContainer>
</template>

<script setup>
const colorMode = useColorMode();

console.log(colorMode.preference);
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
}

.title {
  font-size: 2.25rem;
  font-weight: bold;
}
</style>
