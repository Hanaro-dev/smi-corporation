<template>
  <UContainer>
    <HeaderBar />
    <ToastNotification />
    <main class="maint-content">
      <slot />
    </main>
    <FooterBar />
  </UContainer>
</template>

<script setup>
import ToastNotification from "~/components/ToastNotification.vue"

</script>

<style scoped>
.main-content {
  height: 100%;
  margin-top: 2rem;
}
</style>
