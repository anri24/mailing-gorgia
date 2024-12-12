import { useState } from "react";
import { useTickets, useReplyToTicket } from "@/queries/api/tickets";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/tickets/TicketCard";
import { Ticket } from "@/queries/api/query-slice";

type FilterStatus = "all" | "needsAnswer" | "answered" | "noReplyNeeded";

export const Dashboard = () => {
  const [page, setPage] = useState(1);
  const [amount] = useState(20);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyContents, setReplyContents] = useState<Record<number, string>>(
    {}
  );
  const [replyingTickets, setReplyingTickets] = useState<
    Record<number, boolean>
  >({});

  const { data: tickets, isLoading, error } = useTickets(page, amount);
  const replyMutation = useReplyToTicket();

  const handleReply = async (ticketId: number) => {
    const content = replyContents[ticketId];
    if (!content?.trim()) {
      toast.error("გთხოვთ შეიყვანოთ პასუხი");
      return;
    }

    try {
      setReplyingTickets((prev) => ({ ...prev, [ticketId]: true }));
      await replyMutation.mutateAsync({ id: ticketId, content });
      setReplyContents((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    } catch (error) {
      console.error("Reply error:", error);
    } finally {
      setReplyingTickets((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const getTicketStatus = (ticket: Ticket) => {
    if (ticket.status === 2) return "answered";
    if (ticket.status === 1 && !ticket.shouldBeAnswered) return "noReplyNeeded";
    return "needsAnswer";
  };

  const displayedTickets = tickets?.filter((ticket) => {
    const matchesSearch =
      !searchQuery ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.from.toLowerCase().includes(searchQuery.toLowerCase());

    const ticketStatus = getTicketStatus(ticket);
    const matchesStatus =
      filterStatus === "all" || ticketStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted rounded-lg h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-destructive">
        <span>
          ბილეთების ჩატვირთვის დროს დაფიქსირდა შეცდომა: {error.message}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">წერილები</h1>
        <Badge variant="outline" className="text-sm">
          სულ: {displayedTickets?.length || 0}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ძებნა სათაურის ან გამომგზავნის მიხედვით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(value: FilterStatus) => setFilterStatus(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="სტატუსის ფილტრი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა</SelectItem>
            <SelectItem value="needsAnswer">პასუხის მოლოდინში</SelectItem>
            <SelectItem value="answered">პასუხგაცემული</SelectItem>
            <SelectItem value="noReplyNeeded">პასუხს არ საჭიროებს</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {displayedTickets?.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            replyContent={replyContents[ticket.id] || ""}
            onReplyChange={(content) =>
              setReplyContents((prev) => ({
                ...prev,
                [ticket.id]: content,
              }))
            }
            onReply={() => handleReply(ticket.id)}
            isReplying={replyingTickets[ticket.id] || false}
          />
        ))}

        {displayedTickets?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? "ასეთი წერილები არ მოიძებნა"
              : filterStatus === "needsAnswer"
                ? "პასუხის მოლოდინში მყოფი წერილები არ არის"
                : filterStatus === "answered"
                  ? "პასუხგაცემული წერილები არ არის"
                  : filterStatus === "noReplyNeeded"
                    ? "წერილები, რომლებიც არ საჭიროებენ პასუხს, არ არის"
                    : "წერილები არ მოიძებნა"}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          წინა
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-2 py-1">
            გვერდი {page}
          </Badge>
          {displayedTickets && displayedTickets.length >= amount && (
            <Badge variant="outline" className="text-sm px-2 py-1">
              შემდეგ გვერდზე გადასვლა ხელმისაწვდომია
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!displayedTickets || displayedTickets.length < amount}
          className="gap-1"
        >
          შემდეგი
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
