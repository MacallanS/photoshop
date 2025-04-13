<template>
  <v-container class="pa-4" style="max-width: 1000px">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Загрузка изображения</span>
      </v-card-title>

      <v-card-text>
        <v-file-input
          :key="inputKey"
          v-model="selectedFile"
          label="Файл изображения (.png, .jpg, .gb7)"
          accept=".png, .jpg, .jpeg, .gb7"
          :error="fileError"
          :error-messages="fileError ? ['Файл обязателен'] : []"
        />

        <v-btn color="primary" @click="loadImage" :disabled="!selectedFile">
          Загрузить изображение
        </v-btn>

        <v-alert v-if="loadError" type="error">
          Ошибка загрузки изображения. Проверьте формат файла.
        </v-alert>

        <v-row v-show="imageLoaded" class="mt-6">
          <v-col cols="12" md="9">
            <div
              style="
                overflow: auto;
                max-height: 80vh;
                background-color: #f5f5f5;
                border: 2px dashed #ccc;
                border-radius: 6px;
                padding: 10px;
              "
            >
              <canvas
                ref="canvas"
                style="display: block; margin: 0 auto; max-width: 100%; height: auto"
              ></canvas>
            </div>
          </v-col>

          <v-col cols="12" md="3">
            <v-card color="grey-lighten-4" flat class="pa-3">
              <div class="text-subtitle-2 mb-2">Информация</div>
              <v-list-item density="compact">
                <v-list-item-title>Ширина:</v-list-item-title>
                <v-list-item-subtitle>{{ imageWidth }} px</v-list-item-subtitle>
              </v-list-item>
              <v-list-item density="compact">
                <v-list-item-title>Высота:</v-list-item-title>
                <v-list-item-subtitle>{{ imageHeight }} px</v-list-item-subtitle>
              </v-list-item>
              <v-list-item density="compact">
                <v-list-item-title>Глубина:</v-list-item-title>
                <v-list-item-subtitle>{{ depthText }}</v-list-item-subtitle>
              </v-list-item>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script setup>
import { ref, nextTick, computed } from "vue";

const selectedFile = ref(null);
const inputKey = ref(0);
const imageLoaded = ref(false);
const fileError = ref(false);
const loadError = ref(false);
const canvas = ref(null);
const imageWidth = ref(0);
const imageHeight = ref(0);
const hasAlpha = ref(false);
const isGrayBit = ref(false);
const hasMask = ref(false);

const depthText = computed(() => {
  if (!imageLoaded.value) return "—";
  if (isGrayBit.value) {
    return `7-бит серого${hasMask.value ? " + маска" : ""}`;
  }
  return hasAlpha.value ? "32-бит RGBA" : "24-бит RGB";
});

function resetInput() {
  selectedFile.value = null;
  inputKey.value++;
}

function loadImage() {
  fileError.value = false;
  loadError.value = false;

  if (!selectedFile.value) {
    fileError.value = true;
    return;
  }

  const file = selectedFile.value;
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "gb7") {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bytes = new Uint8Array(e.target.result);
        const signature = String.fromCharCode(...bytes.slice(0, 4));
        if (signature !== "GB7\u001D") throw new Error("Invalid signature");

        const mask = bytes[5] !== 0;
        const width = (bytes[6] << 8) | bytes[7];
        const height = (bytes[8] << 8) | bytes[9];

        const pixelData = bytes.slice(12);
        if (pixelData.length !== width * height) throw new Error("Data length mismatch");

        imageWidth.value = width;
        imageHeight.value = height;
        hasMask.value = mask;
        isGrayBit.value = true;
        imageLoaded.value = true;

        nextTick(() => {
          const ctx = canvas.value?.getContext("2d");
          if (!ctx) throw new Error("Canvas not found");

          canvas.value.width = width;
          canvas.value.height = height;

          const imgData = ctx.createImageData(width, height);
          const data = imgData.data;

          for (let i = 0; i < width * height; i++) {
            const byte = pixelData[i];
            const gray7 = Math.floor(((byte & 0b01111111) / 127) * 255);
            const alpha = mask ? (byte >> 7) * 255 : 255;

            const j = i * 4;
            data[j] = gray7;
            data[j + 1] = gray7;
            data[j + 2] = gray7;
            data[j + 3] = alpha;
          }

          ctx.putImageData(imgData, 0, 0);
        });
      } catch (err) {
        console.error("Ошибка чтения GB7:", err);
        loadError.value = true;
      } finally {
        resetInput();
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const ctx = canvas.value?.getContext("2d");
      if (!ctx) {
        console.error("Canvas context not found");
        return;
      }

      canvas.value.width = img.width;
      canvas.value.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      let alphaFound = false;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 255) {
          alphaFound = true;
          break;
        }
      }

      imageWidth.value = img.width;
      imageHeight.value = img.height;
      hasAlpha.value = alphaFound;
      isGrayBit.value = false;
      hasMask.value = false;
      imageLoaded.value = true;

      URL.revokeObjectURL(imageUrl);
      resetInput();
    };

    img.onerror = () => {
      loadError.value = true;
      URL.revokeObjectURL(imageUrl);
      resetInput();
    };

    img.src = imageUrl;
  }
}
</script>
