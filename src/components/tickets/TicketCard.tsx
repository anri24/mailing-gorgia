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
  Clock,
  CheckCircle2,
  MessageCircle,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  ticket: Ticket;
  replyContent: string;
  onReplyChange: (content: string) => void;
  onReply: () => void;
  isReplying: boolean;
}

const getProviderIcon = (email: string): string => {
  const domain = email.split("@")[1]?.toLowerCase();

  switch (domain) {
    case "gmail.com":
      return "text-red-500 dark:text-red-400";
    case "gorgia.ge":
      return "text-blue-500 dark:text-blue-400";
    case "yahoo.com":
      return "text-purple-500 dark:text-purple-400";
    case "outlook.com":
    case "hotmail.com":
      return "text-cyan-500 dark:text-cyan-400";
    case "icloud.com":
      return "text-sky-500 dark:text-sky-400";
    default:
      return "text-muted-foreground";
  }
};

const getStatusColor = (status: number) => {
  switch (status) {
    case 0:
      return "bg-secondary text-secondary-foreground";
    case 1:
      return "bg-primary text-primary-foreground";
    case 2:
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const getStatusText = (status: number) => {
  switch (status) {
    case 0:
      return "უცნობი";
    case 1:
      return "მიმდინარე";
    case 2:
      return "დასრულებული";
    default:
      return "უცნობი";
  }
};

export const TicketCard: FC<TicketCardProps> = ({
  ticket,
  replyContent,
  onReplyChange,
  onReply,
  isReplying,
}) => {
  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-md",
        getProviderIcon(ticket.from)
      )}
    >
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0">
            <Mail
              className={cn(
                "h-4 w-4 shrink-0 mr-2",
                getProviderIcon(ticket.from)
              )}
            />
            <span className="text-sm font-medium truncate">{ticket.from}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 h-5",
                getStatusColor(ticket.status)
              )}
            >
              {ticket.status === 2 ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              {getStatusText(ticket.status)}
            </Badge>
            {ticket.shouldBeAnswered && (
              <Badge variant="secondary" className="text-xs px-1.5 h-5">
                <MessageCircle className="w-3 h-3 mr-1" />
                პასუხის გაცემა
              </Badge>
            )}
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
        <div className="rounded border bg-muted/30 p-3">
          <div
            className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: ticket.content }}
          />
        </div>

        {ticket.ticketAnswer && (
          <div className="rounded border border-primary/10 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-xs">პასუხი</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {ticket.ticketAnswer}
            </div>
          </div>
        )}

        {!ticket.ticketAnswer && ticket.shouldBeAnswered && (
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
                className="min-h-[80px] text-sm resize-none"
              />
              <Button
                size="icon"
                disabled={isReplying}
                onClick={onReply}
                className="h-[80px] w-9"
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
