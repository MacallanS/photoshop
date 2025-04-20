<template>
  <v-app theme="dark">
    <v-app-bar app color="black" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>Загрузчик изображений</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app temporary dark color="grey darken-3">
      <v-list>
        <v-list-item @click="triggerUpload">
          <v-list-item-title>Загрузить изображение</v-list-item-title>
        </v-list-item>
        <v-list-item @click="resizeDialog = true" :disabled="!imageLoaded">
          <v-list-item-title>Изменить размер</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main style="background-color: #121212">
      <v-container fluid class="pa-3" style="position: relative; height: 100%">
        <v-card
          flat
          class="d-flex align-center justify-center"
          style="background-color: #1e1e1e; height: 90vh; border: 2px dashed #555"
        >
          <input
            ref="hiddenInput"
            type="file"
            accept=".png,.jpg,.jpeg,.gb7"
            style="display: none"
            @change="onFileSelected"
          />

          <upload-error v-if="loadError" />

          <div
            v-show="imageLoaded"
            class="d-flex justify-center align-center"
            style="max-height: 100%; width: 100%; overflow: auto"
          >
            <canvas
              ref="canvas"
              style="display: block; max-width: 100%; max-height: 100%"
            />
          </div>
        </v-card>

        <image-info
          v-if="imageLoaded"
          :width="imageWidth"
          :height="imageHeight"
          :depth="depthText"
          style="position: absolute; bottom: 20px; right: 20px; z-index: 10; max-width: 250px"
        />

        <resize-dialog
          v-model="resizeDialog"
          :current-width="imageWidth"
          :current-height="imageHeight"
          @resize="handleResize"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from "vue";
import { useImageLoader } from "@/composables/useImageLoader";
import UploadError from "./UploadError.vue";
import ImageInfo from "./ImageInfo.vue";
import ResizeDialog from "./ResizeDialog.vue";

const drawer = ref(false);
const selectedFile = ref(null);
const canvas = ref(null);
const hiddenInput = ref(null);
const resizeDialog = ref(false);

const {
  loadImage,
  resizeImage,
  fileError,
  loadError,
  imageLoaded,
  imageWidth,
  imageHeight,
  depthText,
} = useImageLoader(canvas);

function triggerUpload() {
  hiddenInput.value?.click();
}

function onFileSelected(event) {
  const file = event.target.files[0];
  if (file) {
    loadImage(file, () => {
      event.target.value = null;
    });
  }
}

function handleResize({ width, height, algorithm }) {
  resizeImage({ width, height, method: algorithm });
}
</script>
