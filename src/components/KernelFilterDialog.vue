<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <v-card>
      <v-card-title class="text-h6">Фильтрация изображения (ядро)</v-card-title>
      <v-card-text>
        <v-select
          label="Пресет"
          :items="presets"
          v-model="selectedPreset"
          item-title="label"
          item-value="value"
          @update:modelValue="applyPreset"
        />

        <div class="kernel-grid">
          <div
            v-for="(val, i) in kernelValues"
            :key="i"
            class="kernel-cell"
          >
            <v-text-field
              v-model.number="kernelValues[i]"
              type="number"
              hide-details
              density="compact"
            />
          </div>
        </div>

        <v-checkbox
          v-model="previewEnabled"
          label="Предпросмотр"
          class="mt-3"
          @change="applyPreview"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="close">Закрыть</v-btn>
        <v-btn color="primary" @click="apply">Применить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { applyKernelFilter } from '@/utils/filters';

const props = defineProps({
  modelValue: Boolean,
  image: Object,
});
const emit = defineEmits(['update:modelValue', 'apply']);

const dialogVisible = ref(props.modelValue);
watch(() => props.modelValue, v => (dialogVisible.value = v));
watch(dialogVisible, v => emit('update:modelValue', v));

const previewEnabled = ref(false);
let originalImageSnapshot = null;

const kernelValues = ref(new Array(9).fill(0));

const presets = [
  { label: 'Тождественное отображение', value: [0, 0, 0, 0, 1, 0, 0, 0, 0] },
  { label: 'Повышение резкости', value: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
  { label: 'Гаусс 3x3', value: [1, 2, 1, 2, 4, 2, 1, 2, 1] },
  { label: 'Прямоугольное размытие', value: [1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { label: 'Прюитт X', value: [-1, 0, 1, -1, 0, 1, -1, 0, 1] },
  { label: 'Прюитт Y', value: [-1, -1, -1, 0, 0, 0, 1, 1, 1] },
];

const selectedPreset = ref(null);

function applyPreset(preset) {
  if (preset) kernelValues.value = [...preset];
  applyPreview();
}

function reset() {
  kernelValues.value = new Array(9).fill(0);
  selectedPreset.value = null;
  previewEnabled.value = false;
  if (originalImageSnapshot) emit('apply', originalImageSnapshot);
  emit('update:modelValue', false);
}

function close() {
  if (previewEnabled.value && originalImageSnapshot) emit('apply', originalImageSnapshot);
  emit('update:modelValue', false);
}

async function apply() {
  const result = await applyKernelFilter(props.image, kernelValues.value);
  emit('apply', result);
  emit('update:modelValue', false);
}

async function applyPreview() {
  if (!previewEnabled.value) {
    if (originalImageSnapshot) emit('apply', originalImageSnapshot);
    return;
  }
  const result = await applyKernelFilter(props.image, kernelValues.value);
  emit('apply', result);
}

onMounted(() => {
  if (props.image) {
    originalImageSnapshot = new Image();
    originalImageSnapshot.src = props.image.src;
  }
});
</script>

<style scoped>
.kernel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 12px;
}
.kernel-cell {
  max-width: 60px;
}
</style>