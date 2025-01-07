export interface ScooterLocation {
  id: number;
  status: string;
  latitude: number;
  longitude: number;
  distance: number; // 距離中心點的距離（單位：公尺）
}
