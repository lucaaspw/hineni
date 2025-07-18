// Utilitários de performance para otimizar o carregamento

// Cache em memória para diferentes tipos de dados
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Função para gerenciar cache
export function getCachedData<T>(
  key: string,
  ttl: number = 5 * 60 * 1000
): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

// Função para salvar dados no cache
export function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = 5 * 60 * 1000
): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Função para invalidar cache
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Debounce para otimizar chamadas de API
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle para otimizar eventos de scroll/resize
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Função para otimizar fetch com cache
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  cacheKey?: string,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const key = cacheKey || url;

  // Verificar cache primeiro
  const cached = getCachedData<T>(key, ttl);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Cache-Control": "max-age=300",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Salvar no cache
    setCachedData(key, data, ttl);

    return data;
  } catch (error) {
    console.error("Erro no fetch com cache:", error);
    throw error;
  }
}

// Função para pré-carregar dados importantes
export function preloadData(): void {
  // Pré-carregar repertório
  fetchWithCache("/api/repertoire", {}, "repertoire", 5 * 60 * 1000).catch(
    () => {
      // Ignorar erros de pré-carregamento
    }
  );

  // Pré-carregar músicas
  fetchWithCache("/api/musics", {}, "musics", 5 * 60 * 1000).catch(() => {
    // Ignorar erros de pré-carregamento
  });
}

// Função para detectar se o dispositivo é móvel
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
}

// Função para otimizar scroll em dispositivos móveis
export function optimizeMobileScroll(element: HTMLElement): void {
  if (!isMobile()) return;

  (element.style as any).webkitOverflowScrolling = "touch";
  element.style.scrollBehavior = "smooth";
}

// Função para limpar cache periodicamente
export function startCacheCleanup(interval: number = 10 * 60 * 1000): void {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        cache.delete(key);
      }
    }
  }, interval);
}

// Iniciar limpeza automática do cache
if (typeof window !== "undefined") {
  startCacheCleanup();
}
