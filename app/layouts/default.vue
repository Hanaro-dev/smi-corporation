<template>
  <UContainer>
    <HeaderBar />
    <Toast />
    <main class="maint-content">
      <slot />
    </main>
    <FooterBar />
  </UContainer>
</template>

<script setup>
import Toast from "~/components/ToastNotification.vue"

</script>

<style scoped>
.main-content {
  height: 100%;
  margin-top: 4rem;
}
</style>
