import { useState, useMemo } from "react";
import { useTickets, useReplyToTicket } from "@/queries/api/tickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ReplyTicketSchema,
  type ReplyTicketType,
} from "@/queries/api/query-slice";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Calendar,
  User,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Reply,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const getProviderStyles = (email: string): string => {
  const domain = email.split("@")[1]?.toLowerCase();

  switch (domain) {
    case "gmail.com":
      return "border border-red-500/20 hover:border-red-500/40";
    case "gorgia.ge":
      return "border border-blue-500/20 hover:border-blue-500/40";
    case "yahoo.com":
      return "border border-purple-500/20 hover:border-purple-500/40";
    case "outlook.com":
    case "hotmail.com":
      return "border border-cyan-500/20 hover:border-cyan-500/40";
    case "icloud.com":
      return "border border-sky-500/20 hover:border-sky-500/40";
    default:
      return "border border-muted-foreground/20 hover:border-foreground/40";
  }
};

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
    case 2:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case 1:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

const getStatusText = (status: number) => {
  switch (status) {
    case 2:
      return "დასრულებული";
    case 1:
      return "მიმდინარე";
    default:
      return "უცნობი";
  }
};

const Dashboard = () => {
  const [page, setPage] = useState(1);
  const [amount] = useState(20);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [showAnsweredTickets, setShowAnsweredTickets] = useState(false);

  const { data: tickets, isLoading, error } = useTickets(page, amount);
  const replyMutation = useReplyToTicket();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyTicketType>({
    resolver: zodResolver(ReplyTicketSchema),
  });

  const onSubmitReply = async (data: ReplyTicketType) => {
    try {
      await replyMutation.mutateAsync({
        id: replyingToId!,
        content: data.content,
      });
      setReplyingToId(null);
      reset();
    } catch (error) {
      console.error("Failed to submit reply:", error);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets?.filter((ticket) => {
      const matchesSearchQuery =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.from.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === null || ticket.status === filterStatus;

      return matchesSearchQuery && matchesStatus;
    });
  }, [tickets, searchQuery, filterStatus]);

  const displayedTickets = useMemo(() => {
    if (showAnsweredTickets) {
      return filteredTickets;
    }
    return filteredTickets?.filter(
      (ticket) => ticket.shouldBeAnswered && ticket.status === 1
    );
  }, [filteredTickets, showAnsweredTickets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-destructive">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>
          ბილეთების ჩატვირთვის დროს დაფიქსირდა შეცდომა: {error.message}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold tracking-tight">
          პასუხგაუცემელი წერილები
        </h1>
        <Badge variant="outline" className="text-xs">
          სულ: {displayedTickets?.length || 0}
        </Badge>
      </div>

      {/* Filtering and Search Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="ძებნა სათაურის ან გამომგზავნის მიხედვით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 pr-2 text-sm"
          />
        </div>
        <Select
          onValueChange={(value) =>
            setFilterStatus(value === "null" ? null : parseInt(value))
          }
        >
          <SelectTrigger className="w-40 text-sm">
            <SelectValue placeholder="სტატუსის ფილტრი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">ყველა</SelectItem>
            <SelectItem value="0">უცნობი</SelectItem>
            <SelectItem value="1">მიმდინარე</SelectItem>
            <SelectItem value="2">დასრულებული</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-1.5">
          <Switch
            id="show-answered"
            checked={showAnsweredTickets}
            onCheckedChange={setShowAnsweredTickets}
          />
          <Label htmlFor="show-answered" className="text-sm">
            გაცემული პასუხების ჩვენება
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        {/* Display a message when there are no unanswered tickets after filtering */}
        {displayedTickets?.length === 0 && (
          <Card className="p-3">
            <CardHeader className="p-2">
              <CardTitle className="text-base">
                {searchQuery || filterStatus !== null
                  ? "ასეთი წერილები არ მოიძებნა"
                  : showAnsweredTickets
                    ? "წერილები არ მოიძებნა"
                    : "ყველა წერილს გაეცა პასუხი"}
              </CardTitle>
              <CardDescription className="text-xs">
                {searchQuery || filterStatus !== null
                  ? "არ მოიძებნა წერილები მითითებული კრიტერიუმებით."
                  : showAnsweredTickets
                    ? "სისტემაში წერილები არ არის."
                    : "ამჟამად არ არის პასუხგაუცემელი წერილები."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {displayedTickets?.map((ticket) => (
          <Card
            key={ticket.id}
            className={cn(
              "transition-all duration-300 p-3",
              getProviderStyles(ticket.from),
              replyingToId === ticket.id && "ring-2 ring-primary"
            )}
          >
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Mail className={cn("w-4 h-4", getProviderIcon(ticket.from))} />
                <CardTitle className="text-sm font-medium">
                  {ticket.subject}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(ticket.date).toLocaleDateString()}
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {new Date(ticket.date).toLocaleString()}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    getStatusColor(ticket.status)
                  )}
                >
                  {ticket.status === 2 ? (
                    <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1 inline" />
                  )}
                  {getStatusText(ticket.status)}
                </Badge>
                {ticket.shouldBeAnswered && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-0.5 rounded flex items-center space-x-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>ჭირდა პასუხი</span>
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="py-1">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <User className="w-3 h-3 mr-1" />
                  <span className="font-medium">გამომგზავნი:</span>
                  <span className="ml-0.5">{ticket.from}</span>
                </div>
                {ticket.to && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Send className="w-3 h-3 mr-1" />
                    <span className="font-medium">მიმღები:</span>
                    <span className="ml-0.5">{ticket.to}</span>
                  </div>
                )}
              </div>

              <div className="mt-2 rounded border border-muted-foreground/20 bg-muted/10 p-2">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  წერილი
                </div>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert mt-1 text-xs"
                  dangerouslySetInnerHTML={{ __html: ticket.content }}
                />
              </div>

              {ticket.status === 2 && (
                <div className="mt-2 rounded border border-primary/20 bg-primary/5 p-2">
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Reply className="w-3 h-3" />
                    პასუხი
                  </div>
                  <div className="text-xs text-muted-foreground">
                    პასუხის გრაფა გვაკლია
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-1">
              {replyingToId === ticket.id ? (
                <form
                  onSubmit={handleSubmit(onSubmitReply)}
                  className="w-full flex flex-col space-y-2"
                >
                  <div className="rounded border border-muted-foreground/20 bg-card p-2">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Reply className="w-3 h-3" />
                      თქვენი პასუხი
                    </div>
                    <Textarea
                      {...register("content")}
                      placeholder="შეიყვანეთ პასუხი..."
                      className={cn(
                        "min-h-[80px] resize-none bg-background text-xs",
                        errors.content && "border-destructive"
                      )}
                    />
                    {errors.content && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.content.message}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={replyMutation.isPending}
                      size="sm"
                      className="gap-1"
                    >
                      {replyMutation.isPending && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      {replyMutation.isPending ? "იგზავნება..." : "გაგზავნა"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setReplyingToId(null);
                        reset();
                      }}
                      size="sm"
                      className="gap-1"
                    >
                      <X className="w-3 h-3" />
                      გაუქმება
                    </Button>
                  </div>
                </form>
              ) : (
                ticket.status !== 2 && (
                  <Button
                    onClick={() => setReplyingToId(ticket.id)}
                    size="sm"
                    className="gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    უპასუხო
                  </Button>
                )
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center mt-2">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="gap-1"
          size="sm"
        >
          <ChevronLeft className="w-3 h-3" />
          წინა
        </Button>
        <Badge variant="secondary" className="text-xs">
          გვერდი {page}
        </Badge>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!displayedTickets || displayedTickets.length < amount}
          className="gap-1"
          size="sm"
        >
          შემდეგი
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
