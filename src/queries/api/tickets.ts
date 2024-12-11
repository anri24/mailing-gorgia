import { useQuery } from "@tanstack/react-query";
import { TicketsAPI } from "./query-slice";

export function useTickets(page: number = 1, amount: number = 20) {
  return useQuery({
    queryKey: ["tickets", page, amount],
    queryFn: () => TicketsAPI.getTickets({ page, amount }),
  });
}
