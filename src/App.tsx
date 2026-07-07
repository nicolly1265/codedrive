import React, { useState, useEffect } from 'react';
import { Vehicle, Refueling, MaintenanceAlert, RouteLog } from './types';
import {
  INITIAL_VEHICLES,
  INITIAL_REFUELINGS,
  INITIAL_MAINTENANCE_ALERTS,
  INITIAL_ROUTES,
} from './data';

// Icons
import {
  Gauge,
  Fuel,
  Car,
  ShieldAlert,
  Navigation,
  FileText,
  Menu,
  X,
  Plus,
  Compass,
} from 'lucide-react';

// Views
import DashboardView from './components/DashboardView';
import VehicleView from './components/VehicleView';
import RefuelingView from './components/RefuelingView';
import MaintenanceView from './components/MaintenanceView';
import RouteTrackerView from './components/RouteTrackerView';
import ReportsView from './components/ReportsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States with localStorage persistence
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [routes, setRoutes] = useState<RouteLog[]>([]);

  // Initialize states from localstorage or fall back to mock seed data
  useEffect(() => {
    const savedVehicles = localStorage.getItem('ecodrive_vehicles');
    const savedRefuelings = localStorage.getItem('ecodrive_refuelings');
    const savedAlerts = localStorage.getItem('ecodrive_alerts');
    const savedRoutes = localStorage.getItem('ecodrive_routes');

    if (savedVehicles) setVehicles(JSON.parse(savedVehicles));
    else {
      setVehicles(INITIAL_VEHICLES);
      localStorage.setItem('ecodrive_vehicles', JSON.stringify(INITIAL_VEHICLES));
    }

    if (savedRefuelings) setRefuelings(JSON.parse(savedRefuelings));
    else {
      setRefuelings(INITIAL_REFUELINGS);
      localStorage.setItem('ecodrive_refuelings', JSON.stringify(INITIAL_REFUELINGS));
    }

    if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
    else {
      setAlerts(INITIAL_MAINTENANCE_ALERTS);
      localStorage.setItem('ecodrive_alerts', JSON.stringify(INITIAL_MAINTENANCE_ALERTS));
    }

    if (savedRoutes) setRoutes(JSON.parse(savedRoutes));
    else {
      setRoutes(INITIAL_ROUTES);
      localStorage.setItem('ecodrive_routes', JSON.stringify(INITIAL_ROUTES));
    }
  }, []);

  // Save states helper
  const saveToLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // --- VEHICLE HANDLERS ---
  const handleAddVehicle = (newV: Omit<Vehicle, 'id'>) => {
    const id = `v-${Date.now()}`;
    const updated = [...vehicles, { id, ...newV }];
    setVehicles(updated);
    saveToLocalStorage('ecodrive_vehicles', updated);
  };

  const handleEditVehicle = (id: string, updatedFields: Partial<Vehicle>) => {
    const updated = vehicles.map((v) => (v.id === id ? { ...v, ...updatedFields } : v));
    setVehicles(updated);
    saveToLocalStorage('ecodrive_vehicles', updated);
  };

  const handleDeleteVehicle = (id: string) => {
    const updatedVehicles = vehicles.filter((v) => v.id !== id);
    setVehicles(updatedVehicles);
    saveToLocalStorage('ecodrive_vehicles', updatedVehicles);

    // Cascade delete associated data
    const updatedRefuelings = refuelings.filter((r) => r.vehicleId !== id);
    setRefuelings(updatedRefuelings);
    saveToLocalStorage('ecodrive_refuelings', updatedRefuelings);

    const updatedAlerts = alerts.filter((a) => a.vehicleId !== id);
    setAlerts(updatedAlerts);
    saveToLocalStorage('ecodrive_alerts', updatedAlerts);

    const updatedRoutes = routes.filter((rt) => rt.vehicleId !== id);
    setRoutes(updatedRoutes);
    saveToLocalStorage('ecodrive_routes', updatedRoutes);
  };

  // --- REFUELING HANDLERS ---
  const handleAddRefueling = (newRef: Omit<Refueling, 'id' | 'tripDistance' | 'averageConsumption'>) => {
    const id = `ref-${Date.now()}`;

    // Find previous odometer of this vehicle to compute trip distance
    const vehicleRefuelings = refuelings
      .filter((r) => r.vehicleId === newRef.vehicleId)
      .sort((a, b) => b.odometer - a.odometer);

    let prevOdo = 0;
    if (vehicleRefuelings.length > 0) {
      prevOdo = vehicleRefuelings[0].odometer;
    } else {
      const v = vehicles.find((v) => v.id === newRef.vehicleId);
      prevOdo = v ? v.initialOdometer : 0;
    }

    const tripDistance = Math.max(0, newRef.odometer - prevOdo);
    const averageConsumption = tripDistance > 0 && newRef.liters > 0 ? tripDistance / newRef.liters : 0;

    const fullRefueling: Refueling = {
      id,
      ...newRef,
      tripDistance,
      averageConsumption: parseFloat(averageConsumption.toFixed(2)),
    };

    const updatedRefuelings = [...refuelings, fullRefueling];
    setRefuelings(updatedRefuelings);
    saveToLocalStorage('ecodrive_refuelings', updatedRefuelings);

    // Update vehicle odometer if higher than current odometer
    const vehicle = vehicles.find((v) => v.id === newRef.vehicleId);
    if (vehicle && newRef.odometer > vehicle.currentOdometer) {
      handleEditVehicle(newRef.vehicleId, { currentOdometer: newRef.odometer });
    }
  };

  const handleDeleteRefueling = (id: string) => {
    const updated = refuelings.filter((r) => r.id !== id);
    setRefuelings(updated);
    saveToLocalStorage('ecodrive_refuelings', updated);
  };

  // --- MAINTENANCE HANDLERS ---
  const handleAddAlert = (newAlert: Omit<MaintenanceAlert, 'id' | 'nextDueOdometer'>) => {
    const id = `m-${Date.now()}`;
    const nextDueOdometer = newAlert.lastDoneOdometer + newAlert.intervalKm;
    const fullAlert: MaintenanceAlert = {
      id,
      ...newAlert,
      nextDueOdometer,
    };
    const updated = [...alerts, fullAlert];
    setAlerts(updated);
    saveToLocalStorage('ecodrive_alerts', updated);
  };

  const handlePerformMaintenance = (id: string, currentOdometer: number) => {
    const updated = alerts.map((alert) => {
      if (alert.id === id) {
        return {
          ...alert,
          lastDoneOdometer: currentOdometer,
          nextDueOdometer: currentOdometer + alert.intervalKm,
        };
      }
      return alert;
    });
    setAlerts(updated);
    saveToLocalStorage('ecodrive_alerts', updated);
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveToLocalStorage('ecodrive_alerts', updated);
  };

  // --- ROUTE LOG HANDLERS ---
  const handleAddRoute = (newRoute: Omit<RouteLog, 'id' | 'createdAt'>) => {
    const id = `r-${Date.now()}`;
    const fullRoute: RouteLog = {
      id,
      ...newRoute,
      createdAt: new Date().toISOString(),
    };
    const updated = [...routes, fullRoute];
    setRoutes(updated);
    saveToLocalStorage('ecodrive_routes', updated);

    // When a route completes, let's update the vehicle's odometer to match the final distance added!
    const vehicle = vehicles.find((v) => v.id === newRoute.vehicleId);
    if (vehicle) {
      const newOdo = Math.ceil(vehicle.currentOdometer + newRoute.distance);
      handleEditVehicle(newRoute.vehicleId, { currentOdometer: newOdo });
    }
  };

  const handleDeleteRoute = (id: string) => {
    const updated = routes.filter((rt) => rt.id !== id);
    setRoutes(updated);
    saveToLocalStorage('ecodrive_routes', updated);
  };

  // Sidebar navigation options
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge },
    { id: 'vehicles', label: 'Frota / Veículos', icon: Car },
    { id: 'refuelings', label: 'Abastecimentos', icon: Fuel },
    { id: 'maintenance', label: 'Manutenção', icon: ShieldAlert },
    { id: 'routes', label: 'Rastrear Rotas', icon: Navigation },
    { id: 'reports', label: 'Relatórios & Exportação', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Header (No-print wrapper) */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md no-print">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-extrabold text-lg tracking-tight font-display text-blue-100">EcoDrive</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 hover:bg-slate-800 rounded-lg text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar Menu (No-print wrapper) */}
      <div
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-950 text-slate-300 flex-shrink-0 border-r border-slate-800/60 z-20 no-print`}
      >
        <div className="h-full flex flex-col justify-between py-6 px-4 min-h-screen md:min-h-0">
          <div>
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2.5 px-3 pb-8 pt-2 border-b border-slate-800/40">
              <Compass className="w-7 h-7 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight font-display text-white">EcoDrive</span>
                <span className="text-[10px] text-slate-400 tracking-widest uppercase font-bold">Smart Fleet</span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="space-y-1.5 mt-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/10'
                        : 'hover:bg-slate-900 hover:text-white text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile credit */}
          <div className="mt-auto px-3 pt-4 border-t border-slate-800/40">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Sistema Rodoviário</p>
            <p className="text-xs text-slate-300 font-bold mt-1">Frota Ativa: {vehicles.length} Veículos</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Render Active View Tab */}
        {activeTab === 'dashboard' && (
          <DashboardView
            vehicles={vehicles}
            refuelings={refuelings}
            alerts={alerts}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehicleView
            vehicles={vehicles}
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {activeTab === 'refuelings' && (
          <RefuelingView
            vehicles={vehicles}
            refuelings={refuelings}
            onAddRefueling={handleAddRefueling}
            onDeleteRefueling={handleDeleteRefueling}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceView
            vehicles={vehicles}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onPerformMaintenance={handlePerformMaintenance}
            onDeleteAlert={handleDeleteAlert}
          />
        )}

        {activeTab === 'routes' && (
          <RouteTrackerView
            vehicles={vehicles}
            routes={routes}
            onAddRoute={handleAddRoute}
            onDeleteRoute={handleDeleteRoute}
          />
        )}

        {activeTab === 'reports' && <ReportsView vehicles={vehicles} refuelings={refuelings} />}
      </main>
    </div>
  );
}
