import { useMutation } from "@tanstack/react-query";
import {
  aiService,
  type AiChatInput,
  type AiIdeaFormSuggestionInput,
} from "@/services/ai.service";

export function useAiChatMutation() {
  return useMutation({
    mutationFn: (payload: AiChatInput) => aiService.chat(payload),
  });
}

export function useAiIdeaFormSuggestionsMutation() {
  return useMutation({
    mutationFn: (payload: AiIdeaFormSuggestionInput) =>
      aiService.getIdeaFormSuggestions(payload),
  });
}
