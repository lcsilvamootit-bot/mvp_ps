import { z } from 'zod';

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

// Generics reutilizáveis
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});
