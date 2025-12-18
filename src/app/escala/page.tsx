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
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    if (isCurrentWeek) {
      return (
        <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 backdrop-blur-sm new-week-music-card max-w-2xl w-full">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-start justify-between space-y-2 sm:space-y-0 sm:flex-row sm:items-center">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold transition-colors new-week-music-title group-hover:text-green-600 dark:group-hover:text-green-300">
                  Esta Semana
                </h3>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="inline-flex items-center h-6 w-6 justify-center rounded-full text-sm font-semibold new-week-music-badge">
                  <Star className="w-4 h-4" />
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              {week.people.map((person, index) => (
                <div
                  key={index}
                  className="px-4 py-2 new-week-music-indicator rounded-lg"
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
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold transition-colors group-hover:text-primary">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDisplayDate(week.date)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            {week.people.map((person, personIndex) => (
              <div
                key={personIndex}
                className="px-4 py-2 bg-muted rounded-lg border border-border/50"
              >
                <span className="text-sm sm:text-base text-foreground">
                  {person}
                </span>
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
        <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-24">
          <div className="text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 sm:mb-6">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight px-2">
              Escala de Adoração
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Confira quem estará ministrando nos próximos domingos
            </p>
          </div>
        </div>
      </div>

      {/* Escala Section */}
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        <div className="space-y-8 sm:space-y-12">
          {/* Card da semana atual - centralizado e verde */}
          {currentWeek && (
            <div className="flex justify-center">
              <WeekCard week={currentWeek} isCurrentWeek={true} />
            </div>
          )}

          {/* Cards das semanas seguintes - grid */}
          {upcomingWeeks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-xl sm:text-2xl font-semibold">
                  Próximas Semanas
                </h2>
              </div>
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
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
