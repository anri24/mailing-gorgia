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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/tickets/TicketCard";

export const Dashboard = () => {
  const [page, setPage] = useState(1);
  const [amount] = useState(20);
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [showAnsweredTickets, setShowAnsweredTickets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyContents, setReplyContents] = useState<Record<number, string>>({});
  const [replyingTickets, setReplyingTickets] = useState<Record<number, boolean>>({});

  const { data: tickets, isLoading, error } = useTickets(page, amount);
  const replyMutation = useReplyToTicket();

  const handleReply = async (ticketId: number) => {
    const content = replyContents[ticketId];
    if (!content?.trim()) {
      toast.error("გთხოვთ შეიყვანოთ პასუხი");
      return;
    }

    try {
      setReplyingTickets(prev => ({ ...prev, [ticketId]: true }));
      await replyMutation.mutateAsync({ id: ticketId, content });
      // Clear the reply content on success
      setReplyContents((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    } catch (error) {
      console.error("Reply error:", error);
    } finally {
      setReplyingTickets(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  // Filter tickets based on search query and status
  const displayedTickets = tickets?.filter((ticket) => {
    const matchesSearch =
      !searchQuery ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.from.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === null || ticket.status === filterStatus;

    const matchesAnswered =
      showAnsweredTickets || !ticket.ticketAnswer;

    return matchesSearch && matchesStatus && matchesAnswered;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-muted rounded-lg h-[200px] w-full"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-destructive">
        <span>ბილეთების ჩატვირთვის დროს დაფიქსირდა შეცდომა: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          პასუხგაუცემელი წერილები
        </h1>
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
          value={filterStatus?.toString() ?? "null"}
          onValueChange={(value) =>
            setFilterStatus(value === "null" ? null : parseInt(value))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="სტატუსის ფი��ტრი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">ყველა</SelectItem>
            <SelectItem value="0">უცნობი</SelectItem>
            <SelectItem value="1">მიმდინარე</SelectItem>
            <SelectItem value="2">დასრულებული</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-answered"
            checked={showAnsweredTickets}
            onCheckedChange={setShowAnsweredTickets}
          />
          <Label htmlFor="show-answered">გაცემული პასუხების ჩვენება</Label>
        </div>
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
            {searchQuery || filterStatus !== null
              ? "ასეთი წერილები არ მოიძებნა"
              : showAnsweredTickets
              ? "წერილები არ მოიძებნა"
              : "ყველა წერილს გაეცა პასუხი"}
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
