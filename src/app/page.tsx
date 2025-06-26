"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Calendar, Star, Eye } from "lucide-react";
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

export default function Home() {
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);

  useEffect(() => {
    fetchRepertoire();
  }, []);

  const fetchRepertoire = async () => {
    try {
      const response = await fetch("/api/repertoire");
      if (response.ok) {
        const data = await response.json();
        setRepertoire(data);
      }
    } catch (error) {
      console.error("Erro ao carregar repertório:", error);
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground">Carregando repertório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-24">
          <div className="text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 sm:mb-6">
              <Music className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight px-2">
              Repertório da{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Semana
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Músicas selecionadas com carinho para esta semana de louvor
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Atualizado semanalmente</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>6 músicas selecionadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Repertoire Section */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid gap-4 sm:gap-6 lg:gap-8">
          {repertoire.length > 0
            ? repertoire.map((item) => (
                <Card
                  key={item.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm"
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-base sm:text-lg space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                          {item.position}
                        </div>
                        <span className="font-medium">
                          Música {item.position}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.music.isNewOfWeek && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            <Star className="w-3 h-3 mr-1" />
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
                          className="flex-shrink-0 h-8 px-3"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Ver</span>
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.music.title}
                      </h3>
                      {item.music.artist && (
                        <p className="text-muted-foreground font-medium text-sm sm:text-base">
                          {item.music.artist}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            : // Placeholder para as 6 músicas do repertório quando vazio
              Array.from({ length: 6 }, (_, i) => (
                <Card
                  key={i}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm opacity-60"
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-base sm:text-lg space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted text-muted-foreground font-semibold text-xs sm:text-sm">
                          {i + 1}
                        </div>
                        <span className="font-medium">Música {i + 1}</span>
                      </div>
                      {i === 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          <Star className="w-3 h-3 mr-1" />
                          Nova da Semana
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground">
                        Título da música será carregado aqui
                      </h3>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        Artista
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
