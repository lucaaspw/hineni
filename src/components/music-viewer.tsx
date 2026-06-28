"use client";

import React, { useState, useEffect, memo, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Music, FileText, Guitar, X } from "lucide-react";
import { disableBodyScroll, enableBodyScroll, truncateTitle } from "@/lib/utils";
import { detectOriginalKey, transposeChords } from "@/lib/chord-transposer";
import { AVAILABLE_KEYS, calculateSemitones } from "@/lib/chord-processor";

interface Music {
  id: string;
  title: string;
  artist?: string;
  lyrics: string;
  chords?: string;
  externalLink?: string;
  isNewOfWeek?: boolean;
  tags?: string[];
}

interface MusicViewerProps {
  music: Music | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MusicViewer = memo(
  ({ music, open, onOpenChange }: MusicViewerProps) => {
    const [activeTab, setActiveTab] = useState("lyrics");
    const [selectedKey, setSelectedKey] = useState<string>("");
    const [detectedKey, setDetectedKey] = useState<string | null>(null);

    useEffect(() => {
      let scrollY: number | undefined;

      if (open) {
        scrollY = disableBodyScroll();
      } else {
        enableBodyScroll(scrollY);
      }

      return () => {
        if (open) {
          enableBodyScroll(scrollY);
        }
      };
    }, [open]);

    // Detectar tom original quando a música mudar
    useEffect(() => {
      if (music?.chords) {
        const detected = detectOriginalKey(music.chords);
        setDetectedKey(detected);
        setSelectedKey(detected || "");
      } else {
        setDetectedKey(null);
        setSelectedKey("");
      }
    }, [music?.chords]);

    // Processar acordes com cores e transposição
    const coloredChords = useMemo(() => {
      if (!music?.chords) return null;
      
      // Se houver um tom selecionado e for diferente do detectado, transpor
      let chordsToProcess = music.chords;
      if (selectedKey && detectedKey && selectedKey !== detectedKey && selectedKey !== "") {
        const semitones = calculateSemitones(detectedKey, selectedKey);
        if (semitones !== 0) {
          chordsToProcess = transposeChords(music.chords, semitones);
        }
      }
      
      return processChordsWithColors(chordsToProcess);
    }, [music?.chords, selectedKey, detectedKey]);

    if (!music) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full sm:w-auto sm:h-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl sm:max-h-[calc(100vh-2rem)] p-0 overflow-hidden" showCloseButton={false}>
          <DialogHeader className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-2 sm:pb-3 md:pb-4 flex-shrink-0 relative">
            {/* Botão de fechar que cobre todo o header */}
            <DialogClose className="absolute inset-0 z-10 flex items-center justify-end p-3 sm:p-4 md:p-6 bg-transparent hover:bg-muted/20 transition-colors rounded-t-lg">
              <div className="bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg border">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </div>
            </DialogClose>
            
            <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-foreground flex items-center space-x-2 pr-6 sm:pr-8">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
              <span className="truncate">{truncateTitle(music.title)}</span>
            </DialogTitle>
            {music.artist && (
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
                {music.artist}
              </p>
            )}
            
          </DialogHeader>

          <div
            className="px-3 sm:py-3 sm:px-4 md:px-6 pb-6 sm:pb-4 md:pb-6 overflow-y-auto flex-1"
            style={{
              maxHeight: "calc(100vh - 120px)",
              height: "calc(100vh - 120px)",
            }}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-3 sm:space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="lyrics"
                  className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm md:text-base"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Letra</span>
                </TabsTrigger>
                <TabsTrigger
                  value="chords"
                  className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm md:text-base"
                  disabled={!music.chords}
                >
                  <Guitar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Cifra</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lyrics" className="space-y-0">
                <div className="bg-muted/30 rounded-lg py-5 px-2 sm:p-3 md:p-4 lg:p-6">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm md:text-base leading-relaxed font-sans text-foreground">
                    {music.lyrics}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="chords" className="space-y-0">
              {music.chords && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                {detectedKey && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Tom original: <span className="font-semibold text-foreground">{detectedKey}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:min-w-[200px]">
                  <Label htmlFor="key-select-viewer" className="text-xs sm:text-sm whitespace-nowrap">
                    Transpor para:
                  </Label>
                  <Select
                    id="key-select-viewer"
                    value={selectedKey || detectedKey || ""}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      // Se selecionar o tom original, resetar para o detectado
                      if (newKey === detectedKey || newKey === "") {
                        setSelectedKey(detectedKey || "");
                      } else {
                        setSelectedKey(newKey);
                      }
                    }}
                    className="flex-1"
                  >
                    <option value={detectedKey || ""}>
                      {detectedKey || "Tom original"}
                    </option>
                    {AVAILABLE_KEYS.filter(key => key !== detectedKey).map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
                {music.chords ? (
                  <div className="bg-muted/30 rounded-lg py-5 px-2 sm:p-3 md:p-4 lg:p-6">
                    <pre className="whitespace-pre-wrap text-xs sm:text-sm md:text-base leading-relaxed font-mono text-foreground">
                      {coloredChords}
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 sm:h-32 text-center">
                    <div className="space-y-2 sm:space-y-4">
                      <Guitar className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">
                          Cifra não disponível
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Esta música ainda não possui cifra cadastrada.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

MusicViewer.displayName = "MusicViewer";

// Cor laranja para todos os acordes
const CHORD_COLOR = "#f97316"; // Laranja

// Mapeamento de notas válidas (para validação)
const VALID_NOTES = new Set([
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
]);

/**
 * Processa o texto da cifra e identifica acordes para aplicar cor laranja
 */
function processChordsWithColors(chordsText: string): React.ReactNode[] {
  if (!chordsText) return [];

  // Padrão regex para detectar acordes (similar ao chord-transposer.ts)
  const chordPattern =
    /\b([A-G](?:#|b)?)((?:m(?:aj|in|7|9|11|13|6|add\d+)?|dim|aug|sus[24]?|maj[79]?|add\d+|6\/9|7(?:sus[24]|b5|#5|b9|#9|#11|b13)?|9(?:sus4|b5|#5)?|11(?:b9)?|13(?:sus4|b9)?|6|°|ø|\+)?)(?:\/([A-G](?:#|b)?))?(?=\s|$|\n|[^\w#b\/])/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  const matches: Array<{ index: number; fullMatch: string }> = [];

  // Identificar todos os acordes
  while ((match = chordPattern.exec(chordsText)) !== null) {
    const fullMatch = match[0];
    const rootNote = match[1];
    const quality = match[2] || "";
    const bassNote = match[3] || "";
    const matchIndex = match.index;

    // Verificar contexto antes e depois do match para evitar falsos positivos
    const charBefore = matchIndex > 0 ? chordsText[matchIndex - 1] : "";
    const charAfter = matchIndex + fullMatch.length < chordsText.length 
      ? chordsText[matchIndex + fullMatch.length] 
      : "";

    // Validar que a nota raiz é válida
    const isValidRootNote = VALID_NOTES.has(rootNote);
    
    // Validar que é um acorde válido:
    // 1. Deve ter modificadores de acorde (m, 7, etc) OU
    // 2. Deve ter nota de baixo (ex: C/E) OU
    // 3. Deve ser uma nota simples (C, D, F#) mas NÃO no meio de uma palavra
    const hasQuality = quality.length > 0;
    const hasBass = bassNote.length > 0 && VALID_NOTES.has(bassNote);
    const isSimpleNote = /^[A-G](?:#|b)?$/.test(fullMatch);
    
    // Verificar se não está no meio de uma palavra (evita "Amor", "Dia", etc)
    const isWordBoundary = 
      charBefore === "" || 
      /[\s\n\r\[\](){}|,.;:!?\-]/.test(charBefore) ||
      !/[a-z]/.test(charBefore); // Não é letra minúscula antes
    
    // Verificar se o próximo caractere não é letra minúscula (evita "Amor", "Dia")
    const isNotInWord = 
      charAfter === "" || 
      /[\s\n\r\[\](){}|,.;:!?\-]/.test(charAfter) ||
      !/[a-z]/.test(charAfter); // Não é letra minúscula depois

    // Validar que é um acorde válido
    // Para notas simples sem modificadores, ser mais conservador
    const isValidChord = 
      isValidRootNote &&
      (hasQuality || hasBass || (isSimpleNote && isWordBoundary && isNotInWord));

    if (isValidChord) {
      matches.push({
        index: matchIndex,
        fullMatch: fullMatch,
      });
    }
  }

  // Se não houver matches, retornar texto original
  if (matches.length === 0) {
    return [chordsText];
  }

  // Ordenar matches por índice para processar na ordem correta
  matches.sort((a, b) => a.index - b.index);

  // Processar o texto e aplicar cor laranja
  matches.forEach((matchInfo, matchIndex) => {
    // Adicionar texto antes do acorde
    if (matchInfo.index > lastIndex) {
      const textBefore = chordsText.substring(lastIndex, matchInfo.index);
      if (textBefore) {
        parts.push(textBefore);
      }
    }

    // Adicionar acorde colorido de laranja
    parts.push(
      <span
        key={`chord-${matchIndex}`}
        style={{
          color: CHORD_COLOR,
          fontWeight: 600,
        }}
      >
        {matchInfo.fullMatch}
      </span>
    );

    lastIndex = matchInfo.index + matchInfo.fullMatch.length;
  });

  // Adicionar texto restante
  if (lastIndex < chordsText.length) {
    parts.push(chordsText.substring(lastIndex));
  }

  return parts;
}
