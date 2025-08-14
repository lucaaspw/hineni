"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Music,
  Plus,
  Settings,
  LogOut,
  Star,
  FileText,
  Trash2,
  Eye,
  Edit,
  Calendar,
} from "lucide-react";
import { MusicViewer } from "@/components/music-viewer";
import { toast } from "sonner";

interface Music {
  id: string;
  title: string;
  artist?: string;
  lyrics: string;
  chords?: string;
  isNewOfWeek: boolean;
}

interface RepertoireItem {
  id: string;
  position: number;
  isManual: boolean;
  music: Music;
}

// Cache local para evitar re-fetch desnecessário
let localRepertoireCache: RepertoireItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = process.env.NODE_ENV === 'production' ? 2 * 60 * 1000 : 5 * 60 * 1000; // 2 min produção, 5 min dev

// Função para invalidar cache local
function invalidateLocalCache() {
  localRepertoireCache = null;
  cacheTimestamp = 0;
}

// Função para forçar refresh dos dados (será definida após fetchData)

export default function AdminPage() {
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [showRepertoireForm, setShowRepertoireForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [generatingRepertoire, setGeneratingRepertoire] = useState(false);
  const [repertoireFormData, setRepertoireFormData] = useState({
    musicId: "",
    position: 1,
    isManual: false,
  });
  const [swapModal, setSwapModal] = useState<{
    open: boolean;
    item: RepertoireItem | null;
  }>({ open: false, item: null });
  const [swapMusicId, setSwapMusicId] = useState("");
  const [swapLoading, setSwapLoading] = useState(false);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify");
      if (!response.ok) {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [checkAuth]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Verificar cache local primeiro (a menos que seja um refresh forçado)
    if (!forceRefresh && localRepertoireCache && now - cacheTimestamp < CACHE_DURATION) {
      setRepertoire(localRepertoireCache);
      setLoading(false);
      return;
    }

    try {
      // Headers para forçar refresh quando necessário
      const headers: HeadersInit = {};
      if (forceRefresh) {
        headers['Cache-Control'] = 'no-cache';
      }

      const repertoireResponse = await fetch("/api/repertoire", { headers });

      if (repertoireResponse.ok) {
        const repertoireData = await repertoireResponse.json();
        setRepertoire(repertoireData);
        localRepertoireCache = repertoireData;
      }

      // Atualizar timestamp do cache
      cacheTimestamp = now;
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para forçar refresh dos dados
  const forceRefresh = useCallback(() => {
    invalidateLocalCache();
    return fetchData(true);
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      console.error("Erro ao fazer logout");
    }
  };

  const handleRepertoireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const response = await fetch("/api/repertoire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(repertoireFormData),
      });

      if (response.ok) {
        setRepertoireFormData({
          musicId: "",
          position: 1,
          isManual: false,
        });
        setShowRepertoireForm(false);
        
        // Atualizar cache local imediatamente
        const newItem = await response.json();
        setRepertoire(prev => [...prev, newItem]);
        localRepertoireCache = [...(localRepertoireCache || []), newItem];
        
        toast.success("Música adicionada ao repertório!");
      } else {
        toast.error("Erro ao adicionar ao repertório");
      }
    } catch (error) {
      console.error("Erro ao adicionar ao repertório:", error);
      toast.error("Erro ao adicionar ao repertório");
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewMusic = (music: Music) => {
    setSelectedMusic(music);
  };

  // Função para trocar música do repertório
  const handleSwapMusic = async () => {
    if (!swapModal.item || !swapMusicId) return;
    setSwapLoading(true);
    try {
      const response = await fetch(`/api/repertoire`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: swapModal.item.id,
          musicId: swapMusicId,
        }),
      });
      if (response.ok) {
        const updatedItem = await response.json();
        
        // Atualizar cache local imediatamente
        setRepertoire(prev => prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ));
        localRepertoireCache = (localRepertoireCache || []).map(item => 
          item.id === updatedItem.id ? updatedItem : item
        );
        
        setSwapModal({ open: false, item: null });
        setSwapMusicId("");
        toast.success("Música trocada com sucesso!");
      } else {
        toast.error("Erro ao trocar música do repertório");
      }
    } catch (error) {
      toast.error("Erro ao trocar música do repertório");
    } finally {
      setSwapLoading(false);
    }
  };

  // Função para gerar repertório automaticamente
  const handleGenerateRepertoire = async () => {
    if (!confirm("Isso irá limpar o repertório atual e gerar um novo automaticamente. Continuar?")) {
      return;
    }

    setGeneratingRepertoire(true);
    try {
      const response = await fetch("/api/repertoire/generate", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Repertório gerado com sucesso! ${result.total} músicas adicionadas.`);
        
        // Atualizar o repertório na interface
        if (result.repertoire) {
          setRepertoire(result.repertoire);
          localRepertoireCache = result.repertoire;
        }
        
        // Recarregar dados para garantir sincronização
        setTimeout(() => fetchData(true), 100);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao gerar repertório");
      }
    } catch (error) {
      console.error("Erro ao gerar repertório:", error);
      toast.error("Erro ao gerar repertório");
    } finally {
      setGeneratingRepertoire(false);
    }
  };

  // Função para buscar músicas disponíveis para o repertório
  const [availableMusics, setAvailableMusics] = useState<Music[]>([]);
  
  const fetchAvailableMusics = useCallback(async () => {
    try {
      const response = await fetch("/api/musics");
      if (response.ok) {
        const musicsData = await response.json();
        // Filtrar músicas que não estão no repertório
        const available = musicsData.filter((music: Music) => 
          !repertoire.some(item => item.music.id === music.id)
        );
        setAvailableMusics(available);
      }
    } catch (error) {
      console.error("Erro ao buscar músicas disponíveis:", error);
    }
  }, [repertoire]);

  // Buscar músicas disponíveis quando o repertório mudar
  useEffect(() => {
    if (repertoire.length > 0) {
      fetchAvailableMusics();
    }
  }, [repertoire, fetchAvailableMusics]);

  // Adicionar botão de refresh manual
  const handleManualRefresh = () => {
    fetchData(true);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10">
                <Settings className="w-5 h-5 sm:w-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Painel Administrativo
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Gerencie o repertório semanal
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleManualRefresh}
                className="w-full sm:w-auto"
              >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Atualizar
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Repertório Section - Layout otimizado para desktop */}
        <div className="max-w-6xl mx-auto">
          {/* Header da seção com melhor organização */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Repertório Semanal
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                      Gerencie as músicas que serão cantadas esta semana
                    </p>
                  </div>
                </div>
                
                {/* Estatísticas rápidas */}
                {repertoire.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{repertoire.length} músicas no repertório</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{repertoire.filter(item => item.music.isNewOfWeek).length} nova da semana</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>{repertoire.filter(item => item.isManual).length} adições manuais</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={handleGenerateRepertoire}
                  disabled={generatingRepertoire}
                  className="h-11 px-6 text-base font-medium"
                >
                  {generatingRepertoire ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5 mr-2" />
                      Gerar Automático
                    </>
                  )}
                </Button>
                <Dialog
                  open={showRepertoireForm}
                  onOpenChange={setShowRepertoireForm}
                >
                  <DialogTrigger asChild>
                    <Button className="h-11 px-6 text-base font-medium">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar Manual
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full h-full sm:w-auto sm:h-auto sm:max-w-lg sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2 text-xl">
                        <Plus className="w-6 h-6" />
                        <span>Adicionar ao Repertório</span>
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRepertoireSubmit} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="musicId" className="text-base font-medium">Música *</Label>
                        <select
                          id="musicId"
                          value={repertoireFormData.musicId}
                          onChange={(e) =>
                            setRepertoireFormData({
                              ...repertoireFormData,
                              musicId: e.target.value,
                            })
                          }
                          required
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option className="text-gray-500" value="">
                            Selecione uma música
                          </option>
                          {availableMusics.map((music) => (
                            <option
                              className="text-gray-700 dark:text-gray-300"
                              key={music.id}
                              value={music.id}
                            >
                              {music.title.length > 50 
                                ? `${music.title.substring(0, 50)}...` 
                                : music.title
                              }
                              {music.artist && ` - ${
                                music.artist.length > 30 
                                  ? `${music.artist.substring(0, 30)}...` 
                                  : music.artist
                              }`}
                              {music.isNewOfWeek && " ⭐ (Nova da Semana)"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="position" className="text-base font-medium">Posição *</Label>
                        <Input
                          id="position"
                          type="number"
                          min="1"
                          max="6"
                          value={repertoireFormData.position}
                          onChange={(e) =>
                            setRepertoireFormData({
                              ...repertoireFormData,
                              position: parseInt(e.target.value),
                            })
                          }
                          required
                          className="h-11 text-base"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          💡 A música nova da semana aparecerá automaticamente em primeiro lugar
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="isManual"
                          checked={repertoireFormData.isManual}
                          onCheckedChange={(checked) =>
                            setRepertoireFormData({
                              ...repertoireFormData,
                              isManual: checked as boolean,
                            })
                          }
                          className="w-5 h-5"
                        />
                        <Label htmlFor="isManual" className="text-base font-medium">Adição manual</Label>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3 pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRepertoireForm(false)}
                          className="h-11 px-6 text-base font-medium"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={formLoading}
                          className="h-11 px-6 text-base font-medium"
                        >
                          {formLoading ? "Adicionando..." : "Adicionar"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Indicadores de status com melhor design */}
          {repertoire.length === 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-8 mb-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                    Repertório vazio
                  </h3>
                  <p className="text-lg text-yellow-700 dark:text-yellow-300 max-w-md mx-auto">
                    Use "Gerar Automático" para criar um novo repertório ou adicione músicas manualmente
                  </p>
                </div>
              </div>
            </div>
          )}

          {repertoire.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                    Ordenação automática
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    A música nova da semana aparece automaticamente em primeiro lugar no repertório
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lista do repertório com cards melhorados */}
          <div className="space-y-4">
            {repertoire.map((item, index) => (
              <Card
                key={item.id}
                className={`group hover:shadow-xl transition-all duration-300 border-2 ${
                  item.music.isNewOfWeek
                    ? "border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10"
                    : "border-gray-200 dark:border-gray-800 hover:border-primary/30"
                }`}
              >
                <CardHeader className="pb-6">
                  <CardTitle className="flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-4 xl:space-y-0">
                    <div className="flex items-center space-x-6">
                      <div
                        className={`flex items-center justify-center w-14 h-14 rounded-2xl font-bold text-xl ${
                          item.music.isNewOfWeek
                            ? "bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 shadow-lg"
                            : "bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-lg"
                        }`}
                      >
                        {item.music.isNewOfWeek ? (
                          <Star className="w-7 h-7" />
                        ) : (
                          item.position
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-2xl font-bold transition-colors truncate ${
                            item.music.isNewOfWeek
                              ? "text-green-700 dark:text-green-300"
                              : "text-gray-900 dark:text-white"
                          }`}
                          title={item.music.title}
                        >
                          {item.music.title.length > 40 
                            ? `${item.music.title.substring(0, 40)}...` 
                            : item.music.title
                          }
                        </h3>
                        {item.music.artist && (
                          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 truncate" title={item.music.artist}>
                            {item.music.artist.length > 35 
                              ? `${item.music.artist.substring(0, 35)}...` 
                              : item.music.artist
                            }
                          </p>
                        )}
                        {item.music.isNewOfWeek && (
                          <div className="flex items-center space-x-2 mt-3">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              <Star className="w-4 h-4 mr-1.5" />
                              Nova da Semana
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              ⭐ Aparece automaticamente em primeiro lugar
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
                      <div className="flex flex-wrap gap-2">
                        {item.music.isNewOfWeek && (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                            <Star className="w-4 h-4 mr-2" />
                            Nova da Semana
                          </span>
                        )}
                        {item.isManual && (
                          <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Manual
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setSwapModal({ open: true, item })}
                          className="h-11 px-6 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Trocar
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleViewMusic(item.music)}
                          className="h-11 px-6 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Estatísticas do repertório com design melhorado */}
          {repertoire.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Resumo do Repertório
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total de músicas</p>
                      <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{repertoire.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">Música nova da semana</p>
                      <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                        {repertoire.filter(item => item.music.isNewOfWeek).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Adições manuais</p>
                      <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                        {repertoire.filter(item => item.isManual).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Music Viewer Dialog */}
      <MusicViewer
        music={selectedMusic}
        open={!!selectedMusic}
        onOpenChange={(open) => !open && setSelectedMusic(null)}
      />

      {/* Modal de troca de música */}
      <Dialog
        open={swapModal.open}
        onOpenChange={(open) =>
          setSwapModal({ open, item: open ? swapModal.item : null })
        }
      >
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar Música do Repertório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="swap-music">Escolha a nova música</Label>
              <select
                id="swap-music"
                value={swapMusicId}
                onChange={(e) => setSwapMusicId(e.target.value)}
                className="w-full p-2 border rounded-md text-gray-500"
              >
                <option value="">Selecione uma música</option>
                {availableMusics
                  .filter((music) => music.id !== swapModal.item?.music.id)
                  .map((music) => (
                    <option key={music.id} value={music.id}>
                      {music.title.length > 50 
                        ? `${music.title.substring(0, 50)}...` 
                        : music.title
                      }
                      {music.artist && ` - ${
                        music.artist.length > 30 
                          ? `${music.artist.substring(0, 30)}...` 
                          : music.artist
                      }`}
                      {music.isNewOfWeek && " ⭐ (Nova da Semana)"}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSwapModal({ open: false, item: null })}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSwapMusic}
                disabled={!swapMusicId || swapLoading}
              >
                {swapLoading ? "Trocando..." : "Trocar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
