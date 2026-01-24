// Mapeamento de notas para números (0 = C, 1 = C#/Db, 2 = D, etc.)
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

// Mapeamento reverso (número para nota, preferindo sustenidos)
const numberToNote: Record<number, string> = {
  0: "C",
  1: "C#",
  2: "D",
  3: "D#",
  4: "E",
  5: "F",
  6: "F#",
  7: "G",
  8: "G#",
  9: "A",
  10: "A#",
  11: "B",
};

/**
 * Detecta o tom original da música analisando os acordes
 * @param chordsText - Texto da cifra
 * @returns Nota do tom original (ex: "C", "D", "Am", etc.) ou null se não conseguir detectar
 */
export function detectOriginalKey(chordsText: string): string | null {
  if (!chordsText) return null;

  const chordPattern =
    /\b([A-G](?:#|b)?)((?:m|M|dim|aug|sus\d*|add\d*|\d+)*)(?:\/([A-G](?:#|b)?))?\b/g;

  const chordCounts: Record<string, number> = {};
  const chordDetails: Array<{ note: string; isMinor: boolean }> = [];
  let match;
  let firstChord: { note: string; isMinor: boolean } | null = null;

  // Contar ocorrências de cada nota raiz e coletar detalhes
  while ((match = chordPattern.exec(chordsText)) !== null) {
    const rootNote = match[1];
    const quality = match[2] || "";
    const isMinor = /^m(?!aj)/.test(quality);

    if (rootNote && noteMap.hasOwnProperty(rootNote)) {
      chordCounts[rootNote] = (chordCounts[rootNote] || 0) + 1;
      chordDetails.push({ note: rootNote, isMinor });

      // Guardar o primeiro acorde encontrado
      if (!firstChord) {
        firstChord = { note: rootNote, isMinor };
      }
    }
  }

  if (Object.keys(chordCounts).length === 0) return null;

  // Encontrar a nota mais frequente (geralmente é a tônica)
  let maxCount = 0;
  let mostCommonNote: string | null = null;

  for (const [note, count] of Object.entries(chordCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonNote = note;
    }
  }

  // Verificar se o primeiro acorde ou a nota mais comum é menor
  let isMinorKey = false;
  if (firstChord) {
    // Se o primeiro acorde é menor, provavelmente é tom menor
    if (firstChord.isMinor && firstChord.note === mostCommonNote) {
      isMinorKey = true;
    }
  }

  // Verificar se a nota mais comum aparece principalmente como menor
  if (!isMinorKey && mostCommonNote) {
    const minorCount = chordDetails.filter(
      (c) => c.note === mostCommonNote && c.isMinor
    ).length;
    const majorCount = chordDetails.filter(
      (c) => c.note === mostCommonNote && !c.isMinor
    ).length;

    // Se há mais acordes menores que maiores dessa nota, é tom menor
    if (minorCount > majorCount && minorCount > 0) {
      isMinorKey = true;
    }
  }

  if (!mostCommonNote) return null;

  return isMinorKey ? mostCommonNote + "m" : mostCommonNote;
}

/**
 * Gera a escala maior de uma nota
 * @param rootNote - Nota raiz (ex: "C", "D", "F#")
 * @returns Array com as notas da escala
 */
export function getMajorScale(rootNote: string): string[] {
  if (!rootNote || !noteMap.hasOwnProperty(rootNote)) {
    return [];
  }

  // Intervalos da escala maior: T-T-ST-T-T-T-ST (2-2-1-2-2-2-1 semitons)
  const majorIntervals = [2, 2, 1, 2, 2, 2, 1];
  const rootNumber = noteMap[rootNote];
  const scale: string[] = [rootNote];

  let currentNote = rootNumber;
  for (const interval of majorIntervals) {
    currentNote = (currentNote + interval) % 12;
    scale.push(numberToNote[currentNote]);
  }

  return scale;
}

/**
 * Gera a escala menor natural de uma nota
 * @param rootNote - Nota raiz (ex: "A", "D", "F#")
 * @returns Array com as notas da escala
 */
export function getMinorScale(rootNote: string): string[] {
  if (!rootNote || !noteMap.hasOwnProperty(rootNote)) {
    return [];
  }

  // Intervalos da escala menor natural: T-ST-T-T-ST-T-T (2-1-2-2-1-2-2 semitons)
  const minorIntervals = [2, 1, 2, 2, 1, 2, 2];
  const rootNumber = noteMap[rootNote];
  const scale: string[] = [rootNote];

  let currentNote = rootNumber;
  for (const interval of minorIntervals) {
    currentNote = (currentNote + interval) % 12;
    scale.push(numberToNote[currentNote]);
  }

  return scale;
}

/**
 * Obtém a escala correspondente a uma nota (maior ou menor)
 * @param note - Nota (ex: "C", "Am", "D")
 * @returns Array com as notas da escala
 */
export function getScale(note: string): string[] {
  if (!note) return [];

  // Se termina com "m" (e não "maj"), é menor
  if (note.endsWith("m") && !note.endsWith("maj")) {
    const rootNote = note.slice(0, -1);
    return getMinorScale(rootNote);
  }

  // Caso contrário, é maior
  return getMajorScale(note);
}

/**
 * Transpõe acordes de uma cifra para um tom diferente
 * @param chordsText - Texto da cifra original
 * @param semitones - Número de semitons para transpor (positivo = subir, negativo = descer)
 * @returns Texto da cifra transposta
 */
export function transposeChords(chordsText: string, semitones: number): string {
  if (!chordsText || semitones === 0) return chordsText;

  /**
   * Transpõe uma nota individual
   */
  function transposeNote(note: string): string {
    if (!note || !noteMap.hasOwnProperty(note)) return note;
    const noteNumber = noteMap[note];
    const newNoteNumber = (noteNumber + semitones + 12) % 12;
    return numberToNote[newNoteNumber];
  }

  /**
   * Detecta e transpõe um acorde completo
   */
  function transposeChord(chord: string): string {
    // Padrão para acorde com baixo: ex: C/E, Am/G
    const chordWithBass = /^([A-G](?:#|b)?)(.*?)\/([A-G](?:#|b)?)$/;
    const matchWithBass = chord.match(chordWithBass);

    if (matchWithBass) {
      const [, rootNote, quality, bassNote] = matchWithBass;
      const newRoot = transposeNote(rootNote);
      const newBass = transposeNote(bassNote);
      return newRoot + quality + "/" + newBass;
    }

    // Padrão para acorde simples: ex: C, Am, F#m7, Bb
    const chordSimple = /^([A-G](?:#|b)?)(.*)$/;
    const matchSimple = chord.match(chordSimple);

    if (matchSimple) {
      const [, rootNote, quality] = matchSimple;
      const newRoot = transposeNote(rootNote);
      return newRoot + quality;
    }

    return chord;
  }

  // Padrão regex melhorado para detectar acordes no texto
  // Captura acordes que começam com A-G, podem ter # ou b
  // Seguidos de modificadores válidos de acorde
  // Também captura acordes com baixo (ex: C/E)
  // Usa lookahead negativo para evitar capturar palavras comuns que começam com letras de notas
  const chordPattern =
    /\b([A-G](?:#|b)?)((?:sus\d*|add\d*|dim|aug|maj|min|m|M|\d+|4)*)(?:\/([A-G](?:#|b)?))?\b/g;
  let result = "";
  let lastIndex = 0;
  let match;

  // Processar cada match individualmente
  while ((match = chordPattern.exec(chordsText)) !== null) {
    const [fullMatch, rootNote, quality, bassNote] = match;
    const matchIndex = match.index;

    // Adicionar texto antes do match
    result += chordsText.substring(lastIndex, matchIndex);

    // Verificar se a nota raiz é válida no nosso mapeamento
    if (rootNote && noteMap.hasOwnProperty(rootNote)) {
      // Validar que não é uma palavra comum (ex: "Am", "Do", "Re" em português)
      // Verificar se tem modificadores de acorde ou se é uma nota simples seguida de espaço/pontuação
      const isValidChord = 
        quality || // Tem modificadores de acorde (m, 7, etc)
        bassNote || // Tem nota de baixo
        /^[A-G](?:#|b)?$/.test(fullMatch); // É apenas uma nota simples (C, D, F#, etc)

      if (isValidChord) {
        // Transpor a nota raiz
        const rootNumber = noteMap[rootNote];
        const newRootNumber = (rootNumber + semitones + 12) % 12;
        const newRootNote = numberToNote[newRootNumber];

        // Transpor a nota do baixo se houver
        let newBassNote = "";
        if (bassNote && noteMap.hasOwnProperty(bassNote)) {
          const bassNumber = noteMap[bassNote];
          const newBassNumber = (bassNumber + semitones + 12) % 12;
          newBassNote = numberToNote[newBassNumber];
        }

        // Reconstruir o acorde transposto mantendo a qualidade original
        let transposedChord = newRootNote;
        if (quality) transposedChord += quality;
        if (newBassNote) transposedChord += "/" + newBassNote;

        result += transposedChord;
      } else {
        // Se não for um acorde válido, manter o texto original
        result += fullMatch;
      }
    } else {
      // Se não for um acorde válido, manter o texto original
      result += fullMatch;
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // Adicionar o restante do texto
  result += chordsText.substring(lastIndex);

  return result;
}
