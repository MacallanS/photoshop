<template>
  <v-dialog v-model="show" max-width="400">
    <v-card>
      <v-card-title>Добавить слой</v-card-title>

      <v-card-text>
        <v-color-picker v-model="color" hide-mode-picker />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="show = false">Отмена</v-btn>
        <v-btn color="primary" @click="submit">Добавить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const color = ref("#ff0000");

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(["update:modelValue", "add-layer"]);

const show = ref(props.modelValue);
watch(
  () => props.modelValue,
  (val) => (show.value = val)
);
watch(show, (val) => emit("update:modelValue", val));

function submit() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.onload = () => {
    emit("add-layer", {
      name: "Цветной слой",
      image: img,
      isAlpha: false,
    });
    show.value = false;
  };
  img.src = canvas.toDataURL();
}
</script>
