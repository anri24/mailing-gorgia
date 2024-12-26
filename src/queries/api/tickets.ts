import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReplyTicketType, TicketsAPI } from "./query-slice";
import { toast } from "sonner";

export function useTickets(
  page: number = 1,
  amount: number = 10,
  fromDate?: string,
  toDate?: string,
  from?: string,
  status?: number
) {
  return useQuery({
    queryKey: ["tickets", { page, amount, fromDate, toDate, from, status }],
    queryFn: () =>
      TicketsAPI.getTickets({ page, amount, fromDate, toDate, from, status }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      files,
    }: {
      id: number;
      content: string;
      files?: File[];
    }) => {
      const formData = new FormData();
      formData.append("TicketId", id.toString());
      formData.append("Content", content);

      if (files?.length) {
        files.forEach((file) => {
          formData.append("File", file);
        });
      }

      return TicketsAPI.replyToTicket(formData as ReplyTicketType);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success("პასუხი წარმატებით გაიგზავნა");
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
      } else {
        toast.error(
          response.message === "Ticket was already answered"
            ? "ბილეთს უკვე გაეცა პასუხი"
            : "პასუხის გაგზავნა ვერ მოხერხდა"
        );
      }
    },
    onError: (error) => {
      console.error("Failed to send reply:", error);
      toast.error("პასუხის გაგზავნა ვერ მოხერხდა");
    },
  });
}
