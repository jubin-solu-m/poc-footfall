export type ApiResponse<T> = {
  responseCode: string;
  responseMessage: string;
  data: T;
};

export type HeatmapPoint = { x: number; y: number; value: number };
export type Occupant = { id: string; zone: string; x: number; y: number };
export type OccupancySnapshot = { range: string; count: number };

const response = <T>(data: T): ApiResponse<T> => ({
  responseCode: "200",
  responseMessage: "SUCCESS",
  data,
});

const delay = <T>(data: T, milliseconds = 180) =>
  new Promise<ApiResponse<T>>((resolve) => {
    window.setTimeout(() => resolve(response(data)), milliseconds);
  });

const heatmapPoints: HeatmapPoint[] = [
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
];

const occupancySnapshots: OccupancySnapshot[] = [
  { range: "1 hour", count: 4 },
  { range: "2 hours", count: 7 },
  { range: "3 hours", count: 9 },
  { range: "5 hours", count: 14 },
  { range: "10 hours", count: 21 },
  { range: "12 hours", count: 26 },
  { range: "24 hours", count: 38 },
];

const liveOccupants: Occupant[] = [
  { id: "DEV-104", zone: "Entrance", x: 18, y: 24 },
  { id: "DEV-228", zone: "Dairy", x: 54, y: 48 },
  { id: "DEV-317", zone: "Checkout", x: 88, y: 78 },
  { id: "DEV-402", zone: "Promo Aisle", x: 66, y: 70 },
];

export const floorMapApi = {
  getHeatmapPoints: () => delay(heatmapPoints),
  getOccupancySnapshots: () => delay(occupancySnapshots),
  getLiveOccupants: () => delay(liveOccupants),
};
