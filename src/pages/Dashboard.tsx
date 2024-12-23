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
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "needsReplyUrgent" | "needsReply" | "answered";

const ITEMS_PER_PAGE = 10;
const MAX_PAGES_SHOWN = 5;

export const Dashboard = () => {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyContents, setReplyContents] = useState<Record<number, string>>(
    {}
  );
  const [replyingTickets, setReplyingTickets] = useState<
    Record<number, boolean>
  >({});

  const {
    data: tickets,
    isLoading,
    error,
    isFetching,
  } = useTickets(page, ITEMS_PER_PAGE);

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
      toast.success("პასუხი წარმატებით გაიგზავნა!");
    } catch (error: unknown) {
      console.error("Reply error:", error);
      toast.error("პასუხის გაგზავნა შეუშერხდა.");
    } finally {
      setReplyingTickets((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const getTicketStatus = (
    ticket: Ticket
  ): "needsReplyUrgent" | "needsReply" | "answered" => {
    if (ticket.status === 2) return "answered";
    if (ticket.status === 1)
      return ticket.shouldBeAnswered ? "needsReplyUrgent" : "needsReply";
    throw new Error(`Unhandled ticket status: ${ticket.status}`);
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

  const urgentTicketsCount =
    displayedTickets?.filter(
      (ticket) => ticket.status === 1 && ticket.shouldBeAnswered
    ).length || 0;

  // Calculate pagination
  const totalPages = Math.ceil((tickets?.length || 0) / ITEMS_PER_PAGE);
  const showPagination = totalPages > 1;

  const getPaginationRange = () => {
    const range: (number | string)[] = [];
    const showLeftDots = page > 3;
    const showRightDots = page < totalPages - 2;

    if (totalPages <= MAX_PAGES_SHOWN) {
      range.push(...Array.from({ length: totalPages }, (_, i) => i + 1));
    } else {
      if (!showLeftDots && showRightDots) {
        range.push(
          ...Array.from({ length: MAX_PAGES_SHOWN - 1 }, (_, i) => i + 1),
          "...",
          totalPages
        );
      } else if (showLeftDots && !showRightDots) {
        range.push(
          1,
          "...",
          ...Array.from(
            { length: MAX_PAGES_SHOWN - 1 },
            (_, i) => totalPages - (MAX_PAGES_SHOWN - 2) + i
          )
        );
      } else {
        range.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return range;
  };

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
        <div className="flex space-x-2">
          <Badge variant="outline" className="text-sm">
            სულ: {displayedTickets?.length || 0}
          </Badge>
          {urgentTicketsCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              პასუხის მოლოდინში (24სთ): {urgentTicketsCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ძებნა სათაურის ან გამომგზავნის მიხედვით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            aria-label="ძებნა სათაურის ან გამომგზავნის მიხედვით"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(value: FilterStatus) => setFilterStatus(value)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="სტატუსის ფილტრი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა</SelectItem>
            <SelectItem value="needsReplyUrgent">
              პასუხის მოლოდინში (24სთ)
            </SelectItem>
            <SelectItem value="needsReply">პასუხის მოლოდინში</SelectItem>
            <SelectItem value="answered">პასუხგაცემული</SelectItem>
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
              : filterStatus === "needsReplyUrgent"
                ? "პასუხის მოლოდინში (წარუდგინებული) მყოფი წერილები არ არის"
                : filterStatus === "needsReply"
                  ? "პასუხის მოლოდინში მყოფი წერილები არ არის"
                  : filterStatus === "answered"
                    ? "პასუხგაცემული წერილები არ არის"
                    : "წერილები არ მოიძებნა"}
          </div>
        )}
      </div>

      {showPagination && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            წინა
          </Button>

          <div className="flex items-center gap-2">
            {getPaginationRange().map((pageNum, idx) =>
              pageNum === "..." ? (
                <span key={`dots-${idx}`} className="text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(Number(pageNum))}
                  disabled={isFetching}
                  className={cn(
                    "min-w-[32px] px-2",
                    pageNum === page &&
                      "bg-gorgia-dark-blue hover:bg-gorgia-dark-blue/90"
                  )}
                >
                  {pageNum}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages || isFetching}
            className="gap-1"
          >
            შემდეგი
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
