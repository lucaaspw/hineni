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
import { disableBodyScroll, enableBodyScroll } from "@/lib/utils";

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

  if (!music) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full sm:w-auto sm:h-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl sm:max-h-[calc(100vh-4rem)] p-0 overflow-hidden animate-optimized">
        <DialogHeader className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-2 sm:pb-3 md:pb-4 flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-foreground flex items-center space-x-2 pr-6 sm:pr-8 font-optimized">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
            <span className="truncate">{music.title}</span>
          </DialogTitle>
          {music.artist && (
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 font-optimized">
              {music.artist}
            </p>
          )}
        </DialogHeader>

        <div
          className="px-3 sm:py-3 sm:px-4 md:px-6 pb-6 sm:pb-4 md:pb-6 overflow-y-auto flex-1 scroll-optimized"
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
            <TabsList className="grid w-full grid-cols-2 animate-optimized">
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
              <div className="bg-muted/30 rounded-lg py-5 px-2 sm:p-3 md:p-4 lg:p-6 render-optimized">
                <pre className="whitespace-pre-wrap text-xs sm:text-sm md:text-base leading-relaxed font-sans text-foreground font-optimized">
                  {music.lyrics}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="chords" className="space-y-0">
              {music.chords ? (
                <div className="bg-muted/30 rounded-lg py-5 px-2 sm:p-3 md:p-4 lg:p-6 render-optimized">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm md:text-base leading-relaxed font-mono text-foreground font-optimized">
                    {music.chords}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 sm:h-32 text-center">
                  <div className="space-y-2 sm:space-y-4">
                    <Guitar className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 font-optimized">
                        Cifra não disponível
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-optimized">
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
