export type FuelType = 'Gasolina' | 'Etanol' | 'Diesel' | 'GNV';

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  currentOdometer: number;
  initialOdometer: number;
  fuelTypes: FuelType[];
}

export interface Refueling {
  id: string;
  vehicleId: string;
  date: string;
  fuelType: FuelType;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalSpent: number;
  tripDistance: number; // km rodados desde o último abastecimento
  averageConsumption: number; // km/L
}

export interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  description: string;
  intervalKm: number; // Intervalo em km (ex: 10000)
  lastDoneOdometer: number; // Km quando foi feita
  nextDueOdometer: number; // Km da próxima troca
}

export interface RouteLog {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  startLocation: string;
  endLocation: string;
  distance: number; // km
  points: [number, number][]; // Coordenadas de GPS [[lat, lng], ...]
  createdAt: string;
}
