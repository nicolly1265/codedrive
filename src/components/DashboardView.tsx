import React, { useMemo } from 'react';
import { Vehicle, Refueling, MaintenanceAlert } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Fuel, Car, ShieldAlert, Navigation, CalendarDays, TrendingUp, DollarSign, Gauge } from 'lucide-react';

interface DashboardViewProps {
  vehicles: Vehicle[];
  refuelings: Refueling[];
  alerts: MaintenanceAlert[];
  onNavigate: (tab: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardView({ vehicles, refuelings, alerts, onNavigate }: DashboardViewProps) {
  // Stat: Total Spent
  const totalSpent = useMemo(() => {
    return refuelings.reduce((sum, ref) => sum + ref.totalSpent, 0);
  }, [refuelings]);

  // Stat: Active Alerts (Critical / Warning)
  const activeAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const vehicle = vehicles.find((v) => v.id === alert.vehicleId);
      if (!vehicle) return false;
      const kmRemaining = alert.nextDueOdometer - vehicle.currentOdometer;
      return kmRemaining <= 1000; // Warning if 1000km remaining, critical if <= 0
    });
  }, [alerts, vehicles]);

  // Stat: Total distance run based on refueling trip distances
  const totalDistance = useMemo(() => {
    return refuelings.reduce((sum, ref) => sum + ref.tripDistance, 0);
  }, [refuelings]);

  // Stat: Average consumption of entire fleet (km / L)
  const averageConsumption = useMemo(() => {
    const totalLiters = refuelings.reduce((sum, ref) => sum + ref.liters, 0);
    if (totalLiters === 0) return 0;
    return totalDistance / totalLiters;
  }, [refuelings, totalDistance]);

  // Chart Data: Spent by Month (Group refuelings by month)
  const spentByMonthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dataMap: { [key: string]: { Gasolina: number; Etanol: number; Diesel: number; GNV: number; total: number } } = {};

    refuelings.forEach((ref) => {
      const date = new Date(ref.date);
      // Fallback for timezone issues: if invalid date, try parsing manually
      const monthIndex = isNaN(date.getTime()) ? parseInt(ref.date.split('-')[1]) - 1 : date.getMonth();
      const monthName = months[monthIndex] || 'Outros';

      if (!dataMap[monthName]) {
        dataMap[monthName] = { Gasolina: 0, Etanol: 0, Diesel: 0, GNV: 0, total: 0 };
      }
      const fuelType = ref.fuelType as 'Gasolina' | 'Etanol' | 'Diesel' | 'GNV';
      dataMap[monthName][fuelType] += ref.totalSpent;
      dataMap[monthName].total += ref.totalSpent;
    });

    // Return chronological order based on actual months with records
    return months
      .filter((m) => dataMap[m])
      .map((m) => ({
        month: m,
        Gasolina: parseFloat(dataMap[m].Gasolina.toFixed(2)),
        Etanol: parseFloat(dataMap[m].Etanol.toFixed(2)),
        Diesel: parseFloat(dataMap[m].Diesel.toFixed(2)),
        GNV: parseFloat(dataMap[m].GNV.toFixed(2)),
        Total: parseFloat(dataMap[m].total.toFixed(2)),
      }));
  }, [refuelings]);

  // Chart Data: Spend split by Fuel Type
  const fuelTypePieData = useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    refuelings.forEach((ref) => {
      dataMap[ref.fuelType] = (dataMap[ref.fuelType] || 0) + ref.totalSpent;
    });

    return Object.entries(dataMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [refuelings]);

  // Chart Data: Efficiency (km/L) per vehicle
  const vehicleEfficiencyData = useMemo(() => {
    return vehicles.map((v) => {
      const vRefuelings = refuelings.filter((r) => r.vehicleId === v.id);
      const totalKm = vRefuelings.reduce((sum, r) => sum + r.tripDistance, 0);
      const totalLiters = vRefuelings.reduce((sum, r) => sum + r.liters, 0);
      const avg = totalLiters > 0 ? totalKm / totalLiters : 0;
      return {
        name: v.name,
        average: parseFloat(avg.toFixed(2)),
      };
    });
  }, [vehicles, refuelings]);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Dashboard de Desempenho</h2>
          <p className="text-slate-500 text-sm mt-1">Visão geral instantânea da frota, eficiência energética e custos de combustível.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('refuelings')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Fuel className="w-4 h-4" /> Novo Abastecimento
          </button>
          <button
            onClick={() => onNavigate('routes')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Navigation className="w-4 h-4" /> Rastrear Rota GPS
          </button>
        </div>
      </div>

      {/* Critical System Notifications if any Maintenance is overdue */}
      {activeAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 font-display text-base">Atenção: Alertas de Manutenção Pendentes!</h3>
            <p className="text-amber-700 text-sm mt-1">
              Existem {activeAlerts.length} manutenções preventivas que estão próximas do prazo ou vencidas. Faça a revisão preventiva para economizar combustível e evitar falhas mecânicas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeAlerts.slice(0, 3).map((alert) => {
                const v = vehicles.find((v) => v.id === alert.vehicleId);
                const kmDiff = alert.nextDueOdometer - (v?.currentOdometer || 0);
                const isOverdue = kmDiff <= 0;
                return (
                  <span
                    key={alert.id}
                    onClick={() => onNavigate('maintenance')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                      isOverdue
                        ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                    }`}
                  >
                    {v?.name}: {alert.description}{' '}
                    {isOverdue ? `(VENCIDA há ${Math.abs(kmDiff)} km)` : `(restam ${kmDiff} km)`}
                  </span>
                );
              })}
              {activeAlerts.length > 3 && (
                <button
                  onClick={() => onNavigate('maintenance')}
                  className="text-amber-900 font-bold text-xs hover:underline pt-1 cursor-pointer"
                >
                  + ver mais {activeAlerts.length - 3} alertas
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Investido</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1 font-display">
              {totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h4>
            <p className="text-slate-500 text-xs mt-1">Gasto total acumulado</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Eficiência da Frota</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1 font-display">
              {averageConsumption > 0 ? `${averageConsumption.toFixed(2)} km/L` : '---'}
            </h4>
            <p className="text-slate-500 text-xs mt-1">Média ponderada ponderada</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Km Rodados (Log)</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1 font-display">
              {totalDistance.toLocaleString('pt-BR')} km
            </h4>
            <p className="text-slate-500 text-xs mt-1">Distância total monitorada</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Veículos Ativos</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1 font-display">{vehicles.length}</h4>
            <p className="text-slate-500 text-xs mt-1">Cadastrados no sistema</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Evolution over months */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900 font-display mb-4">Evolução Mensal de Custos (R$)</h3>
          <div className="h-72">
            {spentByMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spentByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [`R$ ${value}`, '']}
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                  />
                  <Legend />
                  <Bar dataKey="Gasolina" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Etanol" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Diesel" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="GNV" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Nenhum dado de abastecimento registrado ainda.
              </div>
            )}
          </div>
        </div>

        {/* Share of Fuel Types */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900 font-display mb-4">Investimento por Combustível</h3>
          <div className="h-72 flex flex-col justify-between">
            {fuelTypePieData.length > 0 ? (
              <>
                <div className="h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fuelTypePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {fuelTypePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`R$ ${value}`, '']}
                        contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-xs text-slate-400 font-medium uppercase">Total Gasto</p>
                    <p className="text-lg font-bold text-slate-800">R$ {totalSpent.toFixed(0)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                  {fuelTypePieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="text-slate-600">
                        {entry.name}: {((entry.value / totalSpent) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Nenhum dado cadastrado.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet efficiency comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900 font-display mb-4">Consumo Médio por Veículo (km/L)</h3>
          <div className="h-64">
            {refuelings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleEfficiencyData} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={130} />
                  <Tooltip
                    formatter={(value) => [`${value} km/L`, 'Eficiência Média']}
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                  />
                  <Bar dataKey="average" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Registre os abastecimentos para ver o gráfico comparativo.
              </div>
            )}
          </div>
        </div>

        {/* Quick Vehicles Status & Odometer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 font-display mb-3 flex items-center gap-2">
              <Car className="w-5 h-5 text-slate-500" /> Status da Frota
            </h3>
            <div className="space-y-3.5 mt-4">
              {vehicles.map((v) => {
                // calculate some stats for this vehicle
                const vRefs = refuelings.filter((r) => r.vehicleId === v.id);
                const count = vRefs.length;
                const lastRef = vRefs[vRefs.length - 1];
                return (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 transition-all">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{v.name}</p>
                      <span className="inline-block bg-slate-200/80 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded-md mt-0.5 font-bold">
                        {v.plate}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-slate-700">{v.currentOdometer.toLocaleString('pt-BR')} km</p>
                      <p className="text-[10px] text-slate-400">
                        {count === 0 ? 'Sem abastecimentos' : `${count} abastecimento${count > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => onNavigate('vehicles')}
            className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 mt-4 pt-2 border-t border-slate-100 hover:underline cursor-pointer"
          >
            Gerenciar veículos →
          </button>
        </div>
      </div>
    </div>
  );
}
