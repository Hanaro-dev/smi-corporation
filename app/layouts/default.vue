<template>
  <UContainer>
    <HeaderBar />
    <main class="maint-content">
      <slot />
    </main>
    <FooterBar />
  </UContainer>
</template>

<script setup></script>

<style scoped>
.main-content {
  height: 100%;
  margin-top: 4rem;
}
</style>
