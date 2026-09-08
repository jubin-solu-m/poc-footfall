<template>
  <main class="dashboard-page">
    <section class="dashboard-card" aria-labelledby="page-title">
      <Header />
      <section class="device-summary" aria-labelledby="device-summary-title">
        <div class="summary-heading">
          <div>
            <p class="eyebrow">LIVE INVENTORY</p>
            <h2 id="device-summary-title">BLE scanner devices</h2>
          </div>
          <span class="device-count">{{ scanners.length }} devices</span>
        </div>
        <div class="device-list">
          <article
            v-for="scanner in scanners"
            :key="scanner.id"
            class="device-card"
          >
            <span class="device-dot" />
            <div>
              <strong>{{ scanner.id }}</strong
              ><small>{{ scanner.zone }}</small>
            </div>
            <span class="device-status">{{ scanner.status }}</span>
          </article>
        </div>
      </section>
      <FloorMap :scanners="scanners" />
    </section>
  </main>
</template>

<script lang="ts" setup>
import Header from "@/components/common/Header.vue";
import FloorMap from "@/components/Floor/FloorMap.vue";

type Scanner = {
  id: string;
  zone: string;
  status: "Online" | "Offline";
  rssi: number;
  observations: number;
  x: number;
  y: number;
};

const scanners: Scanner[] = [
  {
    id: "SCN001",
    zone: "Entrance",
    status: "Online",
    rssi: -62,
    observations: 812,
    x: 17,
    y: 45,
  },
  {
    id: "SCN004",
    zone: "Electronics",
    status: "Online",
    rssi: -74,
    observations: 182,
    x: 58,
    y: 29,
  },
  {
    id: "SCN006",
    zone: "Checkout",
    status: "Online",
    rssi: -63,
    observations: 735,
    x: 79,
    y: 77.1,
  },
];
</script>

<style scoped>
.dashboard-page {
  width: 100%;
  min-height: 100vh;
  background: #f7f5fa;
  color: #1b1526;
}
.dashboard-card {
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #fff;
}
.device-summary {
  padding: 20px 26px;
  border-bottom: 1px solid #e4deef;
}
.summary-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
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
.device-count {
  padding: 5px 10px;
  border-radius: 999px;
  background: #efe9f8;
  color: #2e006d;
  font-size: 12px;
  font-weight: 700;
}
.device-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.device-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 1px solid #e4deef;
  border-radius: 8px;
  background: #fbf9fe;
}
.device-dot {
  width: 9px;
  height: 9px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #e51b23;
  box-shadow: 0 0 0 4px rgba(229, 27, 35, 0.1);
}
.device-card div {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.device-card strong {
  color: #2e006d;
  font:
    700 12px "Roboto Mono",
    monospace;
}
.device-card small {
  overflow: hidden;
  color: #6a6180;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.device-status {
  margin-left: auto;
  color: #375623;
  font-size: 11px;
  font-weight: 700;
}
@media (max-width: 700px) {
  .device-summary {
    padding: 17px;
  }
  .device-list {
    grid-template-columns: 1fr;
  }
}
</style>
