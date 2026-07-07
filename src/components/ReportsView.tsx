import React, { useState, useMemo } from 'react';
import { Vehicle, Refueling } from '../types';
import { FileSpreadsheet, FileText, Printer, Calendar, Filter, Car, RefreshCw } from 'lucide-react';

interface ReportsViewProps {
  vehicles: Vehicle[];
  refuelings: Refueling[];
}

export default function ReportsView({ vehicles, refuelings }: ReportsViewProps) {
  const [filterVehicleId, setFilterVehicleId] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  const monthsList = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const uniqueMonths = new Set<string>();
    
    refuelings.forEach((ref) => {
      const date = new Date(ref.date);
      const monthIndex = isNaN(date.getTime()) ? parseInt(ref.date.split('-')[1]) - 1 : date.getMonth();
      const monthName = months[monthIndex];
      const year = isNaN(date.getTime()) ? ref.date.split('-')[0] : date.getFullYear();
      if (monthName) {
        uniqueMonths.add(`${monthName} / ${year}`);
      }
    });

    return Array.from(uniqueMonths);
  }, [refuelings]);

  // Aggregate monthly report records based on filters
  const consolidatedReports = useMemo(() => {
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Group key: `${monthIndex}_${year}_${vehicleId}`
    const grouped: {
      [key: string]: {
        monthName: string;
        year: string;
        vehicleId: string;
        vehicleName: string;
        vehiclePlate: string;
        totalSpent: number;
        totalLiters: number;
        totalDistance: number;
        refuelingsCount: number;
        fuelTypes: { [key: string]: number }; // fuelType -> cost
      };
    } = {};

    refuelings.forEach((ref) => {
      const date = new Date(ref.date);
      const mIdx = isNaN(date.getTime()) ? parseInt(ref.date.split('-')[1]) - 1 : date.getMonth();
      const year = isNaN(date.getTime()) ? ref.date.split('-')[0] : String(date.getFullYear());
      const monthName = monthsNames[mIdx] || 'Outro';
      const vId = ref.vehicleId;

      const v = vehicles.find((vehicle) => vehicle.id === vId);
      const vName = v ? v.name : 'Veículo Deletado';
      const vPlate = v ? v.plate : '---';

      // Apply filter conditions early to optimize
      if (filterVehicleId !== 'all' && vId !== filterVehicleId) return;
      
      const monthFilterStr = `${monthName} / ${year}`;
      if (filterMonth !== 'all' && monthFilterStr !== filterMonth) return;

      const groupKey = `${mIdx}_${year}_${vId}`;

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          monthName,
          year,
          vehicleId: vId,
          vehicleName: vName,
          vehiclePlate: vPlate,
          totalSpent: 0,
          totalLiters: 0,
          totalDistance: 0,
          refuelingsCount: 0,
          fuelTypes: {},
        };
      }

      grouped[groupKey].totalSpent += ref.totalSpent;
      grouped[groupKey].totalLiters += ref.liters;
      grouped[groupKey].totalDistance += ref.tripDistance;
      grouped[groupKey].refuelingsCount += 1;
      
      grouped[groupKey].fuelTypes[ref.fuelType] = (grouped[groupKey].fuelTypes[ref.fuelType] || 0) + ref.totalSpent;
    });

    return Object.values(grouped).map((item) => {
      // Calculate efficiency and fuel details
      const averageEfficiency = item.totalLiters > 0 ? item.totalDistance / item.totalLiters : 0;
      
      // Calculate fuel shares string
      const fuelShares = Object.entries(item.fuelTypes)
        .map(([fuel, cost]) => {
          const pct = ((cost / item.totalSpent) * 100).toFixed(0);
          return `${fuel} (${pct}%)`;
        })
        .join(', ');

      return {
        ...item,
        averageEfficiency,
        fuelShares,
      };
    }).sort((a, b) => b.year.localeCompare(a.year));
  }, [vehicles, refuelings, filterVehicleId, filterMonth]);

  // Overall totals for filtered reports
  const reportTotals = useMemo(() => {
    return consolidatedReports.reduce(
      (acc, item) => {
        acc.spent += item.totalSpent;
        acc.liters += item.totalLiters;
        acc.distance += item.totalDistance;
        acc.count += item.refuelingsCount;
        return acc;
      },
      { spent: 0, liters: 0, distance: 0, count: 0 }
    );
  }, [consolidatedReports]);

  // Total efficiency average across reports
  const overallEfficiency = useMemo(() => {
    if (reportTotals.liters === 0) return 0;
    return reportTotals.distance / reportTotals.liters;
  }, [reportTotals]);

  // Export 1: Excel CSV download
  const exportToExcelCSV = () => {
    // Columns configuration
    const headers = [
      'Veiculo',
      'Placa',
      'Mes/Ano',
      'Abastecimentos',
      'Total Gasto (R$)',
      'Litros Consumidos (L)',
      'Km Rodados (km)',
      'Eficiencia Media (km/L)',
      'Tipos de Combustivel (%)',
    ];

    const rows = consolidatedReports.map((item) => [
      item.vehicleName,
      item.vehiclePlate,
      `${item.monthName} / ${item.year}`,
      item.refuelingsCount,
      item.totalSpent.toFixed(2),
      item.totalLiters.toFixed(2),
      item.totalDistance,
      item.averageEfficiency.toFixed(2),
      `"${item.fuelShares}"`,
    ]);

    // Build standard CSV contents
    const csvContent = [
      headers.join(';'), // using semicolon for easier excel import in Portuguese locale
      ...rows.map((r) => r.join(';')),
    ].join('\n');

    // UTF-8 BOM representation to open cleanly in Excel without character anomalies
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EcoDrive_Relatorio_Consolidado_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export 2: Print Report / Save PDF trigger
  const triggerPDFPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Header Only Visible During Printing */}
      <div className="hidden print-only mb-6 border-b border-slate-300 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-display">EcoDrive</h1>
            <p className="text-slate-500 text-sm">Relatório Consolidado de Custos e Eficiência Veicular</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>Exportador Oficial EcoDrive</p>
          </div>
        </div>
      </div>

      {/* Control Actions (No-print wrapper) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Relatórios de Custos</h2>
          <p className="text-slate-500 text-sm mt-1">Gere consolidações mensais de custos, tipo de combustível e eficiência de rodagem.</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={exportToExcelCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            disabled={consolidatedReports.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar para Excel
          </button>
          <button
            onClick={triggerPDFPrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            disabled={consolidatedReports.length === 0}
          >
            <Printer className="w-4 h-4" /> Exportar PDF / Imprimir
          </button>
        </div>
      </div>

      {/* Filter Options (No-print wrapper) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center gap-4 no-print">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
          <Filter className="w-4 h-4" /> Filtros do Relatório:
        </div>
        
        {/* Vehicle filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Veículo</span>
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700"
          >
            <option value="all">Todos os veículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Month/Year filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Mês / Ano</span>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700"
          >
            <option value="all">Todos os meses</option>
            {monthsList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {(filterVehicleId !== 'all' || filterMonth !== 'all') && (
          <button
            onClick={() => {
              setFilterVehicleId('all');
              setFilterMonth('all');
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Consolidated Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs print-card">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Despesa Total Selecionada</p>
          <h4 className="text-xl font-bold text-slate-900 mt-1.5 font-display">
            {reportTotals.spent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h4>
          <p className="text-slate-400 text-[10px] mt-1 font-semibold">{reportTotals.count} abastecimentos agrupados</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs print-card">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Combustível Total</p>
          <h4 className="text-xl font-bold text-slate-900 mt-1.5 font-display">
            {reportTotals.liters.toLocaleString('pt-BR')} L
          </h4>
          <p className="text-slate-400 text-[10px] mt-1 font-semibold">Volume total injetado</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs print-card">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Quilometragem Total</p>
          <h4 className="text-xl font-bold text-slate-900 mt-1.5 font-display">
            {reportTotals.distance.toLocaleString('pt-BR')} km
          </h4>
          <p className="text-slate-400 text-[10px] mt-1 font-semibold">Distância percorrida acumulada</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs print-card">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Eficiência Consolidada</p>
          <h4 className="text-xl font-bold text-emerald-700 mt-1.5 font-display">
            {overallEfficiency > 0 ? `${overallEfficiency.toFixed(2)} km/L` : '---'}
          </h4>
          <p className="text-slate-400 text-[10px] mt-1 font-semibold">Média total ponderada</p>
        </div>
      </div>

      {/* Main Consolidated Report Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden print-card">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 font-display">Detalhamento por Período e Veículo</h3>
          <span className="text-xs text-slate-400 print-only">EcoDrive S.A.</span>
        </div>

        <div className="overflow-x-auto">
          {consolidatedReports.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase bg-slate-50/20">
                  <th className="p-4 pl-6">Período</th>
                  <th className="p-4">Veículo</th>
                  <th className="p-4">Placa</th>
                  <th className="p-4 text-center">Registros</th>
                  <th className="p-4">Combustível Total</th>
                  <th className="p-4">Total Gasto (R$)</th>
                  <th className="p-4">Km Rodados</th>
                  <th className="p-4">Eficiência Média</th>
                  <th className="p-4 pr-6">Combustíveis Utilizados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consolidatedReports.map((item, idx) => (
                  <tr key={`${item.vehicleId}-${item.monthName}-${item.year}`} className="hover:bg-slate-50/40 transition-all text-slate-700">
                    <td className="p-4 pl-6 font-semibold text-slate-900">
                      {item.monthName} / {item.year}
                    </td>
                    <td className="p-4 text-slate-800 font-semibold">{item.vehicleName}</td>
                    <td className="p-4 font-mono text-xs">{item.vehiclePlate}</td>
                    <td className="p-4 text-center font-mono">{item.refuelingsCount}</td>
                    <td className="p-4 font-mono">{item.totalLiters.toFixed(2)} L</td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {item.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 font-mono text-blue-600 font-semibold">+{item.totalDistance.toLocaleString('pt-BR')} km</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg text-xs">
                        {item.averageEfficiency.toFixed(2)} km/L
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-xs text-slate-500 italic max-w-xs truncate">
                      {item.fuelShares || '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400">
              Nenhum dado consolidado para os filtros selecionados.
            </div>
          )}
        </div>
      </div>

      {/* Signature and Verification lines strictly on Printable mode */}
      <div className="hidden print-only mt-16 grid grid-cols-2 gap-12 text-center text-xs text-slate-400">
        <div>
          <div className="border-t border-slate-300 w-48 mx-auto pt-2"></div>
          <p>Assinatura do Gestor de Frota</p>
        </div>
        <div>
          <div className="border-t border-slate-300 w-48 mx-auto pt-2"></div>
          <p>Assinatura do Responsável Financeiro</p>
        </div>
      </div>
    </div>
  );
}
