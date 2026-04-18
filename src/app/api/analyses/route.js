import { createAnalysis, listAnalyses } from '@/lib/repositories/analyses';
import { saveAnalysisSchema, paginationSchema } from '@/schemas/api';
import { verifyJwt, getJwtFromRequest } from '@/lib/session';
import { getTeamMemberIds } from '@/lib/repositories/users';

export const runtime = 'nodejs';

export async function GET(request) {
  const jwtSession = await verifyJwt(getJwtFromRequest(request));
  if (!jwtSession) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const paginationParsed = paginationSchema.safeParse(Object.fromEntries(searchParams));
  if (!paginationParsed.success) {
    return Response.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
  }
  const pendente = searchParams.get('pendente') === 'true';

  let userIds = null;
  if (jwtSession.role === 'vendedor') {
    userIds = [jwtSession.sub];
  } else if (jwtSession.role === 'gestor') {
    userIds = await getTeamMemberIds(jwtSession.teamIds ?? []);
  }
  // psicologo: userIds permanece null → vê todas

  try {
    const analyses = await listAnalyses({ pendente, ...paginationParsed.data, userIds });
    return Response.json(analyses);
  } catch (err) {
    console.error('[GET /api/analyses]', err.message);
    return Response.json({ error: 'Erro ao listar análises.' }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json();
  const parsed = saveAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const { corretorNome, clienteRef, conversaRaw, resultado,
          clientData, vendorData, signalsData, sirData } = parsed.data;

  const jwtToken = getJwtFromRequest(request);
  const jwtSession = await verifyJwt(jwtToken);
  const userId = jwtSession?.role === 'vendedor' ? jwtSession.sub : null;

  try {
    const analysis = await createAnalysis({
      userId,
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
