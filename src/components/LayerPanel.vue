<template>
  <v-card
    class="pa-2"
    style="max-height: 400px; overflow-y: auto; background-color: #2a2a2a"
  >
    <v-toolbar density="compact" flat>
      <v-toolbar-title class="text-h6">Слои</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="$emit('add-layer')">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-toolbar>

    <v-list density="compact">
      <v-list-item
        v-for="layer in layers"
        :key="layer.id"
        :class="{ 'border border-primary': layer.id === activeLayerId }"
        @click="$emit('update:activeLayerId', layer.id)"
      >
        <template #prepend>
          <v-avatar size="40" class="me-2">
            <v-img :src="layer.preview" alt="Preview" />
          </v-avatar>
        </template>

        <div class="d-flex flex-column flex-grow-1">
          <div class="text-subtitle-2">{{ layer.name }}</div>

          <v-row align="center" class="mt-1">
            <v-col cols="8">
              <v-slider
                v-model="layer.opacity"
                min="0"
                max="1"
                step="0.01"
                hide-details
                density="compact"
                @update:modelValue="() => $emit('update-layer', { ...layer })"
              />
            </v-col>
            <v-col cols="4">
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-select
                    v-bind="props"
                    :items="blendModes"
                    item-title="value"
                    item-value="value"
                    v-model="layer.blendMode"
                    density="compact"
                    hide-details
                    @update:modelValue="$emit('update-layer', layer)"
                  />
                </template>
                <span>{{
                  blendModes.find((m) => m.value === layer.blendMode)?.text
                }}</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </div>

        <template #append>
          <v-btn icon @click.stop="$emit('toggle-visibility', layer.id)">
            <v-icon>{{ layer.visible ? "mdi-eye" : "mdi-eye-off" }}</v-icon>
          </v-btn>
          <v-btn icon @click.stop="$emit('remove-layer', layer.id)">
            <v-icon color="red">mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-item @click="$emit('toggle-alpha-visibility')" class="alpha-action">
        <template #prepend>
          <v-icon class="me-2">mdi-alpha-a</v-icon>
        </template>
        <v-list-item-title>Скрыть альфа-каналы</v-list-item-title>
      </v-list-item>

      <v-list-item @click="$emit('remove-alpha-channels')" class="alpha-action">
        <template #prepend>
          <v-icon class="me-2" color="red">mdi-alpha-a</v-icon>
        </template>
        <v-list-item-title class="text-red">Удалить альфа-каналы</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
const props = defineProps({
  layers: Array,
  activeLayerId: Number,
});

const emit = defineEmits([
  "add-layer",
  "remove-layer",
  "toggle-visibility",
  "update:activeLayerId",
  "update-layer",
  "toggle-alpha-visibility",
  "remove-alpha-channels",
]);

const blendModes = [
  { value: "normal", text: "Обычный — верхний слой перекрывает нижний." },
  { value: "multiply", text: "Умножение — делает изображение темнее." },
  { value: "screen", text: "Экран — делает изображение светлее." },
  { value: "overlay", text: "Наложение — усиливает контраст." },
];
</script>

<style scoped>
.alpha-action {
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.alpha-action:hover {
  background-color: #3a3a3a;
}
</style>
