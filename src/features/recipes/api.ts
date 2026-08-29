import { api, endpoints } from '@/src/shared/api';

export type AnalyzeQuestionResponse = {
  respuesta?: string;
};

export async function analyzeQuestion(pregunta: string): Promise<AnalyzeQuestionResponse> {
  const { data } = await api.post<AnalyzeQuestionResponse>(endpoints.analizarPregunta, {
    pregunta,
  });
  return data;
}
