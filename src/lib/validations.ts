import { z } from "zod";

// Schema para validação de música (criação)
export const musicSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(200, "Título muito longo"),
  artist: z.string().optional(),
  lyrics: z.string().min(1, "Letra é obrigatória"),
  chords: z.string().optional(),
  externalLink: z
    .string()
    .optional()
    .refine(
      (url) => {
        if (!url || url.trim() === "") return true;
        try {
          new URL(url);
          return (
            url.includes("youtube.com") ||
            url.includes("youtu.be") ||
            url.includes("spotify.com") ||
            url.includes("open.spotify.com")
          );
        } catch {
          return false;
        }
      },
      {
        message: "Link deve ser uma URL válida do YouTube ou Spotify",
      }
    ),
  isNewOfWeek: z.boolean().default(false),
});

// Schema para validação de música (edição - inclui id)
export const musicEditSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(200, "Título muito longo"),
  artist: z.string().optional(),
  lyrics: z.string().min(1, "Letra é obrigatória"),
  chords: z.string().optional(),
  externalLink: z
    .string()
    .optional()
    .refine(
      (url) => {
        if (!url || url.trim() === "") return true;
        try {
          new URL(url);
          return (
            url.includes("youtube.com") ||
            url.includes("youtu.be") ||
            url.includes("spotify.com") ||
            url.includes("open.spotify.com")
          );
        } catch {
          return false;
        }
      },
      {
        message: "Link deve ser uma URL válida do YouTube ou Spotify",
      }
    ),
  isNewOfWeek: z.boolean().default(false),
});

// Schema para validação de login
export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Schema para validação de repertório
export const repertoireSchema = z.object({
  positions: z.array(z.string()).length(6, "É necessário fornecer 6 posições"),
});

// Tipos derivados dos schemas
export type MusicInput = z.infer<typeof musicSchema>;
export type MusicEditInput = z.infer<typeof musicEditSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RepertoireInput = z.infer<typeof repertoireSchema>;
