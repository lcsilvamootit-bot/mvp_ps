import { createAnalysis } from '@/lib/repositories/analyses';
import { saveAnalysisSchema } from '@/schemas/api';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.json();
  const parsed = saveAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const { corretorNome, clienteRef, conversaRaw, resultado,
          clientData, vendorData, signalsData, sirData } = parsed.data;

  try {
    const analysis = await createAnalysis({
      corretorNome,
      clienteRef,
      conversaRaw,
      resultado,
      perfilJung:            clientData?.perfilJung            ?? null,
      perfilMomento:         clientData?.perfilMomento         ?? null,
      contextoTemporal:      clientData?.contextoTemporal      ?? null,
      tendencia:             signalsData?.tendencia            ?? null,
      perfilNaturalVendedor: vendorData?.perfilNatural         ?? null,
      aderenciaCliente:      vendorData?.aderenciaCliente      ?? null,
      fase1Nota:             vendorData?.fase1?.nota           ?? null,
      fase2Nota:             vendorData?.fase2?.nota           ?? null,
      riscoPerdaNota:        vendorData?.veredito?.riscoPerda  ?? null,
      clientData,
      vendorData,
      signalsData,
      sirData: sirData ?? null,
    });

    return Response.json({ id: analysis.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/analyses]', err.message);
    return Response.json({ error: 'Erro ao salvar análise.' }, { status: 500 });
  }
}
