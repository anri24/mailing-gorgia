import { useState, useEffect } from "react";
import { useTickets, useReplyToTicket } from "@/queries/api/tickets";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
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
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";

type FilterStatus = "all" | "needsReplyUrgent" | "needsReply" | "answered";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const MAX_PAGES_SHOWN = 5;

const getStatusValue = (filterStatus: FilterStatus): number => {
  switch (filterStatus) {
    case "needsReplyUrgent":
      return 3; // status 1 & shouldBeAnswered true
    case "answered":
      return 2; // status 2 & shouldBeAnswered false
    case "needsReply":
      return 1; // status 1 & shouldBeAnswered false
    case "all":
    default:
      return 4; // all tickets
  }
};

// Separate the tickets list into its own component to prevent re-renders of the entire page
const TicketsList = ({
  tickets,
  replyContents,
  setReplyContents,
  replyingTickets,
  handleReply,
}: {
  tickets: Ticket[];
  replyContents: Record<number, string>;
  setReplyContents: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  replyingTickets: Record<number, boolean>;
  handleReply: (ticketId: number) => Promise<void>;
}) => {
  if (!tickets?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        წერილები არ მოიძებნა
      </div>
    );
  }

  return (
    <>
      {tickets.map((ticket) => (
        <div key={ticket.id} className="max-w-[900px] mx-auto w-full">
          <TicketCard
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
        </div>
      ))}
    </>
  );
};

export const Dashboard = () => {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] =
    useState<(typeof ITEMS_PER_PAGE_OPTIONS)[number]>(10);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [emailInput, setEmailInput] = useState("");
  const debouncedEmail = useDebounce(emailInput, 300);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [replyContents, setReplyContents] = useState<Record<number, string>>(
    {}
  );
  const [replyingTickets, setReplyingTickets] = useState<
    Record<number, boolean>
  >({});

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedEmail, fromDate, toDate, filterStatus, itemsPerPage]);

  const {
    data: ticketsData,
    isLoading,
    error,
    isFetching,
  } = useTickets(
    page,
    itemsPerPage,
    fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
    toDate ? format(toDate, "yyyy-MM-dd'T'23:59:59") : undefined,
    debouncedEmail || undefined,
    getStatusValue(filterStatus)
  );

  const tickets = ticketsData?.tickets ?? [];
  const totalItems = ticketsData?.totalItems ?? 0;

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
    const ticketStatus = getTicketStatus(ticket);
    return filterStatus === "all" || ticketStatus === filterStatus;
  });

  const urgentTicketsCount =
    displayedTickets?.filter(
      (ticket) => ticket.status === 1 && ticket.shouldBeAnswered
    ).length || 0;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
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
    <div className="container mx-auto max-w-[1200px] px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">წერილები</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            სულ: {totalItems}
          </Badge>
          <Badge variant="outline" className="text-sm">
            გვერდზე: {displayedTickets?.length || 0}
          </Badge>
          {urgentTicketsCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              პასუხის მოლოდინში (24სთ): {urgentTicketsCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ძებნა გამომგზავნის მიხედვით..."
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fromDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? (
                  format(fromDate, "dd/MM/yyyy", { locale: ka })
                ) : (
                  <span>თარიღიდან...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={setFromDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {fromDate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFromDate(undefined)}
              className="h-10 w-10 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !toDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {toDate ? (
                  format(toDate, "dd/MM/yyyy", { locale: ka })
                ) : (
                  <span>თარიღამდე...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                initialFocus
                disabled={(date) => (fromDate ? date < fromDate : false)}
              />
            </PopoverContent>
          </Popover>
          {toDate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setToDate(undefined)}
              className="h-10 w-10 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select
          value={filterStatus}
          onValueChange={(value: FilterStatus) => setFilterStatus(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="სტატუსი ფილტრი" />
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

        <div className="sm:col-span-2 lg:col-span-4">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value) as typeof itemsPerPage);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="გვერდის ზომა" />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} ჩანაწერი
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {displayedTickets?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emailInput || fromDate || toDate
              ? "ასეთი წერილები არ მოიძებნა"
              : filterStatus === "needsReplyUrgent"
                ? "პასუხის მოლოდინში (წარუდგინებული) მყოფი წერილები არ არის"
                : filterStatus === "needsReply"
                  ? "პასუხის მოლოდინში მყოფი წერილები არ არის"
                  : filterStatus === "answered"
                    ? "პასუხგაცემული წერილები არ არის"
                    : "წერილები არ მოიძებნა"}
          </div>
        ) : (
          <TicketsList
            tickets={displayedTickets}
            replyContents={replyContents}
            setReplyContents={setReplyContents}
            replyingTickets={replyingTickets}
            handleReply={handleReply}
          />
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
