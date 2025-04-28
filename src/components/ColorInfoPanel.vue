<template>
  <v-card
    v-if="firstColor"
    class="pa-3"
    style="position: absolute; top: 20px; left: 20px; z-index: 20; max-width: 300px"
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

      <div v-if="firstColor">
        <b>RGB:</b> {{ formatRgb(firstColor) }}
        <v-tooltip bottom>
          <template #activator="{ props }">
            <v-icon v-bind="props" small>mdi-information</v-icon>
          </template>
          <span>R, G, B ∈ [0..255]</span>
        </v-tooltip>
        <br />
        <b>XYZ:</b> {{ formatXyz(firstColor) }}
        <v-tooltip bottom>
          <template #activator="{ props }">
            <v-icon v-bind="props" small>mdi-information</v-icon>
          </template>
          <span>X, Y, Z описывают восприятие цвета, нормализованные</span>
        </v-tooltip>
        <br />
        <b>Lab:</b> {{ formatLab(firstColor) }}
        <v-tooltip bottom>
          <template #activator="{ props }">
            <v-icon v-bind="props" small>mdi-information</v-icon>
          </template>
          <span>L=яркость, a=зеленый-красный, b=синий-желтый</span>
        </v-tooltip>
        <br />
        <b>OKLch:</b> {{ formatOklch(firstColor) }}
        <v-tooltip bottom>
          <template #activator="{ props }">
            <v-icon v-bind="props" small>mdi-information</v-icon>
          </template>
          <span>L=Lightness, C=Chroma, h=Hue</span>
        </v-tooltip>
      </div>

      <v-divider class="my-2"></v-divider>

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
import { rgbToXyz, xyzToLab, labToOklch, getContrast } from "@/utils/colorConverters";

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
