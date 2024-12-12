import { FC } from "react";
import { Ticket } from "@/queries/api/query-slice";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Send,
  Loader2,
  Calendar,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  ticket: Ticket;
  replyContent: string;
  onReplyChange: (content: string) => void;
  onReply: () => void;
  isReplying: boolean;
}

const getTicketStatus = (ticket: Ticket) => {
  if (ticket.status === 2) return "answered";
  if (ticket.status === 1 && !ticket.shouldBeAnswered) return "noReplyNeeded";
  return "needsAnswer";
};

const getCardStyle = (ticket: Ticket) => {
  const status = getTicketStatus(ticket);
  switch (status) {
    case "answered":
    case "noReplyNeeded":
      return "bg-gorgia-dark-blue/5 hover:bg-gorgia-dark-blue/10 border-gorgia-dark-blue/10";
    case "needsAnswer":
      return "bg-amber-50/50 hover:bg-amber-50/80 border-amber-100";
    default:
      return "";
  }
};

const getStatusBadge = (ticket: Ticket) => {
  const status = getTicketStatus(ticket);
  switch (status) {
    case "answered":
      return {
        variant: "outline" as const,
        text: "პასუხგაცემული",
        className:
          "bg-gorgia-dark-blue/10 text-gorgia-dark-blue border-gorgia-dark-blue/20",
      };
    case "noReplyNeeded":
      return {
        variant: "outline" as const,
        text: "პასუხი არ საჭიროებს",
        className:
          "bg-gorgia-dark-blue/10 text-gorgia-dark-blue border-gorgia-dark-blue/20",
      };
    case "needsAnswer":
      return {
        variant: "outline" as const,
        text: "პასუხის მოლოდინში",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
  }
};

export const TicketCard: FC<TicketCardProps> = ({
  ticket,
  replyContent,
  onReplyChange,
  onReply,
  isReplying,
}) => {
  const status = getTicketStatus(ticket);
  const statusBadge = getStatusBadge(ticket);

  return (
    <Card className={cn("transition-all duration-300", getCardStyle(ticket))}>
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0">
            <Mail className="h-4 w-4 shrink-0 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{ticket.from}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={statusBadge.variant}
              className={cn("text-xs px-1.5 h-5", statusBadge.className)}
            >
              {statusBadge.text}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(ticket.date).toLocaleString("ka-GE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
        <div className="font-medium text-sm">{ticket.subject}</div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        <div className="rounded border bg-white p-3">
          <div
            className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: ticket.content }}
          />
        </div>

        {ticket.ticketAnswer && (
          <div className="rounded border border-gorgia-dark-blue/10 bg-gorgia-dark-blue/5 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-gorgia-dark-blue" />
              <span className="font-medium text-xs text-gorgia-dark-blue">
                პასუხი
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {ticket.ticketAnswer.replace(/<br><br>.*/, "")}
            </div>
          </div>
        )}

        {status === "noReplyNeeded" && !ticket.ticketAnswer && (
          <div className="rounded border border-gorgia-dark-blue/10 bg-gorgia-dark-blue/5 p-3">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-gorgia-dark-blue" />
              <span className="text-xs text-gorgia-dark-blue">
                არ საჭიროებს პასუხის გაცემას
              </span>
            </div>
          </div>
        )}

        {status === "needsAnswer" && (
          <div className="space-y-2">
            <Label
              htmlFor={`reply-${ticket.id}`}
              className="text-xs font-medium"
            >
              პასუხის გაცემა
            </Label>
            <div className="flex gap-2">
              <Textarea
                id={`reply-${ticket.id}`}
                placeholder="შეიყვანეთ პასუხი..."
                value={replyContent}
                onChange={(e) => onReplyChange(e.target.value)}
                className="min-h-[80px] text-sm resize-none bg-white"
              />
              <Button
                size="icon"
                disabled={isReplying}
                onClick={onReply}
                className="h-[80px] w-9 bg-gorgia-dark-blue hover:bg-gorgia-dark-blue/90"
              >
                {isReplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
