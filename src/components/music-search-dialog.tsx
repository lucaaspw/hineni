"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Check, X } from "lucide-react";

interface MusicSearchResult {
  title: string;
  artist: string;
  lyrics: string;
  source: string;
}

interface MusicSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: MusicSearchResult) => void;
}

export function MusicSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: MusicSearchDialogProps) {
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MusicSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!artist.trim() || !title.trim()) {
      setError("Por favor, preencha o artista e o título");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/musics/search?artist=${encodeURIComponent(
          artist.trim()
        )}&title=${encodeURIComponent(title.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erro ao buscar música");
        return;
      }

      if (data.found && data.data) {
        setResult(data.data);
      } else {
        setError("Música não encontrada. Tente com outros termos de busca.");
      }
    } catch (err) {
      setError("Erro ao conectar com a API. Tente novamente.");
      console.error("Erro ao buscar música:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (result) {
      onSelect(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setArtist("");
    setTitle("");
    setResult(null);
    setError(null);
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Buscar Música na API</span>
          </DialogTitle>
          <DialogDescription>
            Busque letras de músicas em APIs externas para facilitar a adição de
            novas músicas à biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-artist">Artista *</Label>
              <Input
                id="search-artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: Hillsong, Ministério Zoe"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-title">Título *</Label>
              <Input
                id="search-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: O que direi, Tua graça me basta"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading || !artist.trim() || !title.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center space-x-2">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{result.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {result.artist}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fonte: {result.source}
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              </div>

              <div className="max-h-48 overflow-y-auto p-3 bg-background rounded border text-sm whitespace-pre-wrap">
                {result.lyrics.substring(0, 300)}
                {result.lyrics.length > 300 && "..."}
              </div>

              <Button onClick={handleSelect} className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Usar esta música
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
