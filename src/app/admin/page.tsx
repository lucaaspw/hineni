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
let localMusicsCache: Music[] | null = null;
let localRepertoireCache: RepertoireItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default function AdminPage() {
  const [musics, setMusics] = useState<Music[]>([]);
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showRepertoireForm, setShowRepertoireForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatingRepertoire, setGeneratingRepertoire] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    lyrics: "",
    chords: "",
    isNewOfWeek: false,
  });
  const [editFormData, setEditFormData] = useState({
    id: "",
    title: "",
    artist: "",
    lyrics: "",
    chords: "",
    isNewOfWeek: false,
  });
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

  const fetchData = useCallback(async () => {
    const now = Date.now();

    // Verificar cache local primeiro
    if (localMusicsCache && localRepertoireCache && now - cacheTimestamp < CACHE_DURATION) {
      setMusics(localMusicsCache);
      setRepertoire(localRepertoireCache);
      setLoading(false);
      return;
    }

    try {
      const [musicsResponse, repertoireResponse] = await Promise.all([
        fetch("/api/musics"),
        fetch("/api/repertoire"),
      ]);

      if (musicsResponse.ok) {
        const musicsData = await musicsResponse.json();
        setMusics(musicsData);
        localMusicsCache = musicsData;
      }

      if (repertoireResponse.ok) {
        const repertoireData = await repertoireResponse.json();
        setRepertoire(repertoireData);
        localRepertoireCache = repertoireData;
      }

      // Atualizar timestamp do cache
      cacheTimestamp = now;
    } catch {
      console.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para forçar atualização imediata dos dados
  const forceRefreshData = useCallback(async () => {
    // Invalidar cache local
    localMusicsCache = null;
    localRepertoireCache = null;
    cacheTimestamp = 0;
    
    // Recarregar dados imediatamente
    await fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      console.error("Erro ao fazer logout");
    }
  };

  // Função otimizada para verificar duplicatas
  const checkDuplicateMusic = useCallback((
    title: string,
    artist: string,
    excludeId?: string
  ) => {
    return musics.find(
      (music) =>
        music.id !== excludeId &&
        music.title.toLowerCase() === title.toLowerCase() &&
        (music.artist || "").toLowerCase() === (artist || "").toLowerCase()
    );
  }, [musics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/musics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          title: "",
          artist: "",
          lyrics: "",
          chords: "",
          isNewOfWeek: false,
        });
        setShowAddForm(false);
        
        // Atualizar cache local imediatamente
        const newMusic = await response.json();
        setMusics(prev => [newMusic, ...prev]);
        localMusicsCache = [newMusic, ...(localMusicsCache || [])];
        
        toast.success("Música adicionada com sucesso!");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Erro ao adicionar música");
        toast.error(errorData.message || "Erro ao adicionar música");
      }
    } catch (error) {
      console.error("Erro ao adicionar música:", error);
      setErrorMessage("Erro de conexão. Tente novamente.");
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setFormLoading(false);
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

  const handleDeleteMusic = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta música?")) return;

    try {
      const response = await fetch(`/api/musics?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Atualizar cache local imediatamente
        setMusics(prev => prev.filter(music => music.id !== id));
        localMusicsCache = (localMusicsCache || []).filter(music => music.id !== id);
        
        // Remover do repertório se estiver lá
        setRepertoire(prev => prev.filter(item => item.music.id !== id));
        localRepertoireCache = (localRepertoireCache || []).filter(item => item.music.id !== id);
        
        toast.success("Música removida com sucesso!");
      } else {
        toast.error("Erro ao remover música");
      }
    } catch (error) {
      console.error("Erro ao remover música:", error);
      toast.error("Erro ao remover música");
    }
  };

  const handleEditMusic = (music: Music) => {
    setEditFormData({
      id: music.id,
      title: music.title,
      artist: music.artist || "",
      lyrics: music.lyrics,
      chords: music.chords || "",
      isNewOfWeek: music.isNewOfWeek,
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/musics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedMusic = await response.json();
        
        // Atualizar cache local imediatamente
        setMusics(prev => prev.map(music => 
          music.id === updatedMusic.id ? updatedMusic : music
        ));
        localMusicsCache = (localMusicsCache || []).map(music => 
          music.id === updatedMusic.id ? updatedMusic : music
        );
        
        // Atualizar no repertório se estiver lá
        setRepertoire(prev => prev.map(item => 
          item.music.id === updatedMusic.id 
            ? { ...item, music: updatedMusic }
            : item
        ));
        localRepertoireCache = (localRepertoireCache || []).map(item => 
          item.music.id === updatedMusic.id 
            ? { ...item, music: updatedMusic }
            : item
        );
        
        setEditFormData({
          id: "",
          title: "",
          artist: "",
          lyrics: "",
          chords: "",
          isNewOfWeek: false,
        });
        setShowEditForm(false);
        toast.success("Música editada com sucesso!");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Erro ao editar música");
        toast.error(errorData.message || "Erro ao editar música");
      }
    } catch (error) {
      console.error("Erro ao editar música:", error);
      setErrorMessage("Erro de conexão. Tente novamente.");
      toast.error("Erro de conexão. Tente novamente.");
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
        
        // Atualizar o repertório na interface
        if (result.repertoire) {
          setRepertoire(result.repertoire);
          localRepertoireCache = result.repertoire;
        }
        
        // Recarregar dados para garantir sincronização
        fetchData();
        
        toast.success(`Repertório gerado com sucesso! ${result.total} músicas adicionadas.`);
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

  // Memoização das músicas filtradas para o select
  const availableMusicsForRepertoire = useMemo(() => {
    return musics.filter(music => 
      !repertoire.some(item => item.music.id === music.id)
    );
  }, [musics, repertoire]);

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
                  Gerencie músicas e repertório
                </p>
              </div>
            </div>
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

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Repertório Section - AGORA PRIMEIRO */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center space-x-2">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Repertório Semanal ({repertoire.length})</span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleGenerateRepertoire}
                  disabled={generatingRepertoire}
                  className="w-full sm:w-auto"
                >
                  {generatingRepertoire ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Gerar Automático
                    </>
                  )}
                </Button>
                <Dialog
                  open={showRepertoireForm}
                  onOpenChange={setShowRepertoireForm}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Manual
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Plus className="w-5 h-5" />
                        <span>Adicionar ao Repertório</span>
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRepertoireSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="musicId">Música *</Label>
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
                          className="w-full p-2 border rounded-md text-gray-500"
                        >
                          <option className="text-gray-500" value="">
                            Selecione uma música
                          </option>
                          {availableMusicsForRepertoire.map((music) => (
                            <option key={music.id} value={music.id}>
                              {music.title}
                              {music.artist && ` - ${music.artist}`}
                              {music.isNewOfWeek && " ⭐ (Nova da Semana)"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Posição *</Label>
                        <select
                          id="position"
                          value={repertoireFormData.position}
                          onChange={(e) =>
                            setRepertoireFormData({
                              ...repertoireFormData,
                              position: parseInt(e.target.value),
                            })
                          }
                          required
                          className="w-full p-2 border rounded-md"
                        >
                          {Array.from({ length: 6 }, (_, i) => i + 1).map((pos) => (
                            <option key={pos} value={pos}>
                              Posição {pos}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isManual"
                          checked={repertoireFormData.isManual}
                          onCheckedChange={(checked) =>
                            setRepertoireFormData({
                              ...repertoireFormData,
                              isManual: checked as boolean,
                            })
                          }
                        />
                        <Label htmlFor="isManual">Adição manual</Label>
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRepertoireForm(false)}
                          className="w-full sm:w-auto"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={formLoading}
                          className="w-full sm:w-auto"
                        >
                          {formLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Lista do Repertório */}
            <div className="space-y-3 sm:space-y-4">
              {repertoire.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="space-y-3 sm:space-y-4">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">
                        Nenhum repertório definido
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Use o botão "Gerar Automático" para criar um repertório ou adicione músicas manualmente.
                      </p>
                      <Button onClick={handleGenerateRepertoire} disabled={generatingRepertoire}>
                        {generatingRepertoire ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            Gerar Repertório
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                repertoire.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold">
                            {item.position}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-semibold truncate">
                              {item.music.title}
                            </h3>
                            {item.music.artist && (
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {item.music.artist}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.music.isNewOfWeek && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              ⭐ Nova da Semana
                            </span>
                          )}
                          {item.isManual && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Manual
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSwapModal({ open: true, item })}
                            className="h-8 px-3"
                          >
                            Trocar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log("🔍 Teste - Item clicado:", item);
                              console.log("🔍 Teste - Estado atual:", { swapModal, swapMusicId });
                            }}
                            className="h-8 px-3"
                          >
                            Debug
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMusic(item.music)}
                            className="h-8 px-3"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Músicas Section - AGORA SEGUNDO */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center space-x-2">
                <Music className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Músicas ({musics.length})</span>
              </h2>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Música
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full h-full sm:w-auto sm:h-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Plus className="w-5 h-5" />
                      <span>Adicionar Nova Música</span>
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                          placeholder="Digite o título da música"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="artist">Artista</Label>
                        <Input
                          id="artist"
                          value={formData.artist}
                          onChange={(e) =>
                            setFormData({ ...formData, artist: e.target.value })
                          }
                          placeholder="Digite o nome do artista"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lyrics">Letra *</Label>
                      <Textarea
                        id="lyrics"
                        value={formData.lyrics}
                        onChange={(e) =>
                          setFormData({ ...formData, lyrics: e.target.value })
                        }
                        required
                        rows={6}
                        placeholder="Digite a letra da música..."
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chords">Cifra</Label>
                      <Textarea
                        id="chords"
                        value={formData.chords}
                        onChange={(e) =>
                          setFormData({ ...formData, chords: e.target.value })
                        }
                        rows={4}
                        placeholder="Digite a cifra da música..."
                        className="resize-none font-mono text-sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isNewOfWeek"
                        checked={formData.isNewOfWeek}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            isNewOfWeek: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="isNewOfWeek"
                        className="flex items-center space-x-1"
                      >
                        <Star className="w-4 h-4" />
                        <span>Música nova da semana</span>
                      </Label>
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {errorMessage}
                      </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4 sticky bottom-0 bg-background pb-2 sm:pb-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={formLoading}
                        className="w-full sm:w-auto"
                      >
                        {formLoading ? "Adicionando..." : "Adicionar Música"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3  sm:gap-4">
              {musics.map((music) => (
                <Card
                  key={music.id}
                  className="group hover:shadow-lg transition-all"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {music.title}
                        </h3>
                        {music.artist && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {music.artist}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {music.isNewOfWeek && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            <Star className="w-3 h-3 mr-1" />
                            Nova
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMusic(music)}
                          className="h-8 px-3"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Ver</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMusic(music)}
                          className="h-8 px-3"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMusic(music.id)}
                          className="h-8 px-3 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {music.lyrics.split("\n").slice(0, 2).join("\n")}
                        {music.lyrics.split("\n").length > 2 && "..."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          
        </div>
      </div>

      {/* Music Viewer Dialog */}
      <MusicViewer
        music={selectedMusic}
        open={!!selectedMusic}
        onOpenChange={(open) => !open && setSelectedMusic(null)}
      />

      {/* Modal de Edição de Música */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="w-full h-full sm:w-auto sm:h-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5" />
              <span>Editar Música</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  required
                  placeholder="Digite o título da música"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-artist">Artista</Label>
                <Input
                  id="edit-artist"
                  value={editFormData.artist}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, artist: e.target.value })
                  }
                  placeholder="Digite o nome do artista"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lyrics">Letra *</Label>
              <Textarea
                id="edit-lyrics"
                value={editFormData.lyrics}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, lyrics: e.target.value })
                }
                required
                rows={6}
                placeholder="Digite a letra da música..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-chords">Cifra</Label>
              <Textarea
                id="edit-chords"
                value={editFormData.chords}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, chords: e.target.value })
                }
                rows={4}
                placeholder="Digite a cifra da música..."
                className="resize-none font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isNewOfWeek"
                checked={editFormData.isNewOfWeek}
                onCheckedChange={(checked) =>
                  setEditFormData({
                    ...editFormData,
                    isNewOfWeek: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor="edit-isNewOfWeek"
                className="flex items-center space-x-1"
              >
                <Star className="w-4 h-4" />
                <span>Música nova da semana</span>
              </Label>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4 sticky bottom-0 bg-background pb-2 sm:pb-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditForm(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="w-full sm:w-auto"
              >
                {formLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                {musics
                  .filter((m) => m.id !== swapModal.item?.music.id)
                  .map((music) => (
                    <option key={music.id} value={music.id}>
                      {music.title}
                      {music.artist && ` - ${music.artist}`}
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
