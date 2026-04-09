import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

type UserIdVariables = {
  id: string;
};

function useUserInvalidator() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["users"] });
  };
}

export function useDeleteUserMutation() {
  const invalidate = useUserInvalidator();

  return useMutation({
    mutationFn: ({ id }: UserIdVariables) => userService.deleteUser(id),
    onSuccess: async () => {
      await invalidate();
    },
  });
}
