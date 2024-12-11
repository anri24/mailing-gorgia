import { useState } from "react";
import { useTickets } from "@/queries/api/tickets";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [page, setPage] = useState(1);
  const [amount] = useState(20);

  const { data: tickets, isLoading, error } = useTickets(page, amount);

  if (isLoading) {
    return <div className="text-center">Loading tickets...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        Error loading tickets: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tickets</h1>
      
      <div className="grid gap-4">
        {tickets?.map((ticket) => (
          <div
            key={ticket.id}
            className="p-4 rounded-lg border bg-card text-card-foreground"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{ticket.subject}</h2>
              <span className="text-sm text-muted-foreground">
                {new Date(ticket.date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">From:</span> {ticket.from}
              </div>
              {ticket.to && (
                <div className="text-sm">
                  <span className="font-medium">To:</span> {ticket.to}
                </div>
              )}
              <div 
                className="text-sm mt-2 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: ticket.content }}
              />
            </div>

            <div className="mt-4 flex gap-2 text-sm">
              <span className={`px-2 py-1 rounded-full ${
                ticket.status === 2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {ticket.status === 2 ? 'Completed' : 'Pending'}
              </span>
              {ticket.shouldBeAnswered && (
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Needs Response
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={!tickets || tickets.length < amount}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
