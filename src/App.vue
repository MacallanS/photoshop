<template>
  <v-app>
    <v-main>
      <image-uploader />
    </v-main>
  </v-app>
</template>

<script>
import ImageUploader from './components/ImageUploader.vue'

export default {
  components: {
    ImageUploader
  }
}
</script>
