import { z } from 'zod';

export const saveReviewSchema = z.object({
  reviewerNome:      z.string().max(120).optional().nullable(),
  jungAvaliacao:     z.enum(['correto', 'parcialmente', 'errado']),
  jungCorreto:       z.enum(['Pragmático', 'Analítico', 'Afável', 'Expressivo']).optional().nullable(),
  momentoAvaliacao:  z.enum(['correto', 'parcialmente', 'errado']),
  momentoCorreto:    z.enum(['Indeciso', 'Confuso', 'Decidido', 'Crítico', 'Nervoso', 'Apressado', 'Negociador', 'Detalhista', 'Informal']).optional().nullable(),
  contextoAvaliacao: z.enum(['correto', 'parcialmente', 'errado']),
  contextoCorreto:   z.enum(['Ativo', 'Resgate', 'Follow-up', 'Indefinido']).optional().nullable(),
  observacao:        z.string().max(2000).optional().nullable(),
});

export const saveAnalysisSchema = z.object({
  corretorNome:  z.string().max(120).optional(),
  clienteRef:    z.string().max(120).optional(),
  conversaRaw:   z.string(),
  resultado:     z.enum(['fechada', 'perdida', 'em_andamento']),
  clientData:    z.record(z.unknown()),
  vendorData:    z.record(z.unknown()),
  signalsData:   z.record(z.unknown()),
  sirData:       z.record(z.unknown()).nullable().optional(),
});

export const saveRescueSchema = z.object({
  rescuePlan: z.record(z.unknown()),
});

export const updateResultadoSchema = z.object({
  resultado: z.enum(['fechada', 'perdida', 'em_andamento']),
});

// Generics reutilizáveis
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});
