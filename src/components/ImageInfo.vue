<template>
  <v-card
    color="grey-lighten-4"
    flat
    class="pa-3"
    style="position: absolute; bottom: 20px; right: 20px; z-index: 10; max-width: 250px"
  >
    <div class="text-subtitle-2 mb-2">Информация</div>
    <v-list-item>
      <v-list-item-title>Ширина:</v-list-item-title>
      <v-list-item-subtitle>{{ width }} px</v-list-item-subtitle>
    </v-list-item>
    <v-list-item>
      <v-list-item-title>Высота:</v-list-item-title>
      <v-list-item-subtitle>{{ height }} px</v-list-item-subtitle>
    </v-list-item>
    <v-list-item>
      <v-list-item-title>Глубина цвета:</v-list-item-title>
      <v-list-item-subtitle>{{ depth }}</v-list-item-subtitle>
    </v-list-item>
  </v-card>
</template>

<script setup>
defineProps({
  width: Number,
  height: Number,
  depth: String,
});
</script>
