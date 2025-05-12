<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <v-card>
      <v-card-title class="text-h6">Изменение размера</v-card-title>
      <v-card-text>
        <v-select
          v-model="unit"
          :items="['Проценты', 'Пиксели']"
          label="Единицы"
        />

        <v-row>
          <v-col>
            <v-text-field
              v-model.number="width"
              @input="lastChanged = 'width'"
              :label="unit === 'Проценты' ? 'Ширина (%)' : 'Ширина (px)'"
              type="number"
              :rules="[(v) => v > 0 || 'Введите положительное число']"
            />
          </v-col>
          <v-col>
            <v-text-field
              v-model.number="height"
              @input="lastChanged = 'height'"
              :label="unit === 'Проценты' ? 'Высота (%)' : 'Высота (px)'"
              type="number"
              :rules="[(v) => v > 0 || 'Введите положительное число']"
            />
          </v-col>
        </v-row>

        <v-checkbox v-model="keepRatio" label="Сохранять пропорции" />

        <v-select
          v-model="algorithm"
          :items="[
            { title: 'Ближайший сосед', value: 'nearest' },
            { title: 'Билинейная интерполяция', value: 'bilinear' },
          ]"
          label="Алгоритм интерполяции"
          item-title="title"
          item-value="value"
        />

        <div class="mt-3 text-caption">
          Старый размер: {{ formattedOldPixels }} px<br />
          Новый: {{ formattedNewPixels }} px ({{ resultMegapixels }} Mpx)
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="close">Отмена</v-btn>
        <v-btn color="primary" @click="emitResize">Применить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  currentWidth: Number,
  currentHeight: Number,
});
const emit = defineEmits(["update:modelValue", "resize"]);

const dialogVisible = ref(props.modelValue);
watch(() => props.modelValue, (v) => {
  dialogVisible.value = v;
});
watch(dialogVisible, (v) => emit("update:modelValue", v));

const width = ref(100);
const height = ref(100);
const unit = ref("Пиксели");
const keepRatio = ref(false);
const algorithm = ref("bilinear");
const lastChanged = ref("width");

watch(
  dialogVisible,
  (open) => {
    if (open) {
      if (unit.value === "Проценты") {
        width.value = 100;
        height.value = 100;
      } else {
        width.value = props.currentWidth;
        height.value = props.currentHeight;
      }
    }
  },
  { immediate: true }
);

const aspectRatio = computed(() =>
  props.currentHeight !== 0 ? props.currentWidth / props.currentHeight : 1
);

watch([width, height, unit, keepRatio], ([w, h, u, kr]) => {
  if (!kr) return;
  if (u === "Проценты") {
    if (lastChanged.value === "width") {
      height.value = w;
    } else {
      width.value = h;
    }
  } else {
    if (lastChanged.value === "width") {
      height.value = Math.round(w / aspectRatio.value);
    } else {
      width.value = Math.round(h * aspectRatio.value);
    }
  }
});

const resultWidth = computed(() =>
  unit.value === "Проценты"
    ? Math.round((props.currentWidth * width.value) / 100)
    : width.value
);
const resultHeight = computed(() =>
  unit.value === "Проценты"
    ? Math.round((props.currentHeight * height.value) / 100)
    : height.value
);

const resultPixels = computed(() => resultWidth.value * resultHeight.value);
const resultMegapixels = computed(() => (resultPixels.value / 1_000_000).toFixed(2));
const formattedOldPixels = computed(() =>
  (props.currentWidth * props.currentHeight).toLocaleString("ru-RU")
);
const formattedNewPixels = computed(() =>
  resultPixels.value.toLocaleString("ru-RU")
);

function emitResize() {
  emit("resize", {
    width: resultWidth.value,
    height: resultHeight.value,
    algorithm: algorithm.value,
  });
  emit("update:modelValue", false);
}

function close() {
  emit("update:modelValue", false);
}
</script>
