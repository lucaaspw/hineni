"use client";

import React, { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Star } from "lucide-react";
import escalaData from "../../../data/escala-2026.json";

interface EscalaItem {
  date: string;
  people: string[];
}

// Componente de card da semana otimizado
const WeekCard = memo(
  ({
    week,
    isCurrentWeek = false,
  }: {
    week: EscalaItem;
    isCurrentWeek?: boolean;
  }) => {
    const formatDisplayDate = (dateStr: string): string => {
      // Parse a data manualmente para evitar problemas de timezone
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    if (isCurrentWeek) {
      return (
        <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 backdrop-blur-sm new-week-music-card max-w-2xl w-full">
          <CardHeader className="pb-4 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-start justify-between gap-2 sm:gap-0">
              <div className="flex-1 min-w-0 flex items-start sm:items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold transition-colors new-week-music-title group-hover:text-green-600 dark:group-hover:text-green-300 leading-tight">
                    <span className="block sm:inline">Esta Semana</span>
                    <span className="block sm:inline sm:ml-1 text-xs sm:text-sm opacity-90">
                      {formatDisplayDate(week.date)}
                    </span>
                  </h3>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="inline-flex items-center h-5 w-5 sm:h-6 sm:w-6 justify-center rounded-full text-xs sm:text-sm font-semibold new-week-music-badge">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-wrap gap-3 sm:gap-3">
              {week.people.map((person, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 new-week-music-indicator rounded-lg text-xs sm:text-sm"
                >
                  <span className="font-medium">{person}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg font-semibold transition-colors group-hover:text-primary">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{formatDisplayDate(week.date)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-wrap gap-3 sm:gap-3">
            {week.people.map((person, personIndex) => (
              <div
                key={personIndex}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted rounded-lg border border-border/50 text-xs sm:text-sm"
              >
                <span className="text-foreground">{person}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);

WeekCard.displayName = "WeekCard";

const ScalePage = () => {
  const { currentWeek, upcomingWeeks } = useMemo(() => {
    // Encontrar o próximo domingo
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
    const daysUntilNextSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilNextSunday);
    nextSunday.setHours(0, 0, 0, 0);

    // Formatar a data no formato YYYY-MM-DD
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const nextSundayStr = formatDate(nextSunday);

    // Encontrar a entrada do próximo domingo
    const escala = escalaData as EscalaItem[];
    const currentWeekIndex = escala.findIndex(
      (item) => item.date === nextSundayStr
    );

    if (currentWeekIndex === -1) {
      // Se não encontrar o próximo domingo, usar a primeira entrada
      return {
        currentWeek: escala[0] || null,
        upcomingWeeks: escala.slice(1),
      };
    }

    return {
      currentWeek: escala[currentWeekIndex],
      upcomingWeeks: escala.slice(currentWeekIndex + 1),
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-black/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-4 sm:px-4 py-6 sm:py-6 md:py-8">
          <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/10 mb-2 sm:mb-3 md:mb-4">
              <Calendar className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight px-2">
              Escala de Adoração
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4 sm:px-4">
              Confira quem estará ministrando nos próximos domingos
            </p>
          </div>
        </div>
      </div>

      {/* Escala Section */}
      <div className="container mx-auto px-4 sm:px-4 py-6 sm:py-6 md:py-8 max-w-6xl">
        <div className="space-y-6 sm:space-y-8 md:space-y-10">
          {/* Card da semana atual - centralizado e verde */}
          {currentWeek && (
            <div className="flex justify-center">
              <WeekCard week={currentWeek} isCurrentWeek={true} />
            </div>
          )}

          {/* Cards das semanas seguintes - grid */}
          {upcomingWeeks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 sm:mb-6 md:mb-8">
                <Users className="w-4 h-4 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                  Próximas Semanas
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {upcomingWeeks.map((week) => (
                  <WeekCard key={week.date} week={week} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScalePage;
