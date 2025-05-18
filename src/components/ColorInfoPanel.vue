<template>
  <v-card
    v-if="firstColor"
    style="position: absolute; bottom: 60px; right: 10px; z-index: 20; max-width: 397px"
  >
    <v-card-title>Информация о цветах</v-card-title>
    <v-card-text>
      <div class="d-flex justify-space-between mb-2">
        <div>
          <div>Цвет 1:</div>
          <div class="swatch" :style="{ backgroundColor: colorToCss(firstColor) }"></div>
        </div>
        <div v-if="secondColor">
          <div>Цвет 2:</div>
          <div class="swatch" :style="{ backgroundColor: colorToCss(secondColor) }"></div>
        </div>
      </div>

      <v-divider class="my-2"></v-divider>

      <div class="d-flex justify-space-between mb-2">
        <div>
          <b>Цвет 1</b><br />
          <b>Позиция:</b> ({{ firstColor.x ?? "-" }}, {{ firstColor.y ?? "-" }})<br />
          <b>RGB:</b> {{ formatRgb(firstColor) }}<br />
          <b>XYZ:</b> {{ formatXyz(firstColor) }}<br />
          <b>Lab:</b> {{ formatLab(firstColor) }}<br />
          <b>OKLch:</b> {{ formatOklch(firstColor) }}
        </div>

        <div v-if="secondColor">
          <b>Цвет 2</b><br />
          <b>Позиция:</b> ({{ secondColor.x ?? "-" }}, {{ secondColor.y ?? "-" }})<br />
          <b>RGB:</b> {{ formatRgb(secondColor) }}<br />
          <b>XYZ:</b> {{ formatXyz(secondColor) }}<br />
          <b>Lab:</b> {{ formatLab(secondColor) }}<br />
          <b>OKLch:</b> {{ formatOklch(secondColor) }}
        </div>
      </div>

      <v-divider class="my-2" v-if="secondColor"></v-divider>

      <div v-if="firstColor && secondColor">
        <b>Контраст:</b> {{ contrast.toFixed(2) }}
        <v-chip
          :color="contrast >= 4.5 ? 'green' : 'red'"
          text-color="white"
          class="ma-2"
          small
        >
          {{ contrast >= 4.5 ? "Достаточный" : "Недостаточный" }}
        </v-chip>
      </div>

      <div v-else>
        Выберите второй цвет для расчета контраста (нажмите с Alt / Ctrl / Shift)
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { rgbToXyz, xyzToLab, labToOklch, getContrast } from "../utils/colorConverters";

const props = defineProps({
  firstColor: Object,
  secondColor: Object,
});

function colorToCss(color) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}

function formatRgb(color) {
  return `${color.r}, ${color.g}, ${color.b}`;
}

function formatXyz(color) {
  const { x, y, z } = rgbToXyz(color);
  return `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
}

function formatLab(color) {
  const xyz = rgbToXyz(color);
  const { l, a, b } = xyzToLab(xyz);
  return `${l.toFixed(2)}, ${a.toFixed(2)}, ${b.toFixed(2)}`;
}

function formatOklch(color) {
  const xyz = rgbToXyz(color);
  const lab = xyzToLab(xyz);
  const { l, c, h } = labToOklch(lab);
  return `${l.toFixed(2)}, ${c.toFixed(2)}, ${h.toFixed(2)}`;
}

const contrast = computed(() => {
  if (!props.firstColor || !props.secondColor) return 0;
  return getContrast(props.firstColor, props.secondColor);
});
</script>

<style scoped>
.swatch {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
