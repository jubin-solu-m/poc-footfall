<template>
  <header class="app-header">
    <div>
      <p class="eyebrow">AIMS · BLE FOOTFALL ANALYTICS</p>
      <h1>Store scanner map</h1>
      <p class="subtitle">
        Live BLE scanner placement over the store floor plan
      </p>
    </div>
    <div class="live-status"><span /> Feed live</div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 26px;
  border-bottom: 1px solid #e4deef;
}
.eyebrow {
  margin: 0 0 5px;
  color: #6c3fb5;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}
h1 {
  margin: 0;
  color: #2e006d;
  font-size: 24px;
  line-height: 1.15;
}
.subtitle {
  margin: 5px 0 0;
  color: #6a6180;
  font-size: 13px;
}
.live-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #375623;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.live-status span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5fd08a;
  box-shadow: 0 0 0 6px rgba(95, 208, 138, 0.12);
}
@media (max-width: 640px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 17px;
  }
}
</style>
