import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TicketsAPI } from "./query-slice";
import { toast } from "sonner";

export function useTickets(page: number = 1, amount: number = 20) {
  return useQuery({
    queryKey: ["tickets", page, amount],
    queryFn: () => TicketsAPI.getTickets({ page, amount }),
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: TicketsAPI.replyToTicket,
    onSuccess: () => {
      toast.success("Reply sent successfully");
      // Invalidate tickets query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error) => {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply");
    },
  });
}
