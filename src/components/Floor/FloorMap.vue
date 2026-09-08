<template>
  <section class="floor-section" aria-labelledby="floor-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">STORE LAYOUT</p>
        <h2 id="floor-title">Floor map</h2>
      </div>
      <span class="resize-note">Drag the lower-right corner to resize</span>
    </div>

    <div class="map-stage-shell">
      <div class="map-stage" :style="mapSizeStyle">
        <img :src="storeMap" alt="Store floor plan" class="store-map" />
        <svg
          class="boundary-overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Defined BLE coverage boundary"
        >
          <polygon :points="floorBoundary" />
        </svg>
        <span
          v-for="beacon in beacons"
          :key="beacon.id"
          class="beacon-marker"
          :class="beacon.distance"
          :style="{ left: `${beacon.x}%`, top: `${beacon.y}%` }"
          :title="`${beacon.id} · ${beacon.rssi} dBm · ${beacon.distance}`"
          ><span
        /></span>
        <button
          v-for="scanner in scanners"
          :key="scanner.id"
          class="scanner-marker"
          :class="{ offline: scanner.status === 'Offline' }"
          :style="{ left: `${scanner.x}%`, top: `${scanner.y}%` }"
          :aria-label="`${scanner.id}, ${scanner.zone}, ${scanner.status}`"
          @click="selectedScanner = scanner.id"
        >
          <span class="pulse-ring" />
          <span class="scanner-pin"><span class="mdi mdi-bluetooth" /></span>
          <span class="scanner-label">{{ scanner.id }}</span>
        </button>
        <div v-if="activeScanner" class="scanner-popover">
          <button
            class="close"
            aria-label="Close scanner details"
            @click="selectedScanner = null"
          >
            ×
          </button>
          <strong>{{ activeScanner.id }}</strong>
          <span>{{ activeScanner.zone }}</span>
          <span>{{ activeScanner.status }} · {{ activeScanner.rssi }} dBm</span>
          <span>Max RSSI · {{ activeScanner.maxRssi }} dBm</span>
          <span
            >{{
              activeScanner.observations.toLocaleString("en-IN")
            }}
            observations/min</span
          >
        </div>
        <button
          class="resize-handle"
          aria-label="Resize map"
          title="Drag to resize map"
          @pointerdown="startResize"
        />
      </div>
    </div>

    <footer class="map-footer">
      <span v-for="scanner in scanners" :key="scanner.id" class="legend-item">
        <i :class="{ offline: scanner.status === 'Offline' }" />
        <b>{{ scanner.id }}</b> {{ scanner.zone }}
      </span>
    </footer>
  </section>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref } from "vue";
import storeMap from "@/assets/map/soldam_map.svg";

type Scanner = {
  id: string;
  zone: string;
  status: "Online" | "Offline";
  rssi: number;
  observations: number;
  maxRssi: number;
  x: number;
  y: number;
};

const selectedScanner = ref<string | null>("SCN001");
const props = defineProps<{ scanners: Scanner[] }>();
const scanners = props.scanners;
const mapWidth = ref(1280);
const mapHeight = ref(Math.round(mapWidth.value / (1814 / 1073)));
const mapAspectRatio = 1814 / 1073;
const mapSizeStyle = computed(() => ({
  width: `${mapWidth.value}px`,
  height: `${mapHeight.value}px`,
}));
const activeScanner = computed(() =>
  props.scanners.find((scanner) => scanner.id === selectedScanner.value),
);
const beacons = [
  { id: "BCN-A01", x: 13.5, y: 43, rssi: -44, distance: "near" },
  { id: "BCN-A02", x: 21, y: 53, rssi: -68, distance: "far" },
  { id: "BCN-B01", x: 57.5, y: 31.5, rssi: -48, distance: "near" },
  { id: "BCN-B02", x: 68, y: 38, rssi: -72, distance: "far" },
  { id: "BCN-C01", x: 82.5, y: 75, rssi: -47, distance: "near" },
  { id: "BCN-C02", x: 70, y: 68, rssi: -76, distance: "far" },
];
const floorBoundary =
  "19.6,25.4 31,16 46,16 45.7,21.4 56.5,21 56.8,31.5 77,31.7 77,76 45.7,75.5 45.6,80 20,79.5";

let resizeStartX = 0;
let resizeStartWidth = 0;
let resizing = false;
const resizeMap = (event: PointerEvent) => {
  if (!resizing) return;
  const nextWidth = Math.min(
    1600,
    Math.max(640, resizeStartWidth + event.clientX - resizeStartX),
  );
  mapWidth.value = Math.round(nextWidth);
  mapHeight.value = Math.round(nextWidth / mapAspectRatio);
};
const stopResize = () => {
  resizing = false;
  window.removeEventListener("pointermove", resizeMap);
  window.removeEventListener("pointerup", stopResize);
};
const startResize = (event: PointerEvent) => {
  event.preventDefault();
  resizeStartX = event.clientX;
  resizeStartWidth = mapWidth.value;
  resizing = true;
  window.addEventListener("pointermove", resizeMap);
  window.addEventListener("pointerup", stopResize);
};
onUnmounted(stopResize);
</script>

<style scoped>
.floor-section {
  width: 100%;
  overflow: hidden;
  border-top: 1px solid #e4deef;
  background: #fff;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 17px 20px;
  border-bottom: 1px solid #e4deef;
}
.eyebrow {
  margin: 0 0 3px;
  color: #6c3fb5;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}
h2 {
  margin: 0;
  color: #2e006d;
  font-size: 18px;
}
.resize-note {
  color: #6a6180;
  font-size: 12px;
}
.map-stage-shell {
  overflow: auto;
  padding: 18px;
  background: #111;
}
.map-stage {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  background: #111;
}
.store-map {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.boundary-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.boundary-overlay polygon {
  fill: rgba(229, 27, 35, 0.08);
  stroke: #e51b23;
  stroke-width: 0.65;
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
}
.beacon-marker {
  position: absolute;
  z-index: 1;
  width: 18px;
  height: 18px;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 5px rgba(27, 21, 38, 0.35);
}
.beacon-marker span {
  display: block;
  width: 5px;
  height: 5px;
  margin: 4px auto;
  border-radius: 50%;
  background: #fff;
}
.beacon-marker.near {
  background: #0e7c86;
  box-shadow:
    0 0 0 5px rgba(14, 124, 134, 0.2),
    0 1px 5px rgba(27, 21, 38, 0.35);
}
.beacon-marker.far {
  width: 14px;
  height: 14px;
  background: #c55a11;
  opacity: 0.72;
}
.beacon-marker.far span {
  width: 4px;
  height: 4px;
  margin: 3px auto;
}
.scanner-marker {
  position: absolute;
  z-index: 2;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  transform: translate(-50%, -50%);
}
.scanner-pin {
  position: absolute;
  inset: 8px;
  display: grid;
  place-items: center;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #e51b23;
  color: #fff;
  box-shadow: 0 2px 8px rgba(27, 21, 38, 0.35);
}
.scanner-pin .mdi {
  font-size: 19px;
}
.pulse-ring {
  position: absolute;
  inset: 1px;
  border: 3px solid #e51b23;
  border-radius: 50%;
  animation: scanner-pulse 2s infinite;
}
.scanner-marker:hover .scanner-pin,
.scanner-marker:focus-visible .scanner-pin {
  background: #6c3fb5;
}
.scanner-marker.offline .scanner-pin {
  background: #c00000;
}
.scanner-marker.offline .pulse-ring {
  border-color: #c00000;
  animation: none;
}
.scanner-label {
  position: absolute;
  top: 45px;
  left: 50%;
  padding: 3px 7px;
  border-radius: 4px;
  background: #1b1526;
  color: #fff;
  font:
    600 11px "Roboto Mono",
    monospace;
  transform: translateX(-50%);
  white-space: nowrap;
}
.scanner-popover {
  position: absolute;
  z-index: 3;
  top: 18px;
  right: 18px;
  display: grid;
  gap: 3px;
  min-width: 190px;
  padding: 13px 36px 13px 14px;
  border: 1px solid #e4deef;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 5px 18px rgba(27, 21, 38, 0.16);
  font-size: 12px;
}
.scanner-popover strong {
  color: #2e006d;
  font:
    700 13px "Roboto Mono",
    monospace;
}
.scanner-popover span {
  color: #6a6180;
}
.close {
  position: absolute;
  top: 5px;
  right: 8px;
  border: 0;
  background: none;
  color: #6a6180;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 4;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px 0 0;
  background: linear-gradient(
    135deg,
    transparent 0 42%,
    #e51b23 43% 49%,
    transparent 50% 62%,
    #e51b23 63% 69%,
    transparent 70%
  );
  cursor: nwse-resize;
}
.map-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 13px 20px;
  border-top: 1px solid #e4deef;
  color: #6a6180;
  font-size: 12px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.legend-item i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #e51b23;
}
.legend-item i.offline {
  background: #c00000;
}
@keyframes scanner-pulse {
  0%,
  100% {
    opacity: 0.8;
    transform: scale(0.85);
  }
  65% {
    opacity: 0;
    transform: scale(1.35);
  }
}
@media (max-width: 640px) {
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
  .map-stage-shell {
    padding: 8px;
  }
  .scanner-popover {
    top: 10px;
    right: 10px;
  }
  .scanner-label {
    font-size: 10px;
  }
}
</style>
