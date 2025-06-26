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
} from "lucide-react";
import { MusicViewer } from "@/components/music-viewer";

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
  const [showRepertoireForm, setShowRepertoireForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

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
      }
    } catch (error) {
      console.error("Erro ao adicionar música:", error);
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
      }
    } catch (error) {
      console.error("Erro ao adicionar ao repertório:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMusic = async (musicId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta música?")) return;

    try {
      const response = await fetch(`/api/musics/${musicId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao excluir música:", error);
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={formLoading}>
                        {formLoading ? "Adicionando..." : "Adicionar Música"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3 sm:gap-4">
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
                <DialogContent className="max-w-md">
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

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRepertoireForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={formLoading}>
                        {formLoading ? "Adicionando..." : "Adicionar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3 sm:gap-4">
              {repertoire.map((item) => (
                <Card
                  key={item.id}
                  className="group hover:shadow-lg transition-all"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                          {item.position}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
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
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            <Star className="w-3 h-3 mr-1" />
                            Nova
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
    </div>
  );
}
