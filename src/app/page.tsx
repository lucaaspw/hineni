"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Calendar, Star, Eye, ExternalLink } from "lucide-react";
import { MusicViewer } from "@/components/music-viewer";

interface Music {
  id: string;
  title: string;
  artist?: string;
  lyrics: string;
  chords?: string;
  externalLink?: string;
  isNewOfWeek: boolean;
}

interface RepertoireItem {
  id: string;
  position: number;
  isManual: boolean;
  music: Music;
}

// Componente de loading otimizado
const LoadingSpinner = memo(() => (
  <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Carregando repertório...</p>
    </div>
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";

// Componente de card de música otimizado com memo
const MusicCard = memo(
  ({
    item,
    onViewMusic,
  }: {
    item: RepertoireItem;
    onViewMusic: (music: Music) => void;
  }) => {
    const truncatedLyrics = useMemo(() => {
      const lines = item.music.lyrics.split("\n");
      return lines.length > 3
        ? lines.slice(0, 3).join("\n") + "..."
        : item.music.lyrics;
    }, [item.music.lyrics]);

    const handleViewClick = useCallback(() => {
      onViewMusic(item.music);
    }, [item.music, onViewMusic]);

    return (
      <Card
        className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 backdrop-blur-sm ${
          item.music.isNewOfWeek
            ? "new-week-music-card"
            : "bg-gradient-to-r from-card to-card/50"
        }`}
      >
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-start justify-between space-y-2 sm:space-y-0 sm:flex-row sm:items-center">
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
            <div className="flex items-center space-x-2 flex-shrink-0">
              {item.music.isNewOfWeek && (
                <span className="inline-flex items-center h-6 w-6 justify-center rounded-full text-sm font-semibold new-week-music-badge">
                  <Star className="w-4 h-4" />
                </span>
              )}
              {item.music.externalLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.music.externalLink, "_blank", "noopener,noreferrer");
                  }}
                  className="h-8 px-3"
                  title={item.music.externalLink.includes("spotify") ? "Abrir no Spotify" : "Abrir no YouTube"}
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
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

// Componente de skeleton otimizado
const SkeletonCard = memo(() => (
  <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm opacity-60">
    <CardHeader className="pb-3 sm:pb-4">
      <CardTitle className="flex items-start justify-between space-y-2 sm:space-y-0 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-muted-foreground truncate">
            Título da música será carregado aqui
          </h3>
          <p className="text-sm text-muted-foreground truncate mt-1">Artista</p>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-3">
          Letra da música será carregada aqui
        </p>
      </div>
    </CardContent>
  </Card>
));

SkeletonCard.displayName = "SkeletonCard";

// Cache para evitar re-fetch desnecessário (aumentado para 10 minutos)
let repertoireCache: RepertoireItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

export default function Home() {
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);

  // Memoização da função de fetch com cache otimizado
  const fetchRepertoire = useCallback(async () => {
    const now = Date.now();

    // Verificar cache primeiro
    if (repertoireCache && now - cacheTimestamp < CACHE_DURATION) {
      setRepertoire(repertoireCache);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/repertoire", {
        headers: {
          "Cache-Control": "max-age=600",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Atualizar cache
        repertoireCache = data;
        cacheTimestamp = now;
        setRepertoire(data);
      }
    } catch (error) {
      console.error("Erro ao carregar repertório:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepertoire();
  }, [fetchRepertoire]);

  // Memoização da função de visualização
  const handleViewMusic = useCallback((music: Music) => {
    setSelectedMusic(music);
  }, []);

  // Memoização dos skeletons
  const skeletonCards = useMemo(
    () => Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />),
    []
  );

  // Memoização do grid de músicas
  const musicGrid = useMemo(() => {
    if (repertoire.length === 0) return skeletonCards;

    return repertoire.map((item) => (
      <MusicCard key={item.id} item={item} onViewMusic={handleViewMusic} />
    ));
  }, [repertoire, handleViewMusic, skeletonCards]);

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
              Repertório da Semana
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Músicas selecionadas com carinho para esta semana de louvor
            </p>
          </div>
        </div>
      </div>

      {/* Repertoire Section */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Todas as Músicas */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2  lg:grid-cols-3 lg:gap-8">
          {musicGrid}
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
