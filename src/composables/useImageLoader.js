import { ref, computed, nextTick } from "vue";
import { parseGB7 } from "@/utils/gb7Parser";

export function useImageLoader(canvasRef) {
  const fileError = ref(false);
  const loadError = ref(false);
  const imageLoaded = ref(false);
  const imageWidth = ref(0);
  const imageHeight = ref(0);
  const hasAlpha = ref(false);
  const isGrayBit = ref(false);
  const hasMask = ref(false);

  const depthText = computed(() => {
    if (!imageLoaded.value) return "—";
    if (isGrayBit.value)
      return `7-бит серого${hasMask.value ? " + маска" : ""}`;
    return hasAlpha.value ? "32-бит RGBA" : "24-бит RGB";
  });

  const loadImage = async (file, resetInput) => {
    fileError.value = false;
    loadError.value = false;

    if (!file) {
      fileError.value = true;
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "gb7") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const { width, height, imgData, mask } = parseGB7(e.target.result);
          imageWidth.value = width;
          imageHeight.value = height;
          hasMask.value = mask;
          isGrayBit.value = true;
          imageLoaded.value = true;

          await nextTick();
          const ctx = canvasRef.value.getContext("2d");
          canvasRef.value.width = width;
          canvasRef.value.height = height;
          ctx.putImageData(imgData, 0, 0);
        } catch (err) {
          loadError.value = true;
        } finally {
          resetInput();
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const ctx = canvasRef.value.getContext("2d");
        canvasRef.value.width = img.width;
        canvasRef.value.height = img.height;
        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        hasAlpha.value = [...data].some((_, i) => i % 4 === 3 && data[i] < 255);

        imageWidth.value = img.width;
        imageHeight.value = img.height;
        isGrayBit.value = false;
        hasMask.value = false;
        imageLoaded.value = true;

        URL.revokeObjectURL(imageUrl);
        resetInput();
      };

      img.onerror = () => {
        loadError.value = true;
        URL.revokeObjectURL(imageUrl);
        resetInput();
      };

      img.src = imageUrl;
    }
  };

  return {
    loadImage,
    fileError,
    loadError,
    imageLoaded,
    imageWidth,
    imageHeight,
    depthText,
  };
}
