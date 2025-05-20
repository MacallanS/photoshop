<template>
  <v-dialog v-model="dialogVisible" max-width="600">
    <v-card>
      <v-card-title class="text-h6">Градационная коррекция (Кривые)</v-card-title>
      <v-card-text>
        <svg
          width="256"
          height="256"
          viewBox="0 0 256 256"
          style="background: #111; border: 1px solid #444"
        >
          <polyline :points="rPoints" fill="none" stroke="red" stroke-width="1" />
          <polyline :points="gPoints" fill="none" stroke="lime" stroke-width="1" />
          <polyline :points="bPoints" fill="none" stroke="blue" stroke-width="1" />
          <polyline :points="linePoints" stroke="white" stroke-width="2" />
          <line
            x1="0"
            :y1="255 - y1"
            :x2="x1"
            :y2="255 - y1"
            stroke="white"
            stroke-dasharray="4"
          />
          <line
            :x1="x2"
            :y1="255 - y2"
            x2="255"
            :y2="255 - y2"
            stroke="white"
            stroke-dasharray="4"
          />
        </svg>

        <v-row class="mt-3">
          <v-col cols="6">
            <v-text-field
              v-model.number="x1"
              label="Вход 1"
              type="number"
              :rules="[(v) => (v >= 0 && v <= 255) || '0–255']"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="y1"
              label="Выход 1"
              type="number"
              :rules="[(v) => (v >= 0 && v <= 255) || '0–255']"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model.number="x2"
              label="Вход 2"
              type="number"
              :rules="[(v) => (v >= 0 && v <= 255) || '0–255']"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="y2"
              label="Выход 2"
              type="number"
              :rules="[(v) => (v >= 0 && v <= 255) || '0–255']"
            />
          </v-col>
        </v-row>

        <v-checkbox
          v-model="previewEnabled"
          label="Предпросмотр"
          class="mt-1"
          @change="applyPreview"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="reset">Сброс</v-btn>
        <v-btn text @click="close">Закрыть</v-btn>
        <v-btn color="primary" @click="applyCorrection">Применить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";

const props = defineProps({
  modelValue: Boolean,
  image: Object,
});

let originalImageSnapshot = null;

const emit = defineEmits(["update:modelValue", "apply"]);

const dialogVisible = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => (dialogVisible.value = v)
);
watch(dialogVisible, (v) => emit("update:modelValue", v));

const x1 = ref(0);
const y1 = ref(0);
const x2 = ref(255);
const y2 = ref(255);
const previewEnabled = ref(false);

let previewWasApplied = false;
let originalImageData = null;
let originalImage = null;

const rHistogram = ref(new Array(256).fill(0));
const gHistogram = ref(new Array(256).fill(0));
const bHistogram = ref(new Array(256).fill(0));

function getHistogram() {
  if (!props.image) return;

  if (!originalImageSnapshot) {
    originalImageSnapshot = new Image();
    originalImageSnapshot.src = props.image.src;
  }

  const canvas = document.createElement("canvas");
  canvas.width = props.image.width;
  canvas.height = props.image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(props.image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  originalImageData = imageData;

  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);

  for (let i = 0; i < imageData.data.length; i += 4) {
    r[imageData.data[i]]++;
    g[imageData.data[i + 1]]++;
    b[imageData.data[i + 2]]++;
  }

  rHistogram.value = normalize(r);
  gHistogram.value = normalize(g);
  bHistogram.value = normalize(b);
}

function normalize(hist) {
  const max = Math.max(...hist);
  return hist.map((v, i) => `${i},${255 - Math.round((v / max) * 255)}`).join(" ");
}

const rPoints = computed(() => rHistogram.value);
const gPoints = computed(() => gHistogram.value);
const bPoints = computed(() => bHistogram.value);

const linePoints = computed(() => {
  return `0,${255 - y1.value} ${x1.value},${255 - y1.value} ${x2.value},${
    255 - y2.value
  } 255,${255 - y2.value}`;
});

function generateLUT(x1, y1, x2, y2) {
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    if (i < x1) lut[i] = Math.round((y1 / x1) * i);
    else if (i > x2) lut[i] = Math.round(((255 - y2) / (255 - x2)) * (i - x2) + y2);
    else lut[i] = Math.round(((y2 - y1) / (x2 - x1)) * (i - x1) + y1);
  }
  return lut;
}

function applyToCanvas(lut) {
  const canvas = document.createElement("canvas");
  canvas.width = props.image.width;
  canvas.height = props.image.height;
  const ctx = canvas.getContext("2d");

  const newImageData = new ImageData(
    new Uint8ClampedArray(originalImageData.data),
    originalImageData.width,
    originalImageData.height
  );

  for (let i = 0; i < newImageData.data.length; i += 4) {
    const a = newImageData.data[i + 3];
    if (a === 0) continue; 

    newImageData.data[i] = lut[newImageData.data[i]];       
    newImageData.data[i + 1] = lut[newImageData.data[i + 1]]; 
    newImageData.data[i + 2] = lut[newImageData.data[i + 2]]; 
  }

  ctx.putImageData(newImageData, 0, 0);

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      const newImg = new Image();
      newImg.onload = () => resolve(newImg);
      newImg.src = canvas.toDataURL();
    });
  });
}


async function applyPreview() {
  if (!previewEnabled.value) {
    if (originalImageSnapshot) {
      emit("apply", originalImageSnapshot);
    }
    previewWasApplied = false;
    return;
  }

  const lut = generateLUT(x1.value, y1.value, x2.value, y2.value);
  const newImg = await applyToCanvas(lut);
  previewWasApplied = true;
  emit("apply", newImg);
}

async function applyCorrection() {
  const lut = generateLUT(x1.value, y1.value, x2.value, y2.value);
  const newImg = await applyToCanvas(lut);
  emit("apply", newImg);
  emit("update:modelValue", false);
}

async function reset() {
  x1.value = 0;
  y1.value = 0;
  x2.value = 255;
  y2.value = 255;
  previewEnabled.value = false;
  previewWasApplied = false;

  if (originalImageSnapshot) {
    emit("apply", originalImageSnapshot);
  }

  emit("update:modelValue", false);
}

async function close() {
  emit("update:modelValue", false);

  if (previewWasApplied && originalImageSnapshot) {
    emit("apply", originalImageSnapshot);
  }
}

watch(() => props.image, getHistogram);
onMounted(getHistogram);
</script>
