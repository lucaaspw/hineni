"use client";

import { useState, useEffect, useCallback } from "react";
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

  const fetchData = async () => {
    try {
      const [musicsResponse, repertoireResponse] = await Promise.all([
        fetch("/api/musics"),
        fetch("/api/repertoire"),
      ]);

      if (musicsResponse.ok) {
        const musicsData = await musicsResponse.json();
        setMusics(musicsData);
      }

      if (repertoireResponse.ok) {
        const repertoireData = await repertoireResponse.json();
        setRepertoire(repertoireData);
      }
    } catch {
      console.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      console.error("Erro ao fazer logout");
    }
  };

  const checkDuplicateMusic = (
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMessage("");

    // Verificar duplicata no frontend primeiro
    const duplicate = checkDuplicateMusic(formData.title, formData.artist);
    if (duplicate) {
      setErrorMessage(
        `Música duplicada: "${duplicate.title}" por ${
          duplicate.artist || "Artista não informado"
        }`
      );
      toast.error(
        `Música duplicada: "${duplicate.title}" por ${
          duplicate.artist || "Artista não informado"
        }`
      );
      setFormLoading(false);
      return;
    }

    // Verificar se já existe música nova da semana
    if (formData.isNewOfWeek) {
      const existingNewOfWeek = musics.find((music) => music.isNewOfWeek);
      if (existingNewOfWeek) {
        setErrorMessage(
          `Já existe uma música nova da semana: "${existingNewOfWeek.title}"`
        );
        toast.error(
          `Já existe uma música nova da semana: "${existingNewOfWeek.title}"`
        );
        setFormLoading(false);
        return;
      }
    }

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
        fetchData();
        toast.success("Música adicionada com sucesso!");
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          setErrorMessage(
            `Música duplicada: "${errorData.existingMusic.title}" por ${
              errorData.existingMusic.artist || "Artista não informado"
            }`
          );
          toast.error(
            `Música duplicada: "${errorData.existingMusic.title}" por ${
              errorData.existingMusic.artist || "Artista não informado"
            }`
          );
        } else {
          setErrorMessage(errorData.message || "Erro ao adicionar música");
          toast.error(errorData.message || "Erro ao adicionar música");
        }
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
        fetchData();
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
        fetchData();
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

    // Verificar duplicata no frontend primeiro
    const duplicate = checkDuplicateMusic(
      editFormData.title,
      editFormData.artist,
      editFormData.id
    );
    if (duplicate) {
      setErrorMessage(
        `Música duplicada: "${duplicate.title}" por ${
          duplicate.artist || "Artista não informado"
        }`
      );
      toast.error(
        `Música duplicada: "${duplicate.title}" por ${
          duplicate.artist || "Artista não informado"
        }`
      );
      setFormLoading(false);
      return;
    }

    // Verificar se já existe música nova da semana
    if (editFormData.isNewOfWeek) {
      const existingNewOfWeek = musics.find(
        (music) => music.isNewOfWeek && music.id !== editFormData.id
      );
      if (existingNewOfWeek) {
        setErrorMessage(
          `Já existe uma música nova da semana: "${existingNewOfWeek.title}"`
        );
        toast.error(
          `Já existe uma música nova da semana: "${existingNewOfWeek.title}"`
        );
        setFormLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/musics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setEditFormData({
          id: "",
          title: "",
          artist: "",
          lyrics: "",
          chords: "",
          isNewOfWeek: false,
        });
        setShowEditForm(false);
        fetchData();
        toast.success("Música editada com sucesso!");
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          setErrorMessage(
            `Música duplicada: "${errorData.existingMusic.title}" por ${
              errorData.existingMusic.artist || "Artista não informado"
            }`
          );
          toast.error(
            `Música duplicada: "${errorData.existingMusic.title}" por ${
              errorData.existingMusic.artist || "Artista não informado"
            }`
          );
        } else {
          setErrorMessage(errorData.message || "Erro ao editar música");
          toast.error(errorData.message || "Erro ao editar música");
        }
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
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
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
          {/* Músicas Section */}
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
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
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

          {/* Repertório Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center space-x-2">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Repertório Semanal ({repertoire.length})</span>
              </h2>
              <Dialog
                open={showRepertoireForm}
                onOpenChange={setShowRepertoireForm}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar ao Repertório
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
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Selecione uma música</option>
                        {musics.map((music) => (
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
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 A música nova da semana aparecerá automaticamente em
                        primeiro lugar
                      </p>
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

                    <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4 sticky bottom-0 bg-background pb-2 sm:pb-0">
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
                        {formLoading ? "Adicionando..." : "Adicionar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Indicador de ordenação */}
            {repertoire.length > 0 && (
              <div className="p-3 rounded-lg new-week-music-indicator">
                <div className="flex items-center space-x-2 text-sm">
                  <Star className="w-4 h-4" />
                  <span>
                    <strong>Música nova da semana</strong> aparece
                    automaticamente em primeiro lugar no repertório
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:gap-4">
              {repertoire.map((item) => (
                <Card
                  key={item.id}
                  className={`group hover:shadow-lg transition-all ${
                    item.music.isNewOfWeek
                      ? "new-week-music-card"
                      : "hover:shadow-lg"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full font-semibold text-xs sm:text-sm ${
                            item.music.isNewOfWeek
                              ? "new-week-music-icon"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.music.isNewOfWeek ? (
                            <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            item.position
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-base sm:text-lg font-semibold transition-colors truncate ${
                              item.music.isNewOfWeek
                                ? "new-week-music-title group-hover:text-green-600 dark:group-hover:text-green-300"
                                : "text-foreground group-hover:text-primary"
                            }`}
                          >
                            {item.music.title}
                          </h3>
                          {item.music.artist && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {item.music.artist}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {item.music.isNewOfWeek && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold new-week-music-badge">
                            <Star className="w-4 h-4 mr-1.5" />
                            Nova da Semana
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
    </div>
  );
}
