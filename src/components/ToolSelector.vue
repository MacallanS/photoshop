<template>
  <v-card
    class="d-flex flex-column align-center pa-2"
    style="position: absolute; top: 10px; right: 450px; z-index: 50; width: 80px"
  >
    <v-btn
      icon
      :color="activeTool === 'hand' ? 'primary' : ''"
      @click="$emit('update:activeTool', 'hand')"
      title="Инструмент: Рука (горячая клавиша H)"
    >
      <v-icon>mdi-hand-back-right-outline</v-icon>
    </v-btn>

    <v-btn
      icon
      :color="activeTool === 'eyedropper' ? 'primary' : ''"
      @click="$emit('update:activeTool', 'eyedropper')"
      title="Инструмент: Пипетка (горячая клавиша E)"
    >
      <v-icon>mdi-eyedropper</v-icon>
    </v-btn>
  </v-card>
</template>

<script setup>
defineProps({
  activeTool: String,
});
defineEmits(["update:activeTool"]);
</script>
