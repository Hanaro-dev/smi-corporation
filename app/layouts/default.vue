<template>
  <UContainer>
    <HeaderBar />
    <ToastNotification />
    <main class="h-full mt-8">
      <slot />
    </main>
    <FooterBar />
  </UContainer>
</template>

<script setup>
import ToastNotification from "~/components/ToastNotification.vue";
</script>
