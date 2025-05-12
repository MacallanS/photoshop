<template>
  <v-app class="app">
    <v-main>
      <ImageUploader />
    </v-main>
  </v-app>
</template>

<script setup>
import ImageUploader from './components/ImageUploader.vue';
</script>

<style>
.app {
  overflow: hidden;
}


</style>