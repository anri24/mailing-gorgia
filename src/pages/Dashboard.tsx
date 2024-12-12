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
      return "border-2 border-red-500/30 hover:border-red-500/50";
    case "gorgia.ge":
      return "border-2 border-blue-500/30 hover:border-blue-500/50";
    case "yahoo.com":
      return "border-2 border-purple-500/30 hover:border-purple-500/50";
    case "outlook.com":
    case "hotmail.com":
      return "border-2 border-cyan-500/30 hover:border-cyan-500/50";
    case "icloud.com":
      return "border-2 border-sky-500/30 hover:border-sky-500/50";
    default:
      return "border hover:border-foreground/50";
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

  // Filter tickets based on search query and status
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

  // Filter tickets that need a reply based on the filtered results
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-destructive">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>
          ბილეთების ჩატვირთვის დროს დაფიქსირდა შეცდომა: {error.message}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          პასუხგაუცემელი წერილები
        </h1>
        <Badge variant="outline" className="text-sm">
          სულ: {displayedTickets?.length || 0}
        </Badge>
      </div>

      {/* Filtering and Search Controls */}
      <div className="flex items-center gap-4">
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
          onValueChange={(value) =>
            setFilterStatus(value === "null" ? null : parseInt(value))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="სტატუსის ფილტრი" />
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

      <div className="grid gap-3">
        {/* Display a message when there are no unanswered tickets after filtering */}
        {displayedTickets?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {searchQuery || filterStatus !== null
                  ? "ასეთი წერილები არ მოიძებნა"
                  : showAnsweredTickets
                    ? "წერილები არ მოიძებნა"
                    : "ყველა წერილს გაეცა პასუხი"}
              </CardTitle>
              <CardDescription>
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
              "transition-all duration-300",
              getProviderStyles(ticket.from),
              replyingToId === ticket.id && "ring-2 ring-primary"
            )}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 px-4 py-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail
                    className={cn("w-5 h-5", getProviderIcon(ticket.from))}
                  />
                  {ticket.subject}
                </CardTitle>
                <CardDescription className="mt-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(ticket.date).toLocaleDateString()}
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(ticket.date).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "transition-colors",
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
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    ჭირდება პასუხის გაცემა
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 px-4 py-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-4 h-4 mr-1.5" />
                  <span className="font-medium">გამომგზავნი:</span>
                  <span className="ml-1">{ticket.from}</span>
                </div>
                {ticket.to && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Send className="w-4 h-4 mr-1.5" />
                    <span className="font-medium">მიმღები:</span>
                    <span className="ml-1">{ticket.to}</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-1.5 text-sm font-medium text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  წერილი
                </div>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: ticket.content }}
                />
              </div>

              {ticket.status === 2 && (
                <div className="rounded-lg border bg-primary/5 p-3">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                    <Reply className="w-4 h-4" />
                    პასუხი
                  </div>
                  <div className="text-sm text-muted-foreground">
                    პასუხის გრაფა გვაკლია
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 px-4 py-3">
              {replyingToId === ticket.id ? (
                <form
                  onSubmit={handleSubmit(onSubmitReply)}
                  className="w-full space-y-4"
                >
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <Reply className="w-4 h-4" />
                      თქვენი პასუხი
                    </div>
                    <Textarea
                      {...register("content")}
                      placeholder="შეიყვანეთ პასუხი..."
                      className={cn(
                        "min-h-[100px] resize-none bg-background",
                        errors.content && "border-destructive"
                      )}
                    />
                    {errors.content && (
                      <p className="text-sm text-destructive mt-1.5">
                        {errors.content.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={replyMutation.isPending}
                      className="gap-2"
                    >
                      {replyMutation.isPending && (
                        <Loader2 className="w-4 h-4 animate-spin" />
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
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      გაუქმება
                    </Button>
                  </div>
                </form>
              ) : (
                ticket.status !== 2 && (
                  <Button
                    onClick={() => setReplyingToId(ticket.id)}
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    პასუხი
                  </Button>
                )
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          წინა
        </Button>
        <Badge variant="secondary">გვერდი {page}</Badge>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!displayedTickets || displayedTickets.length < amount}
          className="gap-2"
        >
          შემდეგი
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
