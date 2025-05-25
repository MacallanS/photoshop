<template>
  <v-app theme="dark">
    <v-app-bar app color="black" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>Загрузчик изображений</v-toolbar-title>
      <v-spacer />
      <div class="d-flex align-center" style="padding-right: 16px">
        <ToolSelector v-model:activeTool="activeTool" />
      </div>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app temporary dark color="grey darken-3">
      <v-list>
        <v-list-item @click="triggerUpload">
          <v-list-item-title>Загрузить изображение</v-list-item-title>
        </v-list-item>
        <v-list-item @click="resizeDialog = true" :disabled="!imageLoaded">
          <v-list-item-title>Изменить размер</v-list-item-title>
        </v-list-item>
        <v-list-item @click="curveDialog = true" :disabled="!imageLoaded">
          <v-list-item-title>Градационные кривые</v-list-item-title>
        </v-list-item>
        <v-list-item @click="filterDialog = true" :disabled="!imageLoaded">
          <v-list-item-title>Фильтрация (ядро)</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleDownloadImage('png')" :disabled="!imageLoaded">
          <v-list-item-title>Скачать PNG</v-list-item-title>
        </v-list-item>

        <v-list-item @click="handleDownloadImage('jpeg')" :disabled="!imageLoaded">
          <v-list-item-title>Скачать JPG</v-list-item-title>
        </v-list-item>

        <v-list-item @click="handleDownloadGb7" :disabled="!imageLoaded">
          <v-list-item-title>Скачать GB7</v-list-item-title>
        </v-list-item>

      </v-list>
    </v-navigation-drawer>

    <v-main style="background-color: #121212">
      <v-container fluid class="pa-1" style="position: relative; height: 100%">
        <v-row>
          <v-col cols="9">
            <v-card flat class="d-flex flex-column align-center justify-start"
              style="background-color: #1e1e1e; height: 90vh; border: 2px dashed #555">
              <input ref="hiddenInput" type="file" accept=".png,.jpg,.jpeg,.gb7" style="display: none"
                @change="onFileSelected" />

              <UploadError v-if="loadError" />

              <div v-show="imageLoaded" ref="canvasContainer" class="d-flex justify-center align-center container"
                style="flex: 1; width: 100%; height: 100%; overflow: auto">
                <canvas ref="canvas" />
              </div>
            </v-card>

            <v-card flat class="pa-2 d-flex align-center justify-center" style="
                position: absolute;
                bottom: 5px;
                right: 11px;
                width: 23.5%;
                background-color: #2a2a2a;
                z-index: 10;
                border-radius: 4px;
              ">
              <v-slider v-model="zoom" min="10" max="500" step="10" hide-details class="flex-grow-1"
                @update:modelValue="drawImage">
                <template #append>
                  <span style="color: white; width: 50px; text-align: center">{{ zoom }}%</span>
                </template>
              </v-slider>
            </v-card>
          </v-col>

          <v-col cols="3">
            <LayerPanel :layers="layers" :active-layer-id="activeLayerId" @add-layer="showAddLayer = true"
              @remove-layer="removeLayer" @toggle-visibility="toggleLayerVisibility" @update-layer="updateLayer"
              @update:activeLayerId="(id) => (activeLayerId = id)" @toggle-alpha-visibility="toggleAlphaVisibility"
              @remove-alpha-channels="removeAlphaChannels" @move-layer-up="moveLayerUp" @move-layer-down="moveLayerDown"
              @toggle-layer-alpha="toggleLayerAlpha" @remove-layer-alpha="removeLayerAlpha" />
          </v-col>
        </v-row>

        <ResizeDialog v-model="resizeDialog" :current-width="imageWidth" :current-height="imageHeight"
          @resize="handleResizeResizeDialog" />

        <ColorInfoPanel v-if="activeTool === 'eyedropper' && (firstColor || secondColor)" :firstColor="firstColor"
          :secondColor="secondColor" style="width: 100%; background-color: #2a2a2a" />

        <AddLayerDialog v-model="showAddLayer" :width="imageWidth" :height="imageHeight" @add-layer="handleAddLayer" />

        <ImageInfo v-if="imageLoaded" :width="imageWidth" :height="imageHeight" :depth="depthText" />

        <CurvesDialog v-model="curveDialog" :image="layers.find((l) => l.id === activeLayerId)?.image"
          @apply="onApplyCurveCorrection" />

        <KernelFilterDialog v-model="filterDialog" :image="layers.find((l) => l.id === activeLayerId)?.image"
          @apply="onApplyKernelFilter" />
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
import LayerPanel from "@/components/LayerPanel.vue";
import AddLayerDialog from "@/components/AddLayerDialog.vue";
import { nearestNeighborResize, bilinearResize } from "@/utils/interpolation";
import { pickColorAtCursor } from "@/utils/canvasHelpers";
import { parseGB7 } from "@/utils/gb7Parser";
import { nextTick } from "vue";
import CurvesDialog from "@/components/CurvesDialog.vue";
import KernelFilterDialog from '@/components/KernelFilterDialog.vue'
import { downloadImage, downloadGb7 } from '@/utils/downloaders';

const curveDialog = ref(false);
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

const zoom = ref(100);

const showAddLayer = ref(false);
const layers = ref([]);
const activeLayerId = ref(null);

let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

const filterDialog = ref(false);

function onApplyKernelFilter(newImg) {
  const layer = layers.value.find((l) => l.id === activeLayerId.value);
  if (!layer) return;
  layer.image = newImg;
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 50;
  previewCanvas.height = 50;
  const ctx = previewCanvas.getContext('2d');
  ctx.drawImage(newImg, 0, 0, 50, 50);
  layer.preview = previewCanvas.toDataURL();
  drawImage();
}

function handleDownloadImage(format) {
  const layer = layers.value.find((l) => l.id === activeLayerId.value);
  if (!layer) return;
  downloadImage(layer.image, format); // используем импорт
}

function handleDownloadGb7() {
  const layer = layers.value.find((l) => l.id === activeLayerId.value);
  if (!layer) return;
  downloadGb7(layer.image); // используем импорт
}

function moveLayerUp(index) {
  if (index <= 0) return;
  const temp = layers.value[index - 1];
  layers.value[index - 1] = layers.value[index];
  layers.value[index] = temp;
  drawImage();
}

function moveLayerDown(index) {
  if (index >= layers.value.length - 1) return;
  const temp = layers.value[index + 1];
  layers.value[index + 1] = layers.value[index];
  layers.value[index] = temp;
  drawImage();
}

function getBlendMode(mode) {
  const map = {
    normal: "source-over",
    multiply: "multiply",
    screen: "screen",
    overlay: "overlay",
  };
  return map[mode] || "source-over";
}

function triggerUpload() {
  hiddenInput.value?.click();
}

function onFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const layerName = file.name;

  const onImageReady = (img) => {
    addLayer(img, layerName);
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

  if (file.name.toLowerCase().endsWith(".gb7")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { width, height, imgData, mask } = parseGB7(e.target.result);

        depthText.value = mask ? "8 бит + альфа" : "8 бит";

        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = width;
        tmpCanvas.height = height;
        const tmpCtx = tmpCanvas.getContext("2d");
        tmpCtx.putImageData(imgData, 0, 0);

        const img = new Image();
        img.onload = () => onImageReady(img);
        img.src = tmpCanvas.toDataURL();
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
      img.onload = () => onImageReady(img);
      img.onerror = () => (loadError.value = true);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function fitCanvasToWindow() {
  const container = canvas.value?.parentElement;
  if (!container) return;
  canvas.value.width = container.clientWidth;
  canvas.value.height = container.clientHeight;
}

function drawImage() {
  if (!canvas.value || layers.value.length === 0) return;

  const ctx = canvas.value.getContext("2d");
  const scale = zoom.value / 100;
  const scaledWidth = imageWidth.value * scale;
  const scaledHeight = imageHeight.value * scale;

  canvas.value.width = scaledWidth;
  canvas.value.height = scaledHeight;
  ctx.clearRect(0, 0, scaledWidth, scaledHeight);

  const visibleLayers = layers.value.filter((l) => l.visible);
  visibleLayers.forEach((layer) => {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    const scale = zoom.value / 100;
    tempCanvas.width = imageWidth.value;
    tempCanvas.height = imageHeight.value;
    tempCtx.drawImage(layer.image, 0, 0);

    if (layer.hideAlpha) {
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i + 3] = 255;
      }
      tempCtx.putImageData(imgData, 0, 0);
    }

    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = getBlendMode(layer.blendMode);
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
      0,
      0,
      scaledWidth,
      scaledHeight
    );
  });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  canvas.value.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

function detectImageDepth(imageData) {
  const ctx = canvas.value?.getContext("2d");
  if (!ctx) return;
  const imgData =
    imageData || ctx.getImageData(0, 0, imageWidth.value, imageHeight.value);
  const channels = imgData.data.length / (imgData.width * imgData.height);
  depthText.value = channels === 4 ? "32 бита" : channels === 3 ? "24 бита" : "8 бит";
}

function onCanvasClick(event) {
  if (activeTool.value !== "eyedropper") return;
  const color = pickColorAtCursor(
    canvas.value,
    event,
    imageWidth.value,
    imageHeight.value,
    zoom.value,
    offsetX,
    offsetY
  );
  if (color) {
    if (event.shiftKey || event.ctrlKey || event.altKey) secondColor.value = color;
    else firstColor.value = color;
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

  const scale = zoom.value / 100;
  const scaledWidth = imageWidth.value * scale;
  const scaledHeight = imageHeight.value * scale;

  const container = canvas.value?.parentElement;
  if (!container) return;

  let newOffsetX = offsetX + dx;
  let newOffsetY = offsetY + dy;

  newOffsetX = Math.max(newOffsetX, -scaledWidth);
  newOffsetY = Math.max(newOffsetY, -scaledHeight);

  offsetX = newOffsetX;
  offsetY = newOffsetY;

  startX = event.clientX;
  startY = event.clientY;

  canvas.value.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

function onMouseUp() {
  isDragging = false;
  if (activeTool.value === "hand" && canvas.value) {
    canvas.value.style.cursor = "grab";
  }
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  if (["h", "р"].includes(key)) activeTool.value = "hand";
  if (["e", "у"].includes(key)) activeTool.value = "eyedropper";
}

function handleResizeResizeDialog({ width, height, algorithm }) {
  const layer = layers.value.find((l) => l.id === activeLayerId.value);
  if (!layer) return;

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = imageWidth.value;
  tmpCanvas.height = imageHeight.value;
  const tmpCtx = tmpCanvas.getContext("2d");
  tmpCtx.drawImage(layer.image, 0, 0);
  const srcData = tmpCtx.getImageData(0, 0, imageWidth.value, imageHeight.value);

  const resized =
    algorithm === "nearest"
      ? nearestNeighborResize(srcData, width, height)
      : bilinearResize(srcData, width, height);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  outCanvas.getContext("2d").putImageData(resized, 0, 0);

  const newImg = new Image();
  newImg.onload = () => {
    layer.image = newImg;
    imageWidth.value = width;
    imageHeight.value = height;
    drawImage();
  };
  newImg.src = outCanvas.toDataURL();
}

function handleAddLayer({ name, image }) {
  addLayer(image, name);
  showAddLayer.value = false;
}

function addLayer(image, name = "Новый слой") {
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = 50;
  previewCanvas.height = 50;
  const ctx = previewCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0, 50, 50);
  const preview = previewCanvas.toDataURL();

  let hasAlpha = false;
  const alphaCanvas = document.createElement("canvas");
  alphaCanvas.width = image.width;
  alphaCanvas.height = image.height;
  const alphaCtx = alphaCanvas.getContext("2d");
  alphaCtx.drawImage(image, 0, 0);
  const alphaData = alphaCtx.getImageData(0, 0, image.width, image.height).data;
  for (let i = 0; i < alphaData.length; i += 4) {
    if (alphaData[i + 3] < 255) {
      hasAlpha = true;
      break;
    }
  }

  const newLayer = {
    id: Date.now(),
    name,
    image,
    preview,
    opacity: 1,
    visible: true,
    blendMode: "normal",
    isAlpha: /alpha|mask/i.test(name),
    hasAlpha,
    hideAlpha: false,
  };

  layers.value.push(newLayer);
  activeLayerId.value = newLayer.id;
  imageLoaded.value = true;

  imageWidth.value = Math.max(imageWidth.value, image.width);
  imageHeight.value = Math.max(imageHeight.value, image.height);

  drawImage();
}

function removeLayer(id) {
  layers.value = layers.value.filter((l) => l.id !== id);

  if (layers.value.length === 0) {
    imageLoaded.value = false;
    activeLayerId.value = null;

    const ctx = canvas.value?.getContext("2d");
    if (ctx && canvas.value) {
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    }
    return;
  }

  if (!layers.value.find((l) => l.id === activeLayerId.value)) {
    activeLayerId.value = layers.value[0].id;
  }

  nextTick(() => {
    drawImage();
  });
}
watch(
  layers,
  () => {
    if (imageLoaded.value) {
      nextTick(drawImage);
    }
  },
  { deep: true }
);

function toggleLayerVisibility(id) {
  const layer = layers.value.find((l) => l.id === id);
  if (layer) {
    layer.visible = !layer.visible;
    drawImage();
  }
}

function updateLayer(updated) {
  const index = layers.value.findIndex((l) => l.id === updated.id);
  if (index !== -1) {
    layers.value[index] = { ...layers.value[index], ...updated };
    drawImage();
  }
}

function toggleAlphaVisibility() {
  console.log("Toggling alpha visibility");
  const anyAlpha = layers.value.some((l) => l.isAlpha);
  if (!anyAlpha) return;

  layers.value.forEach((l) => {
    if (l.isAlpha) l.visible = !l.visible;
  });

  nextTick(() => drawImage());
}

function removeAlphaChannels() {
  const before = layers.value.length;
  layers.value = layers.value.filter((l) => !l.isAlpha);
  if (layers.value.length !== before) {
    nextTick(() => drawImage());
  }
}

watch(activeTool, (tool) => {
  if (canvas.value) {
    canvas.value.style.cursor =
      tool === "hand" ? "grab" : tool === "eyedropper" ? "crosshair" : "default";
  }
});

onMounted(() => {
  window.addEventListener("resize", () => {
    fitCanvasToWindow();
    drawImage();
  });
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
  window.removeEventListener("keydown", handleKeyDown);

  if (canvas.value) {
    canvas.value.removeEventListener("click", onCanvasClick);
    canvas.value.removeEventListener("mousedown", onMouseDown);
    canvas.value.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }
});

function removeLayerAlpha(id) {
  const layer = layers.value.find((l) => l.id === id);
  if (!layer || !layer.hasAlpha) return;

  const canvas = document.createElement("canvas");
  canvas.width = layer.image.width;
  canvas.height = layer.image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(layer.image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  const img = new Image();
  img.onload = () => {
    layer.image = img;
    layer.hasAlpha = false;
    layer.hideAlpha = false;
    drawImage();
  };
  img.src = canvas.toDataURL();
}

function toggleLayerAlpha(id) {
  const layer = layers.value.find((l) => l.id === id);
  if (!layer || !layer.hasAlpha) return;
  layer.hideAlpha = !layer.hideAlpha;
  drawImage();
}

function onApplyCurveCorrection(newImg) {
  const layer = layers.value.find((l) => l.id === activeLayerId.value);
  if (!layer) return;

  layer.image = newImg;

  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = 50;
  previewCanvas.height = 50;
  const ctx = previewCanvas.getContext("2d");
  ctx.drawImage(newImg, 0, 0, 50, 50);
  layer.preview = previewCanvas.toDataURL();

  drawImage();
}
</script>

<style scoped>
canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.container {
  position: relative;
  overflow: auto;
}
</style>
