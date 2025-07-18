"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Search, Eye, Star } from "lucide-react";
import { MusicViewer } from "@/components/music-viewer";

interface Music {
  id: string;
  title: string;
  artist?: string;
  lyrics: string;
  chords?: string;
  isNewOfWeek: boolean;
}

// Cache para evitar re-fetch desnecessário
let musicsCache: Music[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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
  }: {
    music: Music;
    onViewMusic: (music: Music) => void;
  }) => {
    const handleViewClick = useCallback(() => {
      onViewMusic(music);
    }, [music, onViewMusic]);

    const truncatedLyrics = useMemo(() => {
      const lines = music.lyrics.split("\n");
      return lines.length > 3
        ? lines.slice(0, 3).join("\n") + "..."
        : music.lyrics;
    }, [music.lyrics]);

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-start justify-between space-y-2 sm:space-y-0 sm:flex-row sm:items-center">
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

  // Memoização da função de busca
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Memoização da função de visualização
  const handleViewMusic = useCallback((music: Music) => {
    setSelectedMusic(music);
  }, []);

  // Memoização da função de fetch com cache
  const fetchMusics = useCallback(async () => {
    const now = Date.now();

    // Verificar cache primeiro
    if (musicsCache && now - cacheTimestamp < CACHE_DURATION) {
      setMusics(musicsCache);
      setFilteredMusics(musicsCache);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/musics", {
        headers: {
          "Cache-Control": "max-age=300",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Atualizar cache
        musicsCache = data;
        cacheTimestamp = now;
        setMusics(data);
        setFilteredMusics(data);
      }
    } catch (error) {
      console.error("Erro ao carregar músicas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMusics();
  }, [fetchMusics]);

  // Memoização do filtro de músicas
  useEffect(() => {
    const filtered = musics.filter(
      (music) =>
        music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (music.artist &&
          music.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredMusics(filtered);
  }, [searchTerm, musics]);

  // Memoização do grid de músicas
  const musicGrid = useMemo(() => {
    return filteredMusics.map((music) => (
      <MusicCard key={music.id} music={music} onViewMusic={handleViewMusic} />
    ));
  }, [filteredMusics, handleViewMusic]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 sm:mb-6">
              <Music className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Biblioteca de Louvores
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Explore nossa coleção completa de músicas para adoração
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <SearchInput
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Musics Grid */}
      <div className="container mx-auto px-4 pb-8 sm:pb-12">
        {filteredMusics.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
