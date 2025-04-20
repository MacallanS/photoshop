<template>
  <v-file-input
    :key="inputKey"
    v-model="modelValue"
    label="Файл изображения (.png, .jpg, .gb7)"
    accept=".png, .jpg, .jpeg, .gb7"
    :error="error"
    :error-messages="error ? ['Файл обязателен'] : []"
  />
</template>

<script setup>
defineProps({
  modelValue: File,
  inputKey: Number,
  error: Boolean,
});
defineEmits(["update:modelValue"]);
</script>
