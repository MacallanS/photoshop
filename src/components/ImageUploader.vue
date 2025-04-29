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
          class="d-flex flex-column align-center justify-start"
          style="background-color: #1e1e1e; height: 90vh; border: 2px dashed #555"
        >
          <input
            ref="hiddenInput"
            type="file"
            accept=".png,.jpg,.jpeg,.gb7"
            style="display: none"
            @change="onFileSelected"
          />

          <UploadError v-if="loadError" />

          <div
            v-show="imageLoaded"
            ref="canvasContainer"
            class="d-flex justify-center align-center"
            style="flex: 1; width: 100%; height: 100%; overflow: auto"
          >
            <canvas ref="canvas" />
          </div>
          <ColorInfoPanel
            v-if="activeTool === 'eyedropper'"
            :firstColor="firstColor"
            :secondColor="secondColor"
            class="mt-2"
            style="width: 100%; background-color: #2a2a2a"
          />
        </v-card>

        <ToolSelector v-model:activeTool="activeTool" />
        <ResizeDialog
          v-model="resizeDialog"
          :current-width="imageWidth"
          :current-height="imageHeight"
          @resize="handleResizeResizeDialog"
        />
        <ImageInfo
          v-if="imageLoaded"
          :width="imageWidth"
          :height="imageHeight"
          :depth="depthText"
        />
        <v-card
          flat
          class="d-flex flex-column gap-2 pa-4"
          style="background-color: #2a2a2a; width: 320px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); position: absolute; bottom: 20px; right: 40%; z-index: 10;"
        >
          <div class="d-flex align-center" style="justify-content: space-between;">
            <span class="text-subtitle-2 font-weight-medium text-grey-lighten-2">Масштаб</span>
            <span class="text-subtitle-2 font-weight-bold text-white">{{ Math.round(scale * 100) }}%</span>
          </div>
          <v-slider
            v-model="scale"
            min="0.1"
            max="5"
            step="0.1"
            thumb-label
            color="deep-purple-accent-4"
            track-color="grey darken-1"
            track-fill-color="deep-purple-accent-2"
          />
        </v-card>

      
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import UploadError from "@/components/UploadError.vue";
import ToolSelector from "@/components/ToolSelector.vue";
import ResizeDialog from "@/components/ResizeDialog.vue";
import ColorInfoPanel from "@/components/ColorInfoPanel.vue";
import ImageInfo from "@/components/ImageInfo.vue";
import { nearestNeighborResize, bilinearResize } from "@/utils/interpolation";
import { clearAndDrawImageCentered, pickColorAtCursor } from "@/utils/canvasHelpers";
import { parseGB7 } from "@/utils/gb7Parser";

const drawer = ref(false);
const hiddenInput = ref(null);
const canvas = ref(null);
const resizeDialog = ref(false);

const activeTool = ref("hand");
const firstColor = ref(null);
const secondColor = ref(null);

const imageLoaded = ref(false);
const loadError = ref(false);
const imageWidth = ref(0);
const imageHeight = ref(0);
const depthText = ref("8 бит");

let image = ref(null);
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
const scale = ref(1);

function triggerUpload() {
  hiddenInput.value?.click();
}

function onFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.name.toLowerCase().endsWith(".gb7")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { width, height, imgData, mask } = parseGB7(e.target.result);

        imageWidth.value = width;
        imageHeight.value = height;
        imageLoaded.value = true;
        loadError.value = false;
        offsetX = 0;
        offsetY = 0;

        depthText.value = mask ? "8 бит + альфа" : "8 бит";

        fitCanvasToWindow();

        const ctx = canvas.value.getContext("2d");
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
        const centerX = (canvas.value.width - width) / 2;
        const centerY = (canvas.value.height - height) / 2;
        ctx.putImageData(imgData, centerX, centerY);
      } catch (err) {
        console.error("Ошибка чтения GB7:", err.message);
        loadError.value = true;
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        image.value = img;
        imageWidth.value = img.width;
        imageHeight.value = img.height;
        imageLoaded.value = true;
        loadError.value = false;
        offsetX = 0;
        offsetY = 0;
        fitCanvasToWindow();
        drawImage();
        detectImageDepth();
      };
      img.onerror = () => {
        loadError.value = true;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function fitCanvasToWindow() {
  if (canvas.value) {
    canvas.value.width = window.innerWidth;
    canvas.value.height = window.innerHeight;
  }
}

function drawImage() {
  if (canvas.value && image.value) {
    const ctx = canvas.value.getContext("2d");
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    const drawWidth = imageWidth.value * scale.value;
    const drawHeight = imageHeight.value * scale.value;

    const centerX = (canvas.value.width - drawWidth) / 2 + offsetX;
    const centerY = (canvas.value.height - drawHeight) / 2 + offsetY;

    ctx.drawImage(image.value, centerX, centerY, drawWidth, drawHeight);
  }
}

function detectImageDepth(imageData) {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext("2d");

  let imgData = imageData || ctx.getImageData(0, 0, imageWidth.value, imageHeight.value);
  let channels = imgData.data.length / (imgData.width * imgData.height);

  if (channels === 4) depthText.value = "32 бита";
  else if (channels === 3) depthText.value = "24 бита";
  else if (channels === 1) depthText.value = "8 бит";
  else depthText.value = `${channels * 8} бит`;
}

function onCanvasClick(event) {
  if (activeTool.value !== "eyedropper") return;
  const color = pickColorAtCursor(canvas.value, event);
  if (color) {
    if (event.shiftKey || event.ctrlKey || event.altKey) {
      secondColor.value = color;
    } else {
      firstColor.value = color;
    }
  }
}

function onMouseDown(event) {
  if (activeTool.value !== "hand") return;
  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;
  canvas.value.style.cursor = "grabbing";
}

function onMouseMove(event) {
  if (!isDragging || activeTool.value !== "hand") return;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  offsetX += dx;
  offsetY += dy;
  startX = event.clientX;
  startY = event.clientY;
  drawImage();
}

function onMouseUp() {
  isDragging = false;
  if (activeTool.value === "hand" && canvas.value) {
    canvas.value.style.cursor = "grab";
  }
}

function handleKeyDown(event) {
  if (event.key === "h" || event.key === "Р" || event.key === "р" || event.key === "H") {
    activeTool.value = "hand";
  } else if (
    event.key === "e" ||
    event.key === "E" ||
    event.key === "У" ||
    event.key === "у"
  ) {
    activeTool.value = "eyedropper";
  }
}

function handleResizeResizeDialog({ width, height, algorithm }) {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext("2d");
  const srcData = ctx.getImageData(
    (canvas.value.width - imageWidth.value) / 2 + offsetX,
    (canvas.value.height - imageHeight.value) / 2 + offsetY,
    imageWidth.value,
    imageHeight.value
  );

  const resized =
    algorithm === "nearest"
      ? nearestNeighborResize(srcData, width, height)
      : bilinearResize(srcData, width, height);

  imageWidth.value = width;
  imageHeight.value = height;
  offsetX = 0;
  offsetY = 0;

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  const centerX = (canvas.value.width - width) / 2;
  const centerY = (canvas.value.height - height) / 2;
  ctx.putImageData(resized, centerX, centerY);
}

watch(activeTool, (tool) => {
  if (canvas.value) {
    canvas.value.style.cursor =
      tool === "hand" ? "grab" : tool === "eyedropper" ? "crosshair" : "default";
  }
});

watch(scale, () => {
  drawImage();
});

onMounted(() => {
  window.addEventListener("resize", fitCanvasToWindow);
  window.addEventListener("keydown", handleKeyDown);

  if (canvas.value) {
    canvas.value.addEventListener("click", onCanvasClick);
    canvas.value.addEventListener("mousedown", onMouseDown);
    canvas.value.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  fitCanvasToWindow();
});

onUnmounted(() => {
  window.removeEventListener("resize", fitCanvasToWindow);
  window.removeEventListener("keydown", handleKeyDown);

  if (canvas.value) {
    canvas.value.removeEventListener("click", onCanvasClick);
    canvas.value.removeEventListener("mousedown", onMouseDown);
    canvas.value.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }
});
</script>
