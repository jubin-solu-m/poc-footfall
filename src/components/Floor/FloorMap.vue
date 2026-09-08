<template>
  <div class="floor-map-wrapper">
    <section
      class="occupancy-details"
      aria-labelledby="occupancy-details-title"
    >
      <div class="occupancy-details-heading">
        <div>
          <p class="eyebrow">LIVE PRESENCE</p>
          <h2 id="occupancy-details-title">Occupancy details</h2>
          <p class="occupancy-summary">
            {{ selectedOccupancy.count }} devices detected ·
            {{ selectedOccupancy.change }} vs previous {{ selectedRange }}
          </p>
        </div>
        <div class="occupancy-controls">
          <select v-model="selectedRange" aria-label="Occupancy time range">
            <option
              v-for="range in occupancyRanges"
              :key="range"
              :value="range"
            >
              Last {{ range }}
            </option></select
          ><span class="live-count"
            ><i /> {{ selectedOccupancy.count }} live</span
          >
        </div>
      </div>
      <div class="occupancy-details-list">
        <article
          v-for="person in selectedOccupancy.people"
          :key="person.id"
          class="occupancy-detail-card"
        >
          <span class="occupancy-live-dot" />
          <div>
            <strong>{{ person.id }}</strong
            ><small>{{ person.zone }}</small>
          </div>
          <span class="presence-label">Present</span>
        </article>
      </div>
    </section>
    <section class="floor-section" aria-labelledby="floor-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">STORE LAYOUT</p>
          <h2 id="floor-title">Floor map</h2>
        </div>
        <div class="floor-actions">
          <button
            class="heat-map-button"
            :class="{ active: heatMapVisible }"
            :aria-pressed="heatMapVisible"
            @click="heatMapVisible = !heatMapVisible"
          >
            <span class="mdi mdi-fire" />
            {{ heatMapVisible ? "Hide heat map" : "Heat Map" }}
          </button>
          <button
            class="occupancy-button"
            :class="{ active: occupancyVisible }"
            :aria-pressed="occupancyVisible"
            @click="occupancyVisible = !occupancyVisible"
          >
            <span class="mdi mdi-account-group" />
            {{ occupancyVisible ? "Hide occupancy" : "Occupancy" }}
          </button>
          <span class="resize-note">Drag the lower-right corner to resize</span>
        </div>
      </div>

      <div class="map-stage-shell">
        <div class="map-stage" :style="mapSizeStyle">
          <img :src="storeMap" alt="Store floor plan" class="store-map" />
          <div
            v-if="heatMapVisible"
            class="footfall-heatmap"
            aria-label="Footfall heat map"
          >
            <span
              v-for="point in footfallRanges"
              :key="point.id"
              class="heat-spot"
              :style="heatSpotStyle(point)"
            />
          </div>
          <div
            v-if="occupancyVisible"
            class="occupancy-layer"
            aria-label="Live occupancy"
          >
            <span class="occupancy-range-label"
              >Last {{ selectedRange }} ·
              {{ selectedOccupancy.count }} present</span
            >
            <span
              v-for="person in selectedOccupancy.people"
              :key="person.id"
              class="occupant-marker"
              :style="occupantStyle(person)"
              :title="`${person.id} · ${person.zone} · live`"
              ><span
            /></span>
          </div>
          <svg
            class="boundary-overlay"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-label="Defined BLE coverage boundary"
          >
            <polygon :points="floorBoundary" />
          </svg>
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
            <span
              >{{ activeScanner.status }} · {{ activeScanner.rssi }} dBm</span
            >
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
    <aside class="map-metrics" aria-label="Map measurements">
      <div class="metric">
        <span>Map width</span><strong>{{ mapWidth }} px</strong>
      </div>
      <div class="metric">
        <span>Map height</span><strong>{{ mapHeight }} px</strong>
      </div>
      <div class="metric">
        <span>Aspect ratio</span
        ><strong>{{ mapAspectRatio.toFixed(2) }} : 1</strong>
      </div>
      <div class="metric">
        <span>Inside boundary</span
        ><strong
          >{{ boundaryMetrics.widthPercent.toFixed(1) }}% ×
          {{ boundaryMetrics.heightPercent.toFixed(1) }}%</strong
        ><small
          >{{ boundaryMetrics.widthPixels }} ×
          {{ boundaryMetrics.heightPixels }} px bounds</small
        >
      </div>
    </aside>
  </div>
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
type ApiResponse<T> = {
  responseCode: string;
  responseMessage: string;
  data: T;
};
type Occupant = { id: string; zone: string; x: number; y: number };
type OccupancySnapshot = { range: string; count: number };
const selectedScanner = ref<string | null>("SCN001");
const heatMapVisible = ref(true);
const occupancyVisible = ref(false);
const occupancySnapshotsResponse: ApiResponse<OccupancySnapshot[]> = {
  responseCode: "200",
  responseMessage: "SUCCESS",
  data: [
    { range: "1 hour", count: 4 },
    { range: "2 hours", count: 7 },
    { range: "3 hours", count: 9 },
    { range: "5 hours", count: 14 },
    { range: "10 hours", count: 21 },
    { range: "12 hours", count: 26 },
    { range: "24 hours", count: 38 },
  ],
};
const occupancyRanges = occupancySnapshotsResponse.data.map(
  (item) => item.range,
);
const selectedRange = ref("1 hour");
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
const liveOccupantsResponse: ApiResponse<Occupant[]> = {
  responseCode: "200",
  responseMessage: "SUCCESS",
  data: [
    { id: "DEV-104", zone: "Entrance", x: 18, y: 24 },
    { id: "DEV-228", zone: "Dairy", x: 54, y: 48 },
    { id: "DEV-317", zone: "Checkout", x: 88, y: 78 },
    { id: "DEV-402", zone: "Promo Aisle", x: 66, y: 70 },
  ],
};
const liveOccupants = liveOccupantsResponse.data;
const selectedOccupancy = computed(() => {
  const count =
    occupancySnapshotsResponse.data.find(
      (item) => item.range === selectedRange.value,
    )?.count ?? 0;
  const people = Array.from({ length: count }, (_, index) => {
    const base = liveOccupants[index % liveOccupants.length];
    const column = index % 5;
    const row = Math.floor(index / 5);
    return {
      ...base,
      id: `DEV-${String(104 + index * 17).padStart(3, "0")}`,
      x: Math.min(96, Math.max(4, base.x + (column - 2) * 3)),
      y: Math.min(94, Math.max(6, base.y + row * 4)),
    };
  });
  const previousCount =
    occupancySnapshotsResponse.data[
      Math.max(0, occupancyRanges.indexOf(selectedRange.value) - 1)
    ]?.count ?? count;
  const delta = count - previousCount;
  return { count, people, change: `${delta >= 0 ? "+" : ""}${delta}` };
});
type HeatmapPoint = { x: number; y: number; value: number };
const heatmapResponse: ApiResponse<HeatmapPoint[]> = {
  responseCode: "200",
  responseMessage: "SUCCESS",
  data: [
    { x: 10, y: 20, value: 85 },
    { x: 20, y: 30, value: 72 },
    { x: 30, y: 15, value: 60 },
    { x: 40, y: 40, value: 45 },
    { x: 50, y: 25, value: 30 },
    { x: 60, y: 50, value: 90 },
    { x: 70, y: 35, value: 55 },
    { x: 80, y: 60, value: 75 },
    { x: 90, y: 45, value: 68 },
    { x: 100, y: 70, value: 95 },
  ],
};
const footfallRanges = heatmapResponse.data.map((point, index) => ({
  id: `footfall-${index + 1}`,
  x: point.x,
  y: point.y,
  value: point.value,
  intensity: point.value / 100,
  radius: 10 + (point.value / 100) * 12,
}));
const floorBoundary =
  "19.6,25.4 31,16 46,16 45.7,21.4 56.5,21 56.8,31.5 77,31.7 77,76 45.7,75.5 45.6,80 20,79.5";
const boundaryPoints = floorBoundary
  .split(" ")
  .map((point) => point.split(",").map(Number) as [number, number]);
const boundaryBounds = computed(() => {
  const xs = boundaryPoints.map(([x]) => x);
  const ys = boundaryPoints.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
});
const boundaryPointX = (x: number) =>
  boundaryBounds.value.minX + (x / 100) * boundaryBounds.value.width;
const boundaryPointY = (y: number) =>
  boundaryBounds.value.minY + (y / 100) * boundaryBounds.value.height;
const heatSpotStyle = (point: (typeof footfallRanges)[number]) => {
  const x = boundaryPointX(point.x);
  const y = boundaryPointY(point.y);
  const size = Math.max(8, point.radius * 1.55);
  const high = point.value >= 68;
  return {
    left: `${x - size / 2}%`,
    top: `${y - size / 2}%`,
    width: `${size}%`,
    height: `${size}%`,
    opacity: 0.32 + point.intensity * 0.48,
    background: high
      ? `radial-gradient(circle, rgba(196, 25, 32, .82) 0%, rgba(242, 113, 26, .65) 22%, rgba(247, 201, 69, .34) 48%, rgba(247, 201, 69, 0) 76%)`
      : `radial-gradient(circle, rgba(14, 124, 134, .64) 0%, rgba(246, 211, 101, .38) 34%, rgba(246, 211, 101, 0) 76%)`,
  };
};
const occupantStyle = (person: (typeof liveOccupants)[number]) => ({
  left: `${boundaryPointX(person.x)}%`,
  top: `${boundaryPointY(person.y)}%`,
});
const boundaryMetrics = computed(() => {
  const xs = boundaryPoints.map(([x]) => x);
  const ys = boundaryPoints.map(([, y]) => y);
  const widthPercent = Math.max(...xs) - Math.min(...xs);
  const heightPercent = Math.max(...ys) - Math.min(...ys);
  return {
    widthPercent,
    heightPercent,
    widthPixels: Math.round((mapWidth.value * widthPercent) / 100),
    heightPixels: Math.round((mapHeight.value * heightPercent) / 100),
  };
});

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
.floor-map-wrapper {
  width: 100%;
}
.occupancy-details {
  padding: 20px;
  border-bottom: 1px solid #e4deef;
  background: #fff;
}
.occupancy-details-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}
.occupancy-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.occupancy-controls select {
  padding: 7px 10px;
  border: 1px solid #b9d8e8;
  border-radius: 6px;
  background: #fff;
  color: #1b1526;
  font-size: 12px;
}
.occupancy-summary {
  margin: 4px 0 0;
  color: #6a6180;
  font-size: 12px;
}
.live-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #e7f4eb;
  color: #375623;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.live-count i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5fd08a;
}
.occupancy-details-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  max-height: 174px;
  overflow-y: auto;
  align-content: start;
  padding-right: 4px;
}
.occupancy-detail-card {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid #d8eaf4;
  border-radius: 8px;
  background: #f5fbfe;
}
.occupancy-live-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #1688c7;
  box-shadow: 0 0 0 4px rgba(22, 136, 199, 0.12);
}
.occupancy-detail-card div {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.occupancy-detail-card strong {
  color: #2e006d;
  font:
    700 12px "Roboto Mono",
    monospace;
}
.occupancy-detail-card small {
  overflow: hidden;
  color: #6a6180;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.presence-label {
  margin-left: auto;
  color: #1688c7;
  font-size: 11px;
  font-weight: 700;
}
.floor-section {
  width: 100%;
  overflow: hidden;
  border-top: 1px solid #e4deef;
  background: #fff;
}
.map-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  border-top: 1px solid #e4deef;
  background: #e4deef;
}
.metric {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 13px 18px;
  background: #fbf9fe;
}
.metric span,
.metric small {
  color: #6a6180;
  font-size: 11px;
}
.metric strong {
  color: #2e006d;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}
.metric small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.floor-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}
.heat-map-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid #c55a11;
  border-radius: 6px;
  background: #fff;
  color: #c55a11;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.heat-map-button:hover,
.heat-map-button.active {
  background: #c55a11;
  color: #fff;
}
.heat-map-button .mdi {
  font-size: 16px;
}
.occupancy-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid #1688c7;
  border-radius: 6px;
  background: #fff;
  color: #1688c7;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.occupancy-button:hover,
.occupancy-button.active {
  background: #1688c7;
  color: #fff;
}
.occupancy-button .mdi {
  font-size: 16px;
}
.map-stage-shell {
  overflow: auto;
  padding: 18px;
  background: #f4f1f8;
}
.map-stage {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  background: #f4f1f8;
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
  fill: transparent;
  stroke: #de0c1328;
  stroke-width: 0.65;
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
}
.footfall-heatmap {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
  clip-path: polygon(
    19.6% 25.4%,
    31% 16%,
    46% 16%,
    45.7% 21.4%,
    56.5% 21%,
    56.8% 31.5%,
    77% 31.7%,
    77% 76%,
    45.7% 75.5%,
    45.6% 80%,
    20% 79.5%
  );
}
.heat-spot {
  position: absolute;
  display: block;
  border-radius: 50%;
  filter: blur(10px);
  mix-blend-mode: multiply;
}
.occupancy-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.occupancy-range-label {
  position: absolute;
  top: 18px;
  left: 18px;
  padding: 5px 8px;
  border-radius: 4px;
  background: rgba(22, 136, 199, 0.9);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.occupant-marker {
  position: absolute;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #1688c7;
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 0 5px rgba(22, 136, 199, 0.2),
    0 2px 5px rgba(27, 21, 38, 0.3);
}
.occupant-marker span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff;
}
.scanner-marker {
  position: absolute;
  z-index: 4;
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
  .occupancy-details {
    padding: 17px;
  }
  .occupancy-details-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .occupancy-controls {
    width: 100%;
    justify-content: space-between;
  }
  .occupancy-details-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
  .map-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
