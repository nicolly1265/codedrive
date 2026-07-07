import { Vehicle, Refueling, MaintenanceAlert, RouteLog } from './types';

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v-1',
    name: 'Toyota Corolla XEi',
    brand: 'Toyota',
    model: 'Corolla XEi 2.0',
    plate: 'BRA-3F20',
    year: 2022,
    currentOdometer: 45200,
    initialOdometer: 35000,
    fuelTypes: ['Gasolina', 'Etanol'],
  },
  {
    id: 'v-2',
    name: 'Fiat Toro Freedom',
    brand: 'Fiat',
    model: 'Toro Freedom 2.0 Turbo',
    plate: 'BRA-4G10',
    year: 2021,
    currentOdometer: 78500,
    initialOdometer: 60000,
    fuelTypes: ['Diesel'],
  },
];

export const INITIAL_REFUELINGS: Refueling[] = [
  // Corolla - Gasolina
  {
    id: 'ref-1',
    vehicleId: 'v-1',
    date: '2026-04-10',
    fuelType: 'Gasolina',
    odometer: 35600,
    liters: 45,
    pricePerLiter: 5.89,
    totalSpent: 265.05,
    tripDistance: 600,
    averageConsumption: 13.33,
  },
  {
    id: 'ref-2',
    vehicleId: 'v-1',
    date: '2026-04-28',
    fuelType: 'Etanol',
    odometer: 36100,
    liters: 48,
    pricePerLiter: 3.85,
    totalSpent: 184.8,
    tripDistance: 500,
    averageConsumption: 10.42,
  },
  {
    id: 'ref-3',
    vehicleId: 'v-1',
    date: '2026-05-15',
    fuelType: 'Gasolina',
    odometer: 36720,
    liters: 44,
    pricePerLiter: 5.95,
    totalSpent: 261.8,
    tripDistance: 620,
    averageConsumption: 14.09,
  },
  {
    id: 'ref-4',
    vehicleId: 'v-1',
    date: '2026-05-30',
    fuelType: 'Gasolina',
    odometer: 37300,
    liters: 42,
    pricePerLiter: 5.92,
    totalSpent: 248.64,
    tripDistance: 580,
    averageConsumption: 13.81,
  },
  {
    id: 'ref-5',
    vehicleId: 'v-1',
    date: '2026-06-12',
    fuelType: 'Etanol',
    odometer: 37780,
    liters: 46,
    pricePerLiter: 3.99,
    totalSpent: 183.54,
    tripDistance: 480,
    averageConsumption: 10.43,
  },
  {
    id: 'ref-6',
    vehicleId: 'v-1',
    date: '2026-06-25',
    fuelType: 'Gasolina',
    odometer: 38400,
    liters: 45,
    pricePerLiter: 6.05,
    totalSpent: 272.25,
    tripDistance: 620,
    averageConsumption: 13.78,
  },
  {
    id: 'ref-7',
    vehicleId: 'v-1',
    date: '2026-07-02',
    fuelType: 'Gasolina',
    odometer: 39020,
    liters: 43,
    pricePerLiter: 6.09,
    totalSpent: 261.87,
    tripDistance: 620,
    averageConsumption: 14.42,
  },
  // Fiat Toro - Diesel
  {
    id: 'ref-8',
    vehicleId: 'v-2',
    date: '2026-04-12',
    fuelType: 'Diesel',
    odometer: 61200,
    liters: 55,
    pricePerLiter: 6.15,
    totalSpent: 338.25,
    tripDistance: 1200,
    averageConsumption: 21.82,
  },
  {
    id: 'ref-9',
    vehicleId: 'v-2',
    date: '2026-05-05',
    fuelType: 'Diesel',
    odometer: 62350,
    liters: 58,
    pricePerLiter: 6.19,
    totalSpent: 359.02,
    tripDistance: 1150,
    averageConsumption: 19.83,
  },
  {
    id: 'ref-10',
    vehicleId: 'v-2',
    date: '2026-05-28',
    fuelType: 'Diesel',
    odometer: 63500,
    liters: 56,
    pricePerLiter: 6.12,
    totalSpent: 342.72,
    tripDistance: 1150,
    averageConsumption: 20.54,
  },
  {
    id: 'ref-11',
    vehicleId: 'v-2',
    date: '2026-06-18',
    fuelType: 'Diesel',
    odometer: 64700,
    liters: 57,
    pricePerLiter: 6.25,
    totalSpent: 356.25,
    tripDistance: 1200,
    averageConsumption: 21.05,
  },
  {
    id: 'ref-12',
    vehicleId: 'v-2',
    date: '2026-07-01',
    fuelType: 'Diesel',
    odometer: 65880,
    liters: 55,
    pricePerLiter: 6.29,
    totalSpent: 345.95,
    tripDistance: 1180,
    averageConsumption: 21.45,
  },
];

export const INITIAL_MAINTENANCE_ALERTS: MaintenanceAlert[] = [
  // Corolla v-1
  {
    id: 'm-1',
    vehicleId: 'v-1',
    description: 'Troca de Óleo do Motor e Filtro',
    intervalKm: 10000,
    lastDoneOdometer: 40000,
    nextDueOdometer: 50000, // No status do Corolla (45.200km) faltam 4.800km -> OK
  },
  {
    id: 'm-2',
    vehicleId: 'v-1',
    description: 'Filtro de Ar de Cabine (Ar Condicionado)',
    intervalKm: 10000,
    lastDoneOdometer: 35000,
    nextDueOdometer: 45000, // No status do Corolla (45.200km) está PASSADO em 200km! -> Alerta
  },
  {
    id: 'm-3',
    vehicleId: 'v-1',
    description: 'Alinhamento e Balanceamento',
    intervalKm: 10000,
    lastDoneOdometer: 36000,
    nextDueOdometer: 46000, // Faltam 800km (Próximo) -> Alerta
  },
  // Toro v-2
  {
    id: 'm-4',
    vehicleId: 'v-2',
    description: 'Substituição da Pastilha de Freio',
    intervalKm: 20000,
    lastDoneOdometer: 60000,
    nextDueOdometer: 80000, // No status da Toro (78.500km) faltam 1.500km -> Próximo
  },
  {
    id: 'm-5',
    vehicleId: 'v-2',
    description: 'Substituição das Palhetas do Limpador',
    intervalKm: 15000,
    lastDoneOdometer: 60000,
    nextDueOdometer: 75000, // No status da Toro (78.500km) está PASSADO por 3.500km! -> Alerta
  },
];

// São Paulo e redondezas rotas de exemplo
export const INITIAL_ROUTES: RouteLog[] = [
  {
    id: 'r-1',
    vehicleId: 'v-1',
    date: '2026-06-15',
    description: 'Viagem de São Paulo para Santos (Litoral)',
    startLocation: 'São Paulo, SP',
    endLocation: 'Santos, SP',
    distance: 72.5,
    points: [
      [-23.55052, -46.633308], // SP Centro
      [-23.65, -46.60],
      [-23.75, -46.55], // Imigrantes início
      [-23.85, -46.50], // Serra do mar
      [-23.90, -46.42], // Baixada
      [-23.9618, -46.3322], // Santos Centro
    ],
    createdAt: '2026-06-15T09:30:00Z',
  },
  {
    id: 'r-2',
    vehicleId: 'v-2',
    date: '2026-06-28',
    description: 'Rota Comercial - Campinas para São Paulo',
    startLocation: 'Campinas, SP',
    endLocation: 'São Paulo, SP',
    distance: 98.2,
    points: [
      [-22.9064, -47.0616], // Campinas
      [-23.00, -47.01],
      [-23.15, -46.90], // Jundiaí
      [-23.35, -46.78], // Bandeirantes pedágio
      [-23.45, -46.70], // Marginal Pinheiros
      [-23.55052, -46.633308], // SP Centro
    ],
    createdAt: '2026-06-28T14:15:00Z',
  },
];
