import { z } from "zod";

// Schema para validação de música
export const musicSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(200, "Título muito longo"),
  artist: z.string().optional(),
  lyrics: z.string().min(1, "Letra é obrigatória"),
  chords: z.string().optional(),
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
export type LoginInput = z.infer<typeof loginSchema>;
export type RepertoireInput = z.infer<typeof repertoireSchema>;
