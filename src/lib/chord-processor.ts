import { detectOriginalKey, transposeChords } from "./chord-transposer";

// Mapeamento de notas para números (mesmo do chord-transposer.ts)
const noteMap: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

// Notas válidas
const VALID_NOTES = new Set([
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
]);

/**
 * Extrai apenas a letra da cifra, removendo os acordes
 * @param chordText - Texto da cifra com acordes e letra
 * @returns Texto apenas com a letra, sem acordes
 */
export function extractLyrics(chordText: string): string {
  if (!chordText) return "";

  // Padrão regex para detectar acordes (similar ao usado em music-viewer.tsx)
  const chordPattern =
    /\b([A-G](?:#|b)?)((?:m(?:aj|in|7|9|11|13|6|add\d+)?|dim|aug|sus[24]?|maj[79]?|add\d+|6\/9|7(?:sus[24]|b5|#5|b9|#9|#11|b13)?|9(?:sus4|b5|#5)?|11(?:b9)?|13(?:sus4|b9)?|6|°|ø|\+)?)(?:\/([A-G](?:#|b)?))?(?=\s|$|\n|[^\w#b\/])/g;

  let result = chordText;
  const matches: Array<{ index: number; length: number }> = [];
  let match;

  // Identificar todos os acordes
  while ((match = chordPattern.exec(chordText)) !== null) {
    const fullMatch = match[0];
    const rootNote = match[1];
    const quality = match[2] || "";
    const bassNote = match[3] || "";
    const matchIndex = match.index;

    // Verificar contexto antes e depois do match
    const charBefore = matchIndex > 0 ? chordText[matchIndex - 1] : "";
    const charAfter = matchIndex + fullMatch.length < chordText.length 
      ? chordText[matchIndex + fullMatch.length] 
      : "";

    // Validar que a nota raiz é válida
    const isValidRootNote = VALID_NOTES.has(rootNote);
    
    // Validar que é um acorde válido
    const hasQuality = quality.length > 0;
    const hasBass = bassNote.length > 0 && VALID_NOTES.has(bassNote);
    const isSimpleNote = /^[A-G](?:#|b)?$/.test(fullMatch);
    
    const isWordBoundary = 
      charBefore === "" || 
      /[\s\n\r\[\](){}|,.;:!?\-]/.test(charBefore) ||
      !/[a-z]/.test(charBefore);
    
    const isNotInWord = 
      charAfter === "" || 
      /[\s\n\r\[\](){}|,.;:!?\-]/.test(charAfter) ||
      !/[a-z]/.test(charAfter);

    const isValidChord = 
      isValidRootNote &&
      (hasQuality || hasBass || (isSimpleNote && isWordBoundary && isNotInWord));

    if (isValidChord) {
      matches.push({
        index: matchIndex,
        length: fullMatch.length,
      });
    }
  }

  // Remover acordes do texto (processar de trás para frente para manter índices corretos)
  matches.sort((a, b) => b.index - a.index);
  
  for (const matchInfo of matches) {
    // Remover o acorde, mas manter espaços se necessário
    const before = result.substring(0, matchInfo.index);
    const after = result.substring(matchInfo.index + matchInfo.length);
    
    // Se o acorde estava entre espaços, manter apenas um espaço
    const trimmedBefore = before.trimEnd();
    const trimmedAfter = after.trimStart();
    
    result = trimmedBefore + (trimmedBefore && trimmedAfter ? " " : "") + trimmedAfter;
  }

  // Limpar múltiplos espaços e linhas vazias excessivas
  result = result.replace(/[ \t]+/g, " "); // Múltiplos espaços/tabs viram um espaço
  result = result.replace(/\n[ \t]*\n[ \t]*\n+/g, "\n\n"); // Múltiplas linhas vazias viram no máximo 2

  return result.trim();
}

/**
 * Calcula o número de semitons entre dois tons
 * @param fromKey - Tom de origem (ex: "C", "Am", "D#")
 * @param toKey - Tom de destino (ex: "D", "Bm", "F#")
 * @returns Número de semitons (positivo = subir, negativo = descer)
 */
export function calculateSemitones(fromKey: string, toKey: string): number {
  if (!fromKey || !toKey) return 0;

  // Extrair a nota raiz do tom (remover "m" se for menor)
  const fromNote = fromKey.replace(/m$/, "").trim();
  const toNote = toKey.replace(/m$/, "").trim();

  if (!noteMap.hasOwnProperty(fromNote) || !noteMap.hasOwnProperty(toNote)) {
    return 0;
  }

  const fromNumber = noteMap[fromNote];
  const toNumber = noteMap[toNote];

  // Calcular diferença (garantir resultado positivo)
  let semitones = toNumber - fromNumber;
  if (semitones < 0) {
    semitones += 12;
  }

  return semitones;
}

/**
 * Processa uma cifra: detecta tom, permite transposição e extrai letra
 * @param chordText - Texto da cifra original
 * @param targetKey - Tom de destino (opcional, se não fornecido mantém o original)
 * @returns Objeto com cifra processada, letra extraída e tom detectado
 */
export function processChordFile(
  chordText: string,
  targetKey?: string
): {
  chords: string;
  lyrics: string;
  detectedKey: string | null;
  transposed: boolean;
} {
  if (!chordText) {
    return {
      chords: "",
      lyrics: "",
      detectedKey: null,
      transposed: false,
    };
  }

  // Detectar tom original
  const detectedKey = detectOriginalKey(chordText);

  // Se não detectou tom ou não há tom de destino, retornar original
  if (!detectedKey || !targetKey || detectedKey === targetKey) {
    return {
      chords: chordText,
      lyrics: extractLyrics(chordText),
      detectedKey,
      transposed: false,
    };
  }

  // Calcular semitons e transpor
  const semitones = calculateSemitones(detectedKey, targetKey);
  const transposedChords = transposeChords(chordText, semitones);

  return {
    chords: transposedChords,
    lyrics: extractLyrics(chordText), // Extrair letra do original (sem transposição)
    detectedKey,
    transposed: true,
  };
}

/**
 * Lista de tons disponíveis para seleção
 */
export const AVAILABLE_KEYS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
  "Am",
  "A#m",
  "Bbm",
  "Bm",
  "Cm",
  "C#m",
  "Dm",
  "D#m",
  "Ebm",
  "Em",
  "Fm",
  "F#m",
  "Gm",
  "G#m",
  "Abm",
];
