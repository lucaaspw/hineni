import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safari-safe body scroll management
export function disableBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.classList.add("dialog-open");
  return scrollY;
}

export function enableBodyScroll(scrollY?: number) {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.classList.remove("dialog-open");
  if (scrollY !== undefined) {
    window.scrollTo(0, scrollY);
  }
}

/**
 * Calcula o início da semana (segunda-feira às 03h) para uma data
 * A semana começa na segunda-feira às 03h
 * @param date - Data de referência (padrão: hoje)
 * @returns Data da segunda-feira da semana (às 03h)
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo, 1 = segunda, etc.
  const hour = d.getHours(); // Hora atual

  // Calcular a segunda-feira da semana atual
  // Se é domingo (0), precisamos voltar 6 dias
  // Se é segunda (1), é hoje mesmo (mas verificar hora)
  // Se é terça a sábado (2-6), voltar (day - 1) dias
  let daysToMonday = day === 0 ? 6 : day - 1;

  // Se é segunda-feira e antes das 03h, ainda estamos na semana anterior
  if (day === 1 && hour < 3) {
    daysToMonday = 7; // Voltar para a segunda anterior
  }
  // Se é domingo, sempre estamos na semana anterior (que termina segunda 03h)
  else if (day === 0) {
    daysToMonday = 6; // Voltar para a segunda anterior
  }

  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - daysToMonday);
  weekStart.setHours(3, 0, 0, 0); // Segunda-feira às 03h
  return weekStart;
}

/**
 * Calcula o fim da semana (próxima segunda-feira às 03h) para uma data
 * A semana termina na segunda-feira às 03h (quando começa a próxima semana)
 * @param date - Data de referência (padrão: hoje)
 * @returns Data da próxima segunda-feira às 03h (fim da semana atual)
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  // O fim da semana é a próxima segunda-feira às 03h
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(3, 0, 0, 0);
  return weekEnd;
}

/**
 * Gera todas as combinações possíveis de k elementos de um array
 */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];

  const result: T[][] = [];

  for (let i = 0; i <= arr.length - k; i++) {
    const head = arr[i];
    const tailCombinations = combinations(arr.slice(i + 1), k - 1);
    for (const tail of tailCombinations) {
      result.push([head, ...tail]);
    }
  }

  return result;
}

/**
 * Gera todos os domingos de um ano
 */
export function getAllSundaysOfYear(year: number): Date[] {
  const sundays: Date[] = [];
  const date = new Date(year, 0, 1); // 1 de janeiro

  // Encontrar o primeiro domingo do ano
  while (date.getDay() !== 0) {
    date.setDate(date.getDate() + 1);
  }

  // Adicionar todos os domingos do ano
  while (date.getFullYear() === year) {
    const sunday = new Date(date);
    sunday.setHours(0, 0, 0, 0);
    sundays.push(sunday);
    date.setDate(date.getDate() + 7); // Próximo domingo
  }

  return sundays;
}

/**
 * Gera escalas rotacionadas para todos os domingos do ano
 * Evita repetições seguidas de combinações
 */
export function generateRotatedScales(
  femaleVoices: string[],
  fixedMember: string,
  sundays: Date[]
): Array<{ date: Date; members: string[] }> {
  // Gerar todas as combinações possíveis de 3 vozes femininas
  const allCombinations = combinations(femaleVoices, 3);

  // Normalizar combinações (ordenar para comparação)
  const normalizedCombinations = allCombinations.map((combo) =>
    [...combo].sort()
  );

  // Se não há combinações suficientes, repetir até ter o suficiente
  const neededCombinations = sundays.length;
  const repeatedCombinations: string[][] = [];

  // Repetir combinações até ter o suficiente
  let comboIndex = 0;
  while (repeatedCombinations.length < neededCombinations) {
    repeatedCombinations.push([
      ...normalizedCombinations[comboIndex % normalizedCombinations.length],
    ]);
    comboIndex++;
  }

  // Embaralhar as combinações para evitar padrões previsíveis
  const shuffled = [...repeatedCombinations].sort(() => Math.random() - 0.5);

  // Aplicar algoritmo para evitar repetições seguidas
  const finalCombinations: string[][] = [];
  const usedRecently: Set<string> = new Set();
  const recentWindow = 4; // Evitar repetir nas últimas 4 semanas

  for (let i = 0; i < neededCombinations; i++) {
    let selected: string[] | null = null;
    let attempts = 0;
    const maxAttempts = shuffled.length * 2;

    // Tentar encontrar uma combinação que não foi usada recentemente
    for (let j = 0; j < shuffled.length && attempts < maxAttempts; j++) {
      const candidate = shuffled[(i + j) % shuffled.length];
      const candidateKey = candidate.join(",");

      if (!usedRecently.has(candidateKey)) {
        selected = [...candidate];
        break;
      }
      attempts++;
    }

    // Se não encontrou, usar a primeira disponível (menos recente)
    if (!selected) {
      selected = [...shuffled[i % shuffled.length]];
    }

    const selectedKey = selected.join(",");

    // Adicionar à lista de usadas recentemente
    usedRecently.add(selectedKey);

    // Manter apenas as últimas 'recentWindow' combinações
    if (usedRecently.size > recentWindow) {
      // Remover a mais antiga (primeira da lista de finalCombinations)
      if (finalCombinations.length >= recentWindow) {
        const oldestKey =
          finalCombinations[finalCombinations.length - recentWindow].join(",");
        usedRecently.delete(oldestKey);
      }
    }

    finalCombinations.push(selected);
  }

  // Criar escalas com Lucas sempre incluído
  return sundays.map((date, index) => {
    // Garantir que temos uma combinação válida
    if (!finalCombinations[index] || finalCombinations[index].length === 0) {
      throw new Error(`Combinação inválida no índice ${index}`);
    }

    // Ordenar membros: Lucas primeiro, depois os outros alfabeticamente
    const otherMembers = [...finalCombinations[index]].sort();
    return {
      date: new Date(date), // Garantir que é um objeto Date válido
      members: [fixedMember, ...otherMembers],
    };
  });
}
