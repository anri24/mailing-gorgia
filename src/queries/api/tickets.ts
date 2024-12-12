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
    onSuccess: (response) => {
      if (response.success) {
        toast.success("პასუხი წარმატებით გაიგზავნა");
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
      } else {
        toast.error(response.message === "Ticket was already answered" 
          ? "ბილეთს უკვე გაეცა პასუხი"
          : "პასუხის გაგზავნა ვერ მოხერხდა");
      }
    },
    onError: (error) => {
      console.error("Failed to send reply:", error);
      toast.error("პასუხის გაგზავნა ვერ მოხერხდა");
    },
  });
}
