"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Upload, FileText, Music, X } from "lucide-react";
import { processChordFile, AVAILABLE_KEYS } from "@/lib/chord-processor";
import { toast } from "sonner";

interface ChordUploadProps {
  onChordsChange: (chords: string) => void;
  onLyricsChange: (lyrics: string) => void;
  currentChords?: string;
  currentLyrics?: string;
}

export function ChordUpload({
  onChordsChange,
  onLyricsChange,
  currentChords = "",
  currentLyrics = "",
}: ChordUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [uploadedText, setUploadedText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é arquivo de texto
    if (!file.type.includes("text") && !file.name.endsWith(".txt")) {
      toast.error("Por favor, selecione um arquivo de texto (.txt)");
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      setUploadedText(text);

      // Processar cifra
      const result = processChordFile(text);
      setDetectedKey(result.detectedKey);

      // Se o usuário já selecionou um tom antes do upload, usar esse tom
      // Caso contrário, usar o tom detectado ou o original
      const targetKey = selectedKey || result.detectedKey;

      if (targetKey) {
        if (!selectedKey) {
          setSelectedKey(result.detectedKey || "");
        }
        // Aplicar processamento com o tom selecionado ou detectado
        applyProcessing(text, targetKey);
      } else {
        // Se não detectou tom e não há tom selecionado, usar o texto como está
        onChordsChange(text);
        onLyricsChange(result.lyrics);
        toast.warning("Não foi possível detectar o tom da música automaticamente");
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar o arquivo. Tente novamente.");
    } finally {
      setIsProcessing(false);
      // Limpar input para permitir upload do mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const applyProcessing = (text: string, targetKey: string) => {
    const result = processChordFile(text, targetKey);
    onChordsChange(result.chords);
    onLyricsChange(result.lyrics);
    
    if (result.transposed) {
      toast.success(
        `Cifra transposta de ${result.detectedKey} para ${targetKey}`
      );
    } else {
      toast.success("Cifra processada com sucesso!");
    }
  };

  const handleKeyChange = (newKey: string) => {
    if (!newKey) {
      setSelectedKey("");
      return;
    }

    if (!uploadedText) {
      // Se não há texto carregado, processar o texto atual dos campos
      if (currentChords) {
        const result = processChordFile(currentChords, newKey);
        onChordsChange(result.chords);
        if (result.transposed && result.detectedKey) {
          toast.success(
            `Cifra transposta de ${result.detectedKey} para ${newKey}`
          );
        } else if (!result.detectedKey) {
          toast.warning(
            "Não foi possível detectar o tom original. A transposição pode não estar correta."
          );
        }
      }
      setSelectedKey(newKey);
      return;
    }

    setSelectedKey(newKey);
    applyProcessing(uploadedText, newKey);
  };

  const handleClear = () => {
    setUploadedText("");
    setDetectedKey(null);
    setSelectedKey("");
    // Não limpar os campos de cifra e letra, apenas o estado interno do componente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Music className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">Upload de Cifra</Label>
        </div>
        {(uploadedText || currentChords) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="chord-file" className="text-sm">
            Selecione um arquivo de cifra (.txt)
          </Label>
          <div className="mt-2">
            <input
              ref={fileInputRef}
              id="chord-file"
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isProcessing ? "Processando..." : "Carregar Arquivo"}
            </Button>
          </div>
        </div>

        {detectedKey && (
          <div className="text-sm text-muted-foreground">
            <FileText className="w-4 h-4 inline mr-1" />
            Tom detectado: <span className="font-semibold">{detectedKey}</span>
          </div>
        )}

        <div>
          <Label htmlFor="key-select" className="text-sm">
            {uploadedText || currentChords
              ? "Transpor para o tom:"
              : "Selecione o tom (será aplicado ao fazer upload):"}
          </Label>
          <Select
            id="key-select"
            value={selectedKey || detectedKey || ""}
            onChange={(e) => handleKeyChange(e.target.value)}
            className="mt-1"
          >
            <option value="">Selecione o tom</option>
            {AVAILABLE_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {uploadedText || currentChords
              ? "Selecione o tom desejado para transpor os acordes automaticamente"
              : "O tom selecionado será aplicado quando você fizer upload de uma cifra ou transpor a cifra existente"}
          </p>
        </div>
      </div>
    </div>
  );
}
