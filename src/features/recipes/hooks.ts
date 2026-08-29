import { useMutation } from '@tanstack/react-query';
import { analyzeQuestion } from './api';

export function useAnalyzeQuestion() {
  return useMutation({
    mutationFn: (pregunta: string) => analyzeQuestion(pregunta),
    networkMode: 'always',
  });
}
