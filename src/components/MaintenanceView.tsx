import React, { useState, useMemo } from 'react';
import { Vehicle, MaintenanceAlert } from '../types';
import { ShieldAlert, Plus, Trash2, CalendarDays, CheckCircle, Clock, AlertTriangle, Save, X, Settings, Sparkles } from 'lucide-react';

interface MaintenanceViewProps {
  vehicles: Vehicle[];
  alerts: MaintenanceAlert[];
  onAddAlert: (alert: Omit<MaintenanceAlert, 'id' | 'nextDueOdometer'>) => void;
  onPerformMaintenance: (id: string, currentOdometer: number) => void;
  onDeleteAlert: (id: string) => void;
}

export default function MaintenanceView({ vehicles, alerts, onAddAlert, onPerformMaintenance, onDeleteAlert }: MaintenanceViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [intervalKm, setIntervalKm] = useState<number | ''>('');
  const [lastDoneOdometer, setLastDoneOdometer] = useState<number | ''>('');

  const [error, setError] = useState('');

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Set default last done odometer to vehicle's current odometer
  React.useEffect(() => {
    if (selectedVehicle) {
      setLastDoneOdometer(selectedVehicle.currentOdometer);
    } else {
      setLastDoneOdometer('');
    }
  }, [selectedVehicle]);

  const resetForm = () => {
    setSelectedVehicleId('');
    setDescription('');
    setIntervalKm('');
    setLastDoneOdometer('');
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !description || typeof intervalKm !== 'number' || typeof lastDoneOdometer !== 'number') {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (intervalKm <= 0) {
      setError('O intervalo de manutenção deve ser maior que zero quilômetros.');
      return;
    }

    if (lastDoneOdometer < 0) {
      setError('O odômetro da última realização não pode ser negativo.');
      return;
    }

    onAddAlert({
      vehicleId: selectedVehicleId,
      description,
      intervalKm,
      lastDoneOdometer,
    });

    setIsAdding(false);
    resetForm();
  };

  // Pre-compiled list of alerts with computed status and details
  const alertsWithStatus = useMemo(() => {
    return alerts.map((alert) => {
      const vehicle = vehicles.find((v) => v.id === alert.vehicleId);
      const currentKm = vehicle ? vehicle.currentOdometer : 0;
      const kmRemaining = alert.nextDueOdometer - currentKm;

      let status: 'ok' | 'due_soon' | 'overdue' = 'ok';
      let statusLabel = 'Em Dia';
      let statusClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';

      if (kmRemaining <= 0) {
        status = 'overdue';
        statusLabel = 'CRÍTICO / VENCIDA';
        statusClass = 'bg-rose-50 text-rose-800 border-rose-200';
      } else if (kmRemaining <= 1000) {
        status = 'due_soon';
        statusLabel = 'ATENÇÃO / REALIZAR BREVE';
        statusClass = 'bg-amber-50 text-amber-800 border-amber-200';
      }

      return {
        ...alert,
        vehicleName: vehicle ? vehicle.name : 'Veículo Excluído',
        vehiclePlate: vehicle ? vehicle.plate : '',
        currentKm,
        kmRemaining,
        status,
        statusLabel,
        statusClass,
      };
    }).sort((a, b) => {
      // Sort priority: overdue, then due_soon, then ok
      const weight = { overdue: 3, due_soon: 2, ok: 1 };
      return weight[b.status] - weight[a.status];
    });
  }, [alerts, vehicles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Plano de Manutenção Preventiva</h2>
          <p className="text-slate-500 text-sm mt-1">Monitore prazos de revisão por quilometragem e registre manutenções efetuadas.</p>
        </div>
        {!isAdding && vehicles.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Criar Regra de Manutenção
          </button>
        )}
      </div>

      {/* Add Alert Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              Configurar Alerta Preventivo
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

            <div className="md:col-span-2">
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Descrição do Serviço Preventivo *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Troca de Óleo 10w30, Rodízio de Pneus, Correia Dentada"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">Intervalo em Quilômetros (KM) *</label>
              <input
                type="number"
                value={intervalKm}
                onChange={(e) => setIntervalKm(parseInt(e.target.value) || '')}
                placeholder="Ex: 10000 para troca de óleo"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">O odômetro da Última Realização (KM) *</label>
              <input
                type="number"
                value={lastDoneOdometer}
                onChange={(e) => setLastDoneOdometer(parseInt(e.target.value) || 0)}
                placeholder="Km em que foi feito"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 transition-all text-sm font-mono"
                required
                disabled={!selectedVehicleId}
              />
            </div>
          </div>

          {selectedVehicleId && intervalKm && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-slate-700 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                Isso criará uma rotina recorrente de manutenção. O próximo vencimento do veículo{' '}
                <strong>{selectedVehicle?.name}</strong> ocorrerá aos{' '}
                <strong className="font-mono text-blue-800 text-base">
                  {((lastDoneOdometer || 0) + (intervalKm || 0)).toLocaleString('pt-BR')} km
                </strong>
                .
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
              Salvar Alerta
            </button>
          </div>
        </form>
      )}

      {/* Grid listing alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alertsWithStatus.map((alert) => {
          const isOverdue = alert.status === 'overdue';
          const isWarning = alert.status === 'due_soon';
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl border transition-all p-6 flex flex-col justify-between gap-5 shadow-xs ${
                isOverdue
                  ? 'border-red-200 bg-red-50/10'
                  : isWarning
                  ? 'border-amber-200 bg-amber-50/10'
                  : 'border-slate-100'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl ${
                        isOverdue
                          ? 'bg-red-100 text-red-700'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isOverdue ? (
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-6 h-6" />
                      ) : (
                        <CheckCircle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900 font-display leading-tight">{alert.description}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">{alert.vehicleName}</span>
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {alert.vehiclePlate}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase ${alert.statusClass}`}>
                    {alert.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 bg-white p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Última Realização</p>
                    <p className="font-mono text-xs font-semibold text-slate-600 mt-0.5">
                      {alert.lastDoneOdometer.toLocaleString('pt-BR')} km
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Próximo Vencimento</p>
                    <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                      {alert.nextDueOdometer.toLocaleString('pt-BR')} km
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    Odômetro atual:{' '}
                    <strong className="text-slate-700 font-semibold font-mono">
                      {alert.currentKm.toLocaleString('pt-BR')} km
                    </strong>
                  </span>
                  <span
                    className={`font-semibold font-mono ${
                      isOverdue ? 'text-red-600' : isWarning ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {isOverdue
                      ? `VENCIDA HÁ ${Math.abs(alert.kmRemaining).toLocaleString('pt-BR')} km!`
                      : `Faltam ${alert.kmRemaining.toLocaleString('pt-BR')} km`}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                <span className="text-xs text-slate-400">Recorrência: a cada <strong>{alert.intervalKm.toLocaleString('pt-BR')} km</strong></span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Deseja registrar que efetuou a "${alert.description}" agora? O odômetro da última realização será atualizado para o odômetro atual do veículo (${alert.currentKm} km).`
                        )
                      ) {
                        onPerformMaintenance(alert.id, alert.currentKm);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 hover:border-emerald-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Concluído
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja mesmo remover a regra de manutenção preventiva "${alert.description}"?`)) {
                        onDeleteAlert(alert.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent rounded-lg transition-all cursor-pointer"
                    title="Excluir regra"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-base font-bold text-slate-700">Nenhum plano de manutenção ativo</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Cadastre lembretes de revisões periódicas baseadas na quilometragem do seu carro.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              Criar Alerta de Revisão
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
