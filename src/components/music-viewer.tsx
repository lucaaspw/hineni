"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, FileText, Guitar } from "lucide-react";

interface Music {
  id: string;
  title: string;
  artist?: string;
  lyrics: string;
  chords?: string;
  isNewOfWeek: boolean;
}

interface MusicViewerProps {
  music: Music | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MusicViewer({ music, open, onOpenChange }: MusicViewerProps) {
  const [activeTab, setActiveTab] = useState("lyrics");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!music) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center space-x-2 pr-8">
            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="truncate">{music.title}</span>
          </DialogTitle>
          {music.artist && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {music.artist}
            </p>
          )}
        </DialogHeader>

        <div
          className="px-4 sm:px-6 pb-4 sm:pb-6 overflow-y-auto"
          style={{ maxHeight: "calc(95vh - 120px)" }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="lyrics"
                className="flex items-center space-x-2 text-sm sm:text-base"
              >
                <FileText className="w-4 h-4" />
                <span>Letra</span>
              </TabsTrigger>
              <TabsTrigger
                value="chords"
                className="flex items-center space-x-2 text-sm sm:text-base"
                disabled={!music.chords}
              >
                <Guitar className="w-4 h-4" />
                <span>Cifra</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lyrics" className="space-y-0">
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 lg:p-6">
                <pre className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed font-sans text-foreground">
                  {music.lyrics}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="chords" className="space-y-0">
              {music.chords ? (
                <div className="bg-muted/30 rounded-lg p-3 sm:p-4 lg:p-6">
                  <pre className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed font-mono text-foreground">
                    {music.chords}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-center">
                  <div className="space-y-4">
                    <Guitar className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Cifra não disponível
                      </h3>
                      <p className="text-muted-foreground">
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
