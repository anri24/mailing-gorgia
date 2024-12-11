import { useUsers } from "@/queries/api/user";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export const Users = () => {
    const [page, setPage] = useState(1)
    const [amount, setAmount] = useState(10)
    
    const { data: users, isLoading, error } = useUsers(page, amount);

    if (isLoading) {
        return (
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        );
      }
    
      if (error) {
        return (
          <div className="flex items-center justify-center h-[50vh] text-destructive">
            <AlertCircle className="w-6 h-6 mr-2" />
            <span>Error loading tickets: {error.message}</span>
          </div>
        );
      }


  return (
    <div>
        {users?.map(user => (
            <div>user</div>
        ))}
    </div>
  )
}
