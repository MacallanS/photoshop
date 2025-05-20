<template>
  <v-card class="pa-2 layer-panel">
    <v-toolbar density="compact" flat>
      <v-toolbar-title class="text-h6">Слои</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="$emit('add-layer')" size="small" title="Добавить слой">
        <v-icon size="small">mdi-plus</v-icon>
      </v-btn>
    </v-toolbar>

    <v-list density="compact">
      <v-list-item
        v-for="(layer, rIndex) in reversedLayers"
        :key="layer.id"
        :class="['layer-item', { 'active-layer': layer.id === activeLayerId }]"
        @click="$emit('update:activeLayerId', layer.id)"
      >
        <template #prepend>
          <v-img
            :src="layer.preview"
            alt="Превью"
            class="layer-thumbnail me-2"
            width="48"
            height="48"
            cover
          />
        </template>

        <div class="d-flex flex-column flex-grow-1">
          <div class="text-subtitle-2 d-flex justify-between align-center">
            {{ truncateName(layer.name) }}
            <div class="d-flex">
              <v-btn
                v-if="rIndex < reversedLayers.length - 1"
                icon
                size="x-small"
                variant="text"
                @click.stop="$emit('move-layer-up', props.layers.indexOf(layer))"
              >
                <v-icon size="18">mdi-arrow-up</v-icon>
              </v-btn>
              <v-btn
                v-if="rIndex > 0"
                icon
                size="x-small"
                variant="text"
                @click.stop="$emit('move-layer-down', props.layers.indexOf(layer))"
              >
                <v-icon size="18">mdi-arrow-down</v-icon>
              </v-btn>
            </div>
          </div>

          <v-row align="center" class="mt-1">
            <v-col cols="8">
              <v-tooltip location="bottom">
                <template #activator="{ props: tooltipProps }">
                  <v-slider
                    v-bind="tooltipProps"
                    v-model="layer.opacity"
                    min="0"
                    max="1"
                    step="0.01"
                    hide-details
                    density="compact"
                    @update:modelValue="$emit('update-layer', { ...layer })"
                  />
                </template>
                <span
                  >Настройка прозрачности (0 — полностью прозрачный, 1 —
                  непрозрачный)</span
                >
              </v-tooltip>
            </v-col>
            <v-col cols="4">
              <v-tooltip location="bottom">
                <template #activator="{ props: tooltipProps }">
                  <v-select
                    v-bind="tooltipProps"
                    :items="blendModes"
                    item-title="value"
                    item-value="value"
                    v-model="layer.blendMode"
                    density="compact"
                    hide-details
                    @update:modelValue="$emit('update-layer', layer)"
                  />
                </template>
                <span>
                  {{ blendModes.find((m) => m.value === layer.blendMode)?.text }}
                </span>
              </v-tooltip>
            </v-col>
          </v-row>
        </div>

        <template #append>
          <v-btn
            icon
            size="x-small"
            @click.stop="$emit('toggle-visibility', layer.id)"
            :title="layer.visible ? 'Скрыть слой' : 'Показать слой'"
          >
            <v-icon>{{ layer.visible ? "mdi-eye" : "mdi-eye-off" }}</v-icon>
          </v-btn>

          <v-btn
            v-if="layer.hasAlpha"
            icon
            size="x-small"
            color="blue"
            @click.stop="$emit('toggle-layer-alpha', layer.id)"
            title="Скрыть/показать альфа-канал"
          >
            <v-icon>mdi-alpha-a</v-icon>
          </v-btn>

          <v-btn
            v-if="layer.hasAlpha"
            icon
            size="x-small"
            color="red"
            @click.stop="$emit('remove-layer-alpha', layer.id)"
            title="Удалить альфа-канал"
          >
            <v-icon>mdi-alpha-a</v-icon>
          </v-btn>

          <v-btn
            icon
            size="x-small"
            color="red"
            @click.stop="$emit('remove-layer', layer.id)"
            title="Удалить слой"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
import { computed, watchEffect } from "vue";

const props = defineProps({
  layers: Array,
  activeLayerId: Number,
});

defineEmits([
  "add-layer",
  "remove-layer",
  "remove-layer-alpha",
  "toggle-layer-alpha",
  "toggle-visibility",
  "update:activeLayerId",
  "update-layer",
  "move-layer-up",
  "move-layer-down",
]);

const blendModes = [
  { value: "normal", text: "Обычный — верхний слой перекрывает нижний." },
  { value: "multiply", text: "Умножение — делает изображение темнее." },
  { value: "screen", text: "Экран — делает изображение светлее." },
  { value: "overlay", text: "Наложение — усиливает контраст." },
];

const reversedLayers = computed(() => props.layers.slice().reverse());

function truncateName(name) {
  return name.length > 12 ? name.slice(0, 12) + "…" : name;
}

watchEffect(() => {
  for (const layer of props.layers) {
    if (!layer.image) continue;
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = 48;
    previewCanvas.height = 48;
    const ctx = previewCanvas.getContext("2d");
    ctx.drawImage(layer.image, 0, 0, 48, 48);
    layer.preview = previewCanvas.toDataURL();
  }
});
</script>

<style scoped>
.layer-panel {
  background-color: #2a2a2a;
}
.layer-item {
  border-left: 3px solid transparent;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.layer-item:hover {
  background-color: #393939;
}
.active-layer {
  border-left-color: #1976d2;
  background-color: #303030;
}
.layer-thumbnail {
  border-radius: 4px;
  object-fit: cover;
  background-color: #444;
}
</style>
