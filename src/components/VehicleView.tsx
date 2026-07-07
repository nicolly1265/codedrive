import React, { useState } from 'react';
import { Vehicle, FuelType } from '../types';
import { Car, Plus, Trash2, Edit3, Settings, Save, X, CalendarDays, KeyRound, AlertTriangle } from 'lucide-react';

interface VehicleViewProps {
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onEditVehicle: (id: string, updated: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
}

const FUEL_OPTIONS: FuelType[] = ['Gasolina', 'Etanol', 'Diesel', 'GNV'];

export default function VehicleView({ vehicles, onAddVehicle, onEditVehicle, onDeleteVehicle }: VehicleViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [initialOdometer, setInitialOdometer] = useState<number>(0);
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);

  // Validation
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setBrand('');
    setModel('');
    setPlate('');
    setYear(new Date().getFullYear());
    setInitialOdometer(0);
    setCurrentOdometer(0);
    setFuelTypes([]);
    setError('');
  };

  const handleFuelToggle = (fuel: FuelType) => {
    setFuelTypes((prev) =>
      prev.includes(fuel) ? prev.filter((t) => t !== fuel) : [...prev, fuel]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brand || !model || !plate) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (fuelTypes.length === 0) {
      setError('Por favor, selecione pelo menos um tipo de combustível suportado.');
      return;
    }
    if (initialOdometer < 0 || currentOdometer < initialOdometer) {
      setError('A quilometragem atual não pode ser menor que a quilometragem inicial.');
      return;
    }

    if (editingId) {
      onEditVehicle(editingId, {
        name,
        brand,
        model,
        plate: plate.toUpperCase(),
        year,
        currentOdometer,
        initialOdometer,
        fuelTypes,
      });
      setEditingId(null);
    } else {
      onAddVehicle({
        name,
        brand,
        model,
        plate: plate.toUpperCase(),
        year,
        currentOdometer: currentOdometer || initialOdometer,
        initialOdometer,
        fuelTypes,
      });
      setIsAdding(false);
    }
    resetForm();
  };

  const startEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setName(v.name);
    setBrand(v.brand);
    setModel(v.model);
    setPlate(v.plate);
    setYear(v.year);
    setInitialOdometer(v.initialOdometer);
    setCurrentOdometer(v.currentOdometer);
    setFuelTypes(v.fuelTypes);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Frota de Veículos</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie, cadastre ou altere dados cadastrais e odômetro dos seus veículos.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Cadastrar Veículo
          </button>
        )}
      </div>

      {/* Adding/Editing Modal/Card */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              {editingId ? 'Editar Cadastro de Veículo' : 'Cadastrar Novo Veículo'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                resetForm();
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
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
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Apelido do Veículo *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Corolla Preto, Toro Trabalho"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Marca *</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Toyota, Ford, Fiat"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Modelo *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Corolla XEi 2.0 Flex"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Placa *</label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="Ex: BRA3F20 ou ABC-1234"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 uppercase transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Ano *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="1950"
                max={new Date().getFullYear() + 2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Km Inicial (Odometer) *</label>
              <input
                type="number"
                value={initialOdometer}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setInitialOdometer(val);
                  if (!editingId) setCurrentOdometer(val);
                }}
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm"
                required
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Km Atual *</label>
              <input
                type="number"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(parseInt(e.target.value) || 0)}
                min={initialOdometer}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">Combustíveis Suportados *</label>
            <div className="flex flex-wrap gap-3">
              {FUEL_OPTIONS.map((fuel) => {
                const checked = fuelTypes.includes(fuel);
                return (
                  <button
                    key={fuel}
                    type="button"
                    onClick={() => handleFuelToggle(fuel)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      checked
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {fuel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                resetForm();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" /> {editingId ? 'Salvar Alterações' : 'Salvar Veículo'}
            </button>
          </div>
        </form>
      )}

      {/* Grid listing vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-sm transition-all p-6 flex flex-col justify-between gap-5">
            {/* Upper part */}
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 font-display leading-tight">{v.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{v.brand} {v.model}</p>
                  </div>
                </div>
                <span className="bg-blue-50 text-blue-800 border border-blue-100 font-mono text-xs font-bold px-3 py-1 rounded-lg">
                  {v.plate}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/50">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Km Inicial</p>
                  <p className="font-mono text-sm font-bold text-slate-700 mt-0.5">{v.initialOdometer.toLocaleString('pt-BR')} km</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Km Atual</p>
                  <p className="font-mono text-sm font-bold text-slate-800 mt-0.5">{v.currentOdometer.toLocaleString('pt-BR')} km</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-slate-400 font-semibold">Combustíveis:</span>
                {v.fuelTypes.map((fuel) => (
                  <span key={fuel} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200/50">
                    {fuel}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
              <span className="text-xs text-slate-400">Ano de Fabricação: <strong className="text-slate-600 font-semibold">{v.year}</strong></span>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(v)}
                  className="p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all border border-slate-100 hover:border-blue-100 cursor-pointer"
                  title="Editar cadastro"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Deseja mesmo remover o veículo ${v.name}? Isso removerá também seus registros associados.`)) {
                      onDeleteVehicle(v.id);
                    }
                  }}
                  className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-slate-100 hover:border-red-100 cursor-pointer"
                  title="Excluir veículo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {vehicles.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-base font-bold text-slate-700">Nenhum veículo cadastrado</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Para começar a registrar abastecimentos, cadastre seu primeiro veículo.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              Cadastrar Veículo Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
