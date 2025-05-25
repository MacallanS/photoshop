<template>
  <v-card v-if="firstColor" style="position: absolute; bottom: 60px; right: 10px; z-index: 20; max-width: 23.5%">
    <v-card-title>Информация о цветах</v-card-title>
    <v-card-text>
      <div class="d-flex justify-space-between mb-2">
        <div>
          <div>Цвет 1:</div>
          <div class="swatch" :style="{ backgroundColor: colorToCss(firstColor) }" />
        </div>
        <div v-if="secondColor">
          <div>Цвет 2:</div>
          <div class="swatch" :style="{ backgroundColor: colorToCss(secondColor) }" />
        </div>
      </div>

      <v-divider class="my-2"></v-divider>

      <table class="color-table">
        <thead>
          <tr>
            <th>Модель</th>
            <th>
              Цвет 1
            </th>
            <th v-if="secondColor">
              Цвет 2
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>Позиция</b></td>
            <td>({{ firstColor.x ?? "-" }}, {{ firstColor.y ?? "-" }})</td>
            <td v-if="secondColor">({{ secondColor.x ?? "-" }}, {{ secondColor.y ?? "-" }})</td>
          </tr>
          <tr>
            <td>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <span v-bind="props"><b>RGB</b></span>
                </template>
                Red, Green, Blue (sRGB)
              </v-tooltip>
            </td>
            <td>{{ formatRgb(firstColor) }}</td>
            <td v-if="secondColor">{{ formatRgb(secondColor) }}</td>
          </tr>
          <tr>
            <td>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <span v-bind="props"><b>XYZ</b></span>
                </template>
                CIE 1931 XYZ — линейное представление спектра
              </v-tooltip>
            </td>
            <td>{{ formatXyz(firstColor) }}</td>
            <td v-if="secondColor">{{ formatXyz(secondColor) }}</td>
          </tr>
          <tr>
            <td>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <span v-bind="props"><b>Lab</b></span>
                </template>
                CIELAB — перцептивное пространство цвета
              </v-tooltip>
            </td>
            <td>{{ formatLab(firstColor) }}</td>
            <td v-if="secondColor">{{ formatLab(secondColor) }}</td>
          </tr>
          <tr>
            <td>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <span v-bind="props"><b>OKLCH</b></span>
                </template>
                OKLCH — современное перцептивное пространство с лучшей яркостной линейностью
              </v-tooltip>
            </td>
            <td>{{ formatOklch(firstColor) }}</td>
            <td v-if="secondColor">{{ formatOklch(secondColor) }}</td>
          </tr>
        </tbody>
      </table>

      <v-divider class="my-2" v-if="secondColor"></v-divider>

      <div v-if="firstColor && secondColor">
        <b>Контраст:</b> {{ contrast.toFixed(2) }}
        <v-chip :color="contrast >= 4.5 ? 'green' : 'red'" text-color="white" class="ma-2" small>
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
import {
  convertRgbToXyz,
  convertXyzToLab,
  convertLabToLch,
  convertRgbToOklab,
  convertOklabToOklch,
  calculateContrast,
} from "../utils/colorConverters";

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
  const { x, y, z } = convertRgbToXyz(color);
  return `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
}

function formatLab(color) {
  const xyz = convertRgbToXyz(color);
  const { l, a, b } = convertXyzToLab(xyz);
  return `${l.toFixed(2)}, ${a.toFixed(2)}, ${b.toFixed(2)}`;
}

function formatOklch(color) {
  const oklab = convertRgbToOklab(color);
  const { l, c, h } = convertOklabToOklch(oklab);
  return `${l.toFixed(4)}, ${c.toFixed(4)}, ${h.toFixed(2)}`;
}

const contrast = computed(() => {
  if (!props.firstColor || !props.secondColor) return 0;
  return calculateContrast(props.firstColor, props.secondColor);
});
</script>


<style scoped>
.swatch {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.color-table {
  width: 100%;
  font-size: 0.85rem;
  border-collapse: collapse;
}

.color-table th,
.color-table td {
  padding: 4px 8px;
  text-align: left;
  vertical-align: top;
}
</style>
