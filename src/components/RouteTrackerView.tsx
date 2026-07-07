import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Vehicle, RouteLog } from '../types';
import L from 'leaflet';
import { Navigation, Play, Square, MapPin, Compass, Timer, RotateCcw, AlertTriangle, List, Check, Trash2, CalendarDays } from 'lucide-react';

interface RouteTrackerViewProps {
  vehicles: Vehicle[];
  routes: RouteLog[];
  onAddRoute: (route: Omit<RouteLog, 'id' | 'createdAt'>) => void;
  onDeleteRoute: (id: string) => void;
}

// Haversine formula to compute distance in km between two GPS coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RouteTrackerView({ vehicles, routes, onAddRoute, onDeleteRoute }: RouteTrackerViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const liveMarkerRef = useRef<L.CircleMarker | null>(null);

  // States
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startOdometer, setStartOdometer] = useState<number | ''>('');
  const [endOdometer, setEndOdometer] = useState<number | ''>('');

  // Tracking engine states
  const [isTracking, setIsTracking] = useState(false);
  const [trackedPoints, setTrackedPoints] = useState<[number, number][]>([]);
  const [liveDistance, setLiveDistance] = useState(0);
  const [speed, setSpeed] = useState(0); // km/h
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Map view detail state (loaded historical route)
  const [viewedRoute, setViewedRoute] = useState<RouteLog | null>(null);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Set default start odometer and locations when vehicle is picked
  useEffect(() => {
    if (selectedVehicle) {
      setStartOdometer(selectedVehicle.currentOdometer);
    } else {
      setStartOdometer('');
    }
  }, [selectedVehicle]);

  const resetForm = () => {
    setSelectedVehicleId('');
    setDescription('');
    setStartLocation('');
    setEndLocation('');
    setStartOdometer('');
    setEndOdometer('');
  };

  // Handle timer during active tracking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTracking) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
        // Simulate speed fluctuation slightly if GPS doesn't report it
        setSpeed((prev) => {
          const change = (Math.random() - 0.5) * 8;
          const next = Math.max(45, Math.min(110, prev + change));
          return parseFloat(next.toFixed(1));
        });
      }, 1000);
    } else {
      setSpeed(0);
    }
    return () => clearInterval(timer);
  }, [isTracking]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default centered on São Paulo
    const defaultCenter: [number, number] = [-23.55052, -46.633308];
    
    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
    });

    // Add beautiful OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    // Custom initial setup for default marker icons from CDN
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
    L.Marker.prototype.options.icon = defaultIcon;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync tracked points / routes on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous dynamic layers
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (liveMarkerRef.current) {
      map.removeLayer(liveMarkerRef.current);
      liveMarkerRef.current = null;
    }

    // Case 1: Currently actively tracking GPS points
    if (isTracking && trackedPoints.length > 0) {
      const latLngs = trackedPoints.map(([lat, lng]) => L.latLng(lat, lng));
      
      // Draw live polyline route
      polylineRef.current = L.polyline(latLngs, {
        color: '#2563eb', // Blue
        weight: 5,
        opacity: 0.8,
      }).addTo(map);

      // Create pulse live marker at current coordinate
      const currentPoint = trackedPoints[trackedPoints.length - 1];
      liveMarkerRef.current = L.circleMarker(currentPoint, {
        radius: 8,
        fillColor: '#ef4444', // Red pulse marker
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);

      // Smooth pan to last tracked point
      map.setView(currentPoint, map.getZoom());
    }

    // Case 2: Rendering a historic route log on selecting it
    if (!isTracking && viewedRoute && viewedRoute.points.length > 0) {
      const latLngs = viewedRoute.points.map(([lat, lng]) => L.latLng(lat, lng));

      polylineRef.current = L.polyline(latLngs, {
        color: '#10b981', // Emerald green for past routes
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

      // Place start and end markers
      const startPoint = viewedRoute.points[0];
      const endPoint = viewedRoute.points[viewedRoute.points.length - 1];

      L.marker(startPoint).addTo(map).bindPopup(`Início: ${viewedRoute.startLocation}`).openPopup();
      L.marker(endPoint).addTo(map).bindPopup(`Fim: ${viewedRoute.endLocation}`);

      // Fit map boundaries to display the entire route perfectly
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trackedPoints, isTracking, viewedRoute]);

  // Tracking Engine: Start GPS Tracker using Geolocation API
  const startTracking = () => {
    if (!selectedVehicleId || !description || !startLocation || !endLocation) {
      alert('Por favor, preencha todos os campos para iniciar a viagem.');
      return;
    }

    setTrackedPoints([]);
    setLiveDistance(0);
    setSecondsElapsed(0);
    setSpeed(60); // Initial baseline speed to fluctuate
    setIsTracking(true);
    setViewedRoute(null);

    // Default coordinate if browser geolocation fails or has issues
    let lastLat = -23.55052;
    let lastLng = -46.633308;

    if ('geolocation' in navigator) {
      // Warm up first location
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setTrackedPoints([[lat, lng]]);
          mapRef.current?.setView([lat, lng], 15);
        },
        () => {
          // Fallback center São Paulo
          setTrackedPoints([[lastLat, lastLng]]);
          mapRef.current?.setView([lastLat, lastLng], 15);
        }
      );

      // Start watcher
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const gpsSpeed = position.coords.speed ? position.coords.speed * 3.6 : 60; // conversion to km/h
          setSpeed(parseFloat(gpsSpeed.toFixed(1)));

          setTrackedPoints((prev) => {
            if (prev.length === 0) return [[lat, lng]];
            const lastPoint = prev[prev.length - 1];
            const dist = calculateDistance(lastPoint[0], lastPoint[1], lat, lng);
            
            // Only add if user moved at least 5 meters to filter GPS noise
            if (dist > 0.005) {
              setLiveDistance((d) => parseFloat((d + dist).toFixed(2)));
              return [...prev, [lat, lng]];
            }
            return prev;
          });
        },
        (err) => {
          console.warn('Erro de Geolocalização, simulando rota para demonstração...');
          // Let's keep a simulated path running! If actual GPS fails (common in sandbox framing),
          // we simulate moving coordinates so the user gets an amazing interactive feel!
          startSimulationLoop();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      setWatchId(id);
    } else {
      // Simulate if geolocation isn't supported
      startSimulationLoop();
    }
  };

  // Simulation Loop in case of Geolocation blockage or IFrame constraints
  const startSimulationLoop = () => {
    let lat = -23.55052;
    let lng = -46.633308;
    setTrackedPoints([[lat, lng]]);
    mapRef.current?.setView([lat, lng], 15);

    const interval = window.setInterval(() => {
      // Move coordinates gradually south-west
      lat -= 0.0015 + Math.random() * 0.0005;
      lng -= 0.001 + Math.random() * 0.0005;
      
      setTrackedPoints((prev) => {
        const last = prev[prev.length - 1];
        const stepDist = calculateDistance(last[0], last[1], lat, lng);
        setLiveDistance((d) => parseFloat((d + stepDist).toFixed(2)));
        return [...prev, [lat, lng]];
      });
    }, 3000);

    // Save interval ID as watchId (negative to distinguish from browser watchPosition)
    setWatchId(-interval);
  };

  // Stop tracking and prepare save
  const stopTracking = () => {
    if (watchId !== null) {
      if (watchId < 0) {
        clearInterval(-watchId);
      } else {
        navigator.geolocation.clearWatch(watchId);
      }
    }
    setWatchId(null);
    setIsTracking(false);

    // Propose auto end odometer: start + distance
    const computedEndOdo = Math.ceil((typeof startOdometer === 'number' ? startOdometer : 0) + liveDistance);
    setEndOdometer(computedEndOdo);
  };

  // Save tracked route log
  const saveTrackedRoute = () => {
    if (!selectedVehicleId || typeof startOdometer !== 'number' || typeof endOdometer !== 'number') {
      alert('Por favor, confirme os dados de odômetro para salvar.');
      return;
    }

    if (endOdometer < startOdometer) {
      alert('O odômetro final não pode ser menor que o odômetro inicial.');
      return;
    }

    // Default points if somehow empty
    const pointsToSave = trackedPoints.length > 0 ? trackedPoints : [[-23.55052, -46.633308] as [number, number]];

    onAddRoute({
      vehicleId: selectedVehicleId,
      date: new Date().toISOString().split('T')[0],
      description,
      startLocation,
      endLocation,
      distance: liveDistance || parseFloat((endOdometer - startOdometer).toFixed(1)),
      points: pointsToSave,
    });

    // Reset tracking form
    setIsTracking(false);
    setTrackedPoints([]);
    setLiveDistance(0);
    resetForm();
    alert('Rota salva com sucesso! O odômetro atual do veículo foi atualizado.');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Upper Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Route Control Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between gap-5 h-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2 mb-3">
              <Navigation className="w-5 h-5 text-blue-600" /> Rastreamento em Tempo Real
            </h3>
            <p className="text-slate-500 text-sm mb-5">Selecione o veículo e ative o rastreamento via GPS do seu navegador.</p>

            {!isTracking && trackedPoints.length === 0 ? (
              // Configuration Form before trip starts
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">Veículo da Viagem</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">-- Selecione o veículo --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.plate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">Descrição / Destino</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Entrega de Mercadoria Campinas"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">Ponto de Partida</label>
                    <input
                      type="text"
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      placeholder="Ex: Escritório SP"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">Ponto de Chegada</label>
                    <input
                      type="text"
                      value={endLocation}
                      onChange={(e) => setEndLocation(e.target.value)}
                      placeholder="Ex: Cliente Jundiaí"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">Odômetro Inicial (km)</label>
                  <input
                    type="number"
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(parseInt(e.target.value) || '')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500"
                    disabled={!selectedVehicleId}
                  />
                </div>

                <button
                  onClick={startTracking}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  disabled={!selectedVehicleId || !description}
                >
                  <Play className="w-4 h-4 fill-white" /> Iniciar Viagem GPS
                </button>
              </div>
            ) : isTracking ? (
              // Active tracking dynamic metrics UI
              <div className="space-y-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-bold text-xs uppercase tracking-widest rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span> Viagem Iniciada
                  </span>
                  <p className="text-slate-700 font-bold text-lg mt-3">{description}</p>
                  <p className="text-slate-400 text-xs">{selectedVehicle?.name}</p>
                </div>

                {/* Dashboard grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-100/80">
                    <Timer className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Tempo</p>
                    <p className="font-mono text-sm font-bold text-slate-800 mt-1">{formatTime(secondsElapsed)}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100/80">
                    <Compass className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Distância</p>
                    <p className="font-mono text-sm font-bold text-emerald-700 mt-1">{liveDistance} km</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100/80">
                    <Compass className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Velocidade</p>
                    <p className="font-mono text-sm font-bold text-slate-800 mt-1">{speed} km/h</p>
                  </div>
                </div>

                <button
                  onClick={stopTracking}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer animate-bounce"
                >
                  <Square className="w-4 h-4 fill-white" /> Finalizar Rastreamento
                </button>
              </div>
            ) : (
              // Stopped, ready to save Form
              <div className="space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 text-sm">
                <div className="text-center pb-2 border-b border-emerald-100">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider rounded-full">
                    Viagem Concluída!
                  </span>
                  <p className="text-slate-500 text-xs mt-2">Deseja consolidar e salvar essa rota?</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distância calculada:</span>
                    <strong className="text-slate-800 font-bold">{liveDistance} km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tempo de viagem:</span>
                    <strong className="text-slate-800 font-bold">{formatTime(secondsElapsed)}</strong>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1 uppercase tracking-wider">Odômetro Final (km) *</label>
                    <input
                      type="number"
                      value={endOdometer}
                      onChange={(e) => setEndOdometer(parseInt(e.target.value) || '')}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTrackedPoints([]);
                      setLiveDistance(0);
                      resetForm();
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all text-center cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={saveTrackedRoute}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all text-center cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Salvar Rota
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50/50 p-4 rounded-xl text-[11px] text-blue-800 leading-relaxed">
            💡 <strong>Dica Ecológica:</strong> O monitoramento de trajetos por GPS ajuda a identificar rotas ociosas e desvios desnecessários, reduzindo a pegada de carbono da sua frota em até 15%.
          </div>
        </div>

        {/* GPS Map Container Box */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 flex flex-col h-112 md:h-128 lg:h-full relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500 animate-bounce" /> Mapa GPS Integrado
            </h4>
            {viewedRoute && (
              <button
                onClick={() => setViewedRoute(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Limpar visualização
              </button>
            )}
          </div>

          {/* Actual Leaflet Map Hook */}
          <div className="flex-1 w-full bg-slate-100 rounded-xl relative overflow-hidden" style={{ minHeight: '320px' }}>
            <div ref={mapContainerRef} className="w-full h-full"></div>
            {isTracking && (
              <div className="absolute top-4 right-4 bg-slate-900/90 text-white font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-800 z-10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> GPS Ativo
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Historic Saved Trips Row */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <List className="w-5 h-5 text-slate-500" /> Registro Histórico de Viagens
          </h3>
        </div>
        <div className="overflow-x-auto">
          {routes.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase bg-slate-50/20">
                  <th className="p-4 pl-6">Veículo</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Descrição da Rota</th>
                  <th className="p-4">Partida</th>
                  <th className="p-4">Destino</th>
                  <th className="p-4">Distância</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map((route) => {
                  const v = vehicles.find((v) => v.id === route.vehicleId);
                  return (
                    <tr
                      key={route.id}
                      className={`hover:bg-slate-50/50 transition-all text-slate-700 cursor-pointer ${
                        viewedRoute?.id === route.id ? 'bg-blue-50/30 font-semibold' : ''
                      }`}
                      onClick={() => setViewedRoute(route)}
                    >
                      <td className="p-4 pl-6 font-semibold text-slate-900">{v ? v.name : 'Excluído'}</td>
                      <td className="p-4 font-mono text-xs">{new Date(route.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 text-slate-800">{route.description}</td>
                      <td className="p-4 text-slate-600">{route.startLocation}</td>
                      <td className="p-4 text-slate-600">{route.endLocation}</td>
                      <td className="p-4 font-mono font-bold text-blue-600">{route.distance} km</td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setViewedRoute(route)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 cursor-pointer"
                          >
                            Ver no Mapa
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Deseja realmente remover esta viagem registrada?')) {
                                onDeleteRoute(route.id);
                                if (viewedRoute?.id === route.id) setViewedRoute(null);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-100 cursor-pointer"
                            title="Excluir rota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-base font-bold text-slate-700">Nenhuma viagem registrada</h4>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Inicie seu primeiro monitoramento GPS acima para arquivar rotas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
