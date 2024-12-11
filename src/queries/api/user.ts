import {useQuery } from "@tanstack/react-query";
import { UsersAPI } from "./query-slice";

export function useUsers(page: number = 1, amount: number = 20) {
  return useQuery({
    queryKey: ["users", page, amount],
    queryFn: () => UsersAPI.getUsers({ page, amount }),
  });
}


