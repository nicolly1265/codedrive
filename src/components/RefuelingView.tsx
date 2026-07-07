import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, Refueling, FuelType } from '../types';
import { Fuel, Plus, Trash2, CalendarDays, Search, AlertTriangle, ArrowUpRight, Coins, Gauge, Check } from 'lucide-react';

interface RefuelingViewProps {
  vehicles: Vehicle[];
  refuelings: Refueling[];
  onAddRefueling: (refueling: Omit<Refueling, 'id' | 'tripDistance' | 'averageConsumption'>) => void;
  onDeleteRefueling: (id: string) => void;
}

export default function RefuelingView({ vehicles, refuelings, onAddRefueling, onDeleteRefueling }: RefuelingViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelType, setFuelType] = useState<FuelType | ''>('');
  const [odometer, setOdometer] = useState<number | ''>('');
  const [liters, setLiters] = useState<number | ''>('');
  const [pricePerLiter, setPricePerLiter] = useState<number | ''>('');
  const [totalSpent, setTotalSpent] = useState<number | ''>('');

  // Filtering list
  const [searchVehicleId, setSearchVehicleId] = useState('all');

  const [error, setError] = useState('');

  // Selected vehicle details for calculations
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Set default fuel type when vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      setFuelType(selectedVehicle.fuelTypes[0] || '');
      // Prefill odometer with current odometer
      setOdometer(selectedVehicle.currentOdometer);
    } else {
      setFuelType('');
      setOdometer('');
    }
  }, [selectedVehicle]);

  // Auto-calculate Total Spent when liters or price change
  useEffect(() => {
    if (typeof liters === 'number' && typeof pricePerLiter === 'number') {
      const computed = parseFloat((liters * pricePerLiter).toFixed(2));
      setTotalSpent(computed);
    }
  }, [liters, pricePerLiter]);

  // Auto-calculate liters if totalSpent and pricePerLiter are filled
  const handleTotalSpentChange = (val: number) => {
    setTotalSpent(val);
    if (typeof pricePerLiter === 'number' && pricePerLiter > 0) {
      const computedLiters = parseFloat((val / pricePerLiter).toFixed(2));
      setLiters(computedLiters);
    }
  };

  // Auto-calculate price if totalSpent and liters are filled
  const handleLitersChange = (val: number) => {
    setLiters(val);
    if (typeof pricePerLiter === 'number' && pricePerLiter > 0) {
      const computedSpent = parseFloat((val * pricePerLiter).toFixed(2));
      setTotalSpent(computedSpent);
    } else if (typeof totalSpent === 'number' && val > 0) {
      const computedPrice = parseFloat((totalSpent / val).toFixed(2));
      setPricePerLiter(computedPrice);
    }
  };

  // Find previous odometer of this vehicle to calculate trip distance
  const previousOdometer = useMemo(() => {
    if (!selectedVehicleId) return 0;
    const vehicleRefuelings = refuelings
      .filter((r) => r.vehicleId === selectedVehicleId)
      .sort((a, b) => b.odometer - a.odometer); // Sort descending

    if (vehicleRefuelings.length > 0) {
      return vehicleRefuelings[0].odometer; // Highest odometer recorded
    }

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    return vehicle ? vehicle.initialOdometer : 0;
  }, [selectedVehicleId, refuelings, vehicles]);

  // Current calculated trip distance based on entered odometer
  const calculatedTripDistance = useMemo(() => {
    if (typeof odometer !== 'number') return 0;
    return Math.max(0, odometer - previousOdometer);
  }, [odometer, previousOdometer]);

  // Current calculated consumption
  const calculatedConsumption = useMemo(() => {
    if (calculatedTripDistance <= 0 || typeof liters !== 'number' || liters <= 0) return 0;
    return parseFloat((calculatedTripDistance / liters).toFixed(2));
  }, [calculatedTripDistance, liters]);

  const resetForm = () => {
    setSelectedVehicleId('');
    setDate(new Date().toISOString().split('T')[0]);
    setFuelType('');
    setOdometer('');
    setLiters('');
    setPricePerLiter('');
    setTotalSpent('');
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !fuelType || typeof odometer !== 'number' || typeof liters !== 'number' || typeof pricePerLiter !== 'number' || typeof totalSpent !== 'number') {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (odometer <= previousOdometer) {
      setError(`O odômetro atual (${odometer} km) precisa ser maior do que o odômetro anterior registrado (${previousOdometer} km).`);
      return;
    }

    if (liters <= 0 || pricePerLiter <= 0 || totalSpent <= 0) {
      setError('Litragem, preço e total gasto devem ser maiores que zero.');
      return;
    }

    onAddRefueling({
      vehicleId: selectedVehicleId,
      date,
      fuelType: fuelType as FuelType,
      odometer,
      liters,
      pricePerLiter,
      totalSpent,
    });

    setIsAdding(false);
    resetForm();
  };

  // Filter refuelings based on search selection
  const filteredRefuelings = useMemo(() => {
    let list = [...refuelings];
    if (searchVehicleId !== 'all') {
      list = list.filter((r) => r.vehicleId === searchVehicleId);
    }
    // Sort chronologically descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [refuelings, searchVehicleId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Registrar Abastecimento</h2>
          <p className="text-slate-500 text-sm mt-1">Insira os abastecimentos para acompanhar os custos, consumo e quilômetros rodados.</p>
        </div>
        {!isAdding && vehicles.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Abastecimento
          </button>
        )}
      </div>

      {/* Adding refueling Card */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <Fuel className="w-5 h-5 text-blue-600" />
              Lançar Abastecimento
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Selecione o Veículo *</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white transition-all text-sm"
                required
              >
                <option value="">-- Escolha um veículo --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.plate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Data do Abastecimento *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Tipo de Combustível *</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white transition-all text-sm"
                required
                disabled={!selectedVehicleId}
              >
                <option value="">-- Selecione --</option>
                {selectedVehicle?.fuelTypes.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {fuel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Odômetro Atual (km) *</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(parseInt(e.target.value) || '')}
                min={previousOdometer + 1}
                placeholder={previousOdometer ? `Anterior: ${previousOdometer} km` : 'Odômetro atual'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm font-mono"
                required
                disabled={!selectedVehicleId}
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Preço por Litro (R$) *</label>
              <input
                type="number"
                step="0.001"
                value={pricePerLiter}
                onChange={(e) => setPricePerLiter(parseFloat(e.target.value) || '')}
                placeholder="Ex: 5.89"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm font-mono"
                required
                disabled={!selectedVehicleId}
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Liters Abastecidos (L) *</label>
              <input
                type="number"
                step="0.01"
                value={liters}
                onChange={(e) => handleLitersChange(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 45.5"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm font-mono"
                required
                disabled={!selectedVehicleId}
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Valor Total Gasto (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={totalSpent}
                onChange={(e) => handleTotalSpentChange(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 268.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm font-mono"
                required
                disabled={!selectedVehicleId}
              />
            </div>
          </div>

          {/* Real-time precalculated preview statistics inside refueling form */}
          {selectedVehicleId && odometer && liters && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium">Distância Percorrida</p>
                  <p className="font-bold text-slate-800">{calculatedTripDistance} km</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium">Consumo Calculado</p>
                  <p className="font-bold text-emerald-700">{calculatedConsumption > 0 ? `${calculatedConsumption} km/L` : '---'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium">Custo por Km Rodado</p>
                  <p className="font-bold text-slate-800">
                    {calculatedTripDistance > 0 && typeof totalSpent === 'number'
                      ? `R$ ${(totalSpent / calculatedTripDistance).toFixed(2)}/km`
                      : '---'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              Registrar Abastecimento
            </button>
          </div>
        </form>
      )}

      {/* History table list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-900 font-display">Histórico de Abastecimentos</h3>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <select
              value={searchVehicleId}
              onChange={(e) => setSearchVehicleId(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">Todos os veículos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          {filteredRefuelings.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase bg-slate-50/20">
                  <th className="p-4 pl-6">Veículo</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Odômetro</th>
                  <th className="p-4">Combustível</th>
                  <th className="p-4">Litros</th>
                  <th className="p-4">R$ / Litro</th>
                  <th className="p-4">Valor Total</th>
                  <th className="p-4">KM Rodados</th>
                  <th className="p-4">Média (KM/L)</th>
                  <th className="p-4 pr-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRefuelings.map((ref) => {
                  const v = vehicles.find((v) => v.id === ref.vehicleId);
                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-all text-slate-700">
                      <td className="p-4 pl-6 font-semibold text-slate-900">{v ? v.name : 'Veículo Deletado'}</td>
                      <td className="p-4 font-mono text-xs">{new Date(ref.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 font-mono font-semibold">{ref.odometer.toLocaleString('pt-BR')} km</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold rounded-md">
                          {ref.fuelType}
                        </span>
                      </td>
                      <td className="p-4 font-mono">{ref.liters.toFixed(2)} L</td>
                      <td className="p-4 font-mono">R$ {ref.pricePerLiter.toFixed(2)}</td>
                      <td className="p-4 font-mono font-bold text-slate-900">R$ {ref.totalSpent.toFixed(2)}</td>
                      <td className="p-4 font-mono text-emerald-600 font-semibold">+{ref.tripDistance} km</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-xs">
                          {ref.averageConsumption.toFixed(2)} km/L
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <button
                          onClick={() => {
                            if (confirm('Deseja realmente remover este registro de abastecimento?')) {
                              onDeleteRefueling(ref.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-100 cursor-pointer"
                          title="Remover registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Fuel className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-base font-bold text-slate-700">Nenhum abastecimento encontrado</h4>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Filtrado por veículo ou nenhum abastecimento cadastrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
