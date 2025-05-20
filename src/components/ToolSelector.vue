<template>
  <v-card
    class="d-flex flex align-center pa-2"
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
