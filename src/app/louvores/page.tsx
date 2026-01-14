"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
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
} from "@/components/ui/dialog";
import { Music, Search, Eye, Star, ExternalLink, Edit } from "lucide-react";
import { MusicViewer } from "@/components/music-viewer";
import { toast } from "sonner";

interface Music {
  id: string;
  title: string;
  artist?: string;
  lyrics: string;
  chords?: string;
  externalLink?: string;
  isNewOfWeek: boolean;
}

// Cache para evitar re-fetch desnecessário (aumentado para 10 minutos)
let musicsCache: Music[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Componente de loading otimizado
const LoadingSpinner = memo(() => (
  <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Carregando músicas...</p>
    </div>
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";

// Componente de card de música otimizado
const MusicCard = memo(
  ({
    music,
    onViewMusic,
    onEditMusic,
    isAuthenticated,
  }: {
    music: Music;
    onViewMusic: (music: Music) => void;
    onEditMusic?: (music: Music) => void;
    isAuthenticated?: boolean;
  }) => {
    const handleViewClick = useCallback(() => {
      onViewMusic(music);
    }, [music, onViewMusic]);

    const handleEditClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEditMusic) {
          onEditMusic(music);
        }
      },
      [music, onEditMusic]
    );

    const truncatedLyrics = useMemo(() => {
      const lines = music.lyrics.split("\n");
      return lines.length > 3
        ? lines.slice(0, 3).join("\n") + "..."
        : music.lyrics;
    }, [music.lyrics]);

    return (
      <Card
        className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 backdrop-blur-sm ${
          music.isNewOfWeek
            ? "new-week-music-card"
            : "bg-gradient-to-r from-card to-card/50"
        }`}
      >
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-start justify-between space-y-2 sm:space-y-0 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <h3
                className={`text-base sm:text-lg font-semibold transition-colors truncate ${
                  music.isNewOfWeek
                    ? "new-week-music-title group-hover:text-green-600 dark:group-hover:text-green-300"
                    : "text-foreground group-hover:text-primary"
                }`}
              >
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
                <span className="inline-flex items-center h-6 w-6 justify-center rounded-full text-sm font-semibold new-week-music-badge">
                  <Star className="w-4 h-4" />
                </span>
              )}
              {music.externalLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      music.externalLink,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="h-8 px-3"
                  title={
                    music.externalLink.includes("spotify")
                      ? "Abrir no Spotify"
                      : "Abrir no YouTube"
                  }
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
              {isAuthenticated && onEditMusic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="h-8 px-3"
                  title="Editar música"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewClick}
                className="h-8 px-3"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Ver</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {truncatedLyrics}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
);

MusicCard.displayName = "MusicCard";

// Componente de busca otimizado
const SearchInput = memo(
  ({
    searchTerm,
    onSearchChange,
  }: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
  }) => (
    <div className="max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar por título ou artista..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>
    </div>
  )
);

SearchInput.displayName = "SearchInput";

export default function LouvoresPage() {
  const [musics, setMusics] = useState<Music[]>([]);
  const [filteredMusics, setFilteredMusics] = useState<Music[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    title: "",
    artist: "",
    lyrics: "",
    chords: "",
    externalLink: "",
    isNewOfWeek: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Memoização da função de busca
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Memoização da função de visualização
  const handleViewMusic = useCallback((music: Music) => {
    setSelectedMusic(music);
  }, []);

  // Verificar autenticação
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify");
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // Função para abrir modal de edição
  const handleEditMusic = useCallback((music: Music) => {
    setEditFormData({
      id: music.id,
      title: music.title,
      artist: music.artist || "",
      lyrics: music.lyrics,
      chords: music.chords || "",
      externalLink: music.externalLink || "",
      isNewOfWeek: music.isNewOfWeek,
    });
    setShowEditForm(true);
    setErrorMessage("");
  }, []);

  // Função para atualizar música
  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
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

          // Atualizar cache local
          musicsCache = null; // Invalidar cache
          cacheTimestamp = 0;

          // Atualizar estado local
          setMusics((prev) =>
            prev.map((music) =>
              music.id === updatedMusic.id ? updatedMusic : music
            )
          );
          setFilteredMusics((prev) =>
            prev.map((music) =>
              music.id === updatedMusic.id ? updatedMusic : music
            )
          );

          setEditFormData({
            id: "",
            title: "",
            artist: "",
            lyrics: "",
            chords: "",
            externalLink: "",
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
    },
    [editFormData]
  );

  // Memoização da função de fetch com cache otimizado
  const fetchMusics = useCallback(async () => {
    const now = Date.now();

    // Verificar cache primeiro
    if (musicsCache && now - cacheTimestamp < CACHE_DURATION) {
      const sortedMusics = [...musicsCache].sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
      );
      setMusics(sortedMusics);
      setFilteredMusics(sortedMusics);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/musics", {
        headers: {
          "Cache-Control": "max-age=600",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Ordenar alfabeticamente por título
        const sortedData = [...data].sort((a, b) =>
          a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
        );
        // Atualizar cache
        musicsCache = sortedData;
        cacheTimestamp = now;
        setMusics(sortedData);
        setFilteredMusics(sortedData);
      }
    } catch (error) {
      console.error("Erro ao carregar músicas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchMusics();
  }, [checkAuth, fetchMusics]);

  // Memoização do filtro de músicas otimizada
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Manter ordenação alfabética mesmo sem busca
      const sorted = [...musics].sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
      );
      setFilteredMusics(sorted);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = musics.filter(
      (music) =>
        music.title.toLowerCase().includes(searchLower) ||
        (music.artist && music.artist.toLowerCase().includes(searchLower))
    );
    // Ordenar resultados filtrados alfabeticamente
    const sortedFiltered = [...filtered].sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
    );
    setFilteredMusics(sortedFiltered);
  }, [searchTerm, musics]);

  // Memoização do grid de músicas
  const musicGrid = useMemo(() => {
    return filteredMusics.map((music) => (
      <MusicCard
        key={music.id}
        music={music}
        onViewMusic={handleViewMusic}
        onEditMusic={isAuthenticated ? handleEditMusic : undefined}
        isAuthenticated={isAuthenticated}
      />
    ));
  }, [filteredMusics, handleViewMusic, handleEditMusic, isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mb-2 sm:mb-3">
              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight px-2">
              Biblioteca de Louvores
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Explore nossa coleção completa de músicas para adoração
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <SearchInput
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Musics Grid */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {filteredMusics.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {musicGrid}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              Nenhuma música encontrada
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm
                ? "Tente ajustar os termos de busca ou verifique a ortografia."
                : "Nenhuma música disponível no momento."}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="mt-4"
              >
                Limpar busca
              </Button>
            )}
          </div>
        )}
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

            <div className="space-y-2">
              <Label htmlFor="edit-externalLink">
                Link do YouTube ou Spotify
              </Label>
              <Input
                id="edit-externalLink"
                type="url"
                value={editFormData.externalLink}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    externalLink: e.target.value,
                  })
                }
                placeholder="https://youtube.com/... ou https://open.spotify.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Cole o link completo do YouTube ou Spotify
              </p>
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditForm(false);
                  setErrorMessage("");
                }}
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
