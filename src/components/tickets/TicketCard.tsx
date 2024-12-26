import { FC, useState, useRef, useLayoutEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileImage,
  FileVideo,
  FileCog,
  FileSpreadsheet,
  FileText,
  FileChartColumn,
  File,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TicketCardProps {
  ticket: Ticket;
  replyContent: string;
  onReplyChange: (content: string) => void;
  onReply: (files?: File[]) => void;
  isReplying: boolean;
}

const getTicketStatus = (ticket: Ticket): "needsReply" | "replied" => {
  if (ticket.status === 2) return "replied";
  if (ticket.status === 1) return "needsReply";
  throw new Error(`Unhandled ticket status: ${ticket.status}`);
};

const getCardStyle = (ticket: Ticket) => {
  const status = getTicketStatus(ticket);
  switch (status) {
    case "replied":
      return "bg-gorgia-dark-blue/5 hover:bg-gorgia-dark-blue/10 border-gorgia-dark-blue/10";
    case "needsReply":
      return ticket.shouldBeAnswered
        ? "bg-red-50/50 hover:bg-red-50/80 border-red-100"
        : "bg-gorgia-dark-blue/5 hover:bg-gorgia-dark-blue/10 border-gorgia-dark-blue/10";
    default:
      return "";
  }
};

const getStatusBadge = (ticket: Ticket) => {
  const status = getTicketStatus(ticket);
  switch (status) {
    case "replied":
      return {
        variant: "outline" as const,
        text: "პასუხგაცემული",
        className: "bg-lime-500/10 text-lime-500 border-lime-500/20",
      };
    case "needsReply":
      return {
        variant: "outline" as const,
        text: "პასუხის მოლოდინში",
        className: "bg-red-100 text-red-700 border-red-200",
      };
  }
};

const handleDownload = async (fileName: string) => {
  try {
    const token = localStorage.getItem("token");
    const cleanFileName = fileName.replace(/^cid:/, "");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/Attachment?fileName=${encodeURIComponent(cleanFileName)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};

const getFileIcon = (fileName: string) => {
  const extension = fileName.toLowerCase().split(".").pop() || "";

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
    return <FileImage className="h-4 w-4" />;
  }

  if (["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(extension)) {
    return <FileVideo className="h-4 w-4" />;
  }

  if (extension === "pdf") {
    return <FileCog className="h-4 w-4" />;
  }

  if (["xlsx", "xls", "csv"].includes(extension)) {
    return <FileSpreadsheet className="h-4 w-4" />;
  }

  if (["doc", "docx", "rtf"].includes(extension)) {
    return <FileText className="h-4 w-4" />;
  }

  if (["ppt", "pptx"].includes(extension)) {
    return <FileChartColumn className="h-4 w-4" />;
  }

  return <File className="h-4 w-4" />;
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
  const [canExpand, setCanExpand] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const MAX_HEIGHT = 150;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useLayoutEffect(() => {
    const contentEl = contentRef.current;
    if (contentEl) {
      setCanExpand(contentEl.scrollHeight > MAX_HEIGHT);
    }
  }, [ticket.content]);

  return (
    <Card
      className={cn("transition-all duration-300 w-full", getCardStyle(ticket))}
    >
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
        {ticket.content && (
          <div className="rounded border bg-white p-3 overflow-hidden">
            {canExpand ? (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-center text-sm mb-2 w-full"
                  >
                    {isExpanded ? (
                      <>
                        ნაკლების ხილვა{" "}
                        <ChevronUp className="ml-1 h-4 w-4 transition-transform duration-300" />
                      </>
                    ) : (
                      <>
                        მეტის ხილვა{" "}
                        <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-300" />
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [& img]:max-w-full [& img]:h-auto transition-all duration-300"
                    dangerouslySetInnerHTML={{ __html: ticket.content }}
                  />
                </CollapsibleContent>
                {!isExpanded && (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [& img]:max-w-full [& img]:h-auto max-h-[150px] overflow-hidden"
                    ref={contentRef}
                    dangerouslySetInnerHTML={{ __html: ticket.content }}
                  />
                )}
              </Collapsible>
            ) : (
              <div
                ref={contentRef}
                className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [& img]:max-w-full [& img]:h-auto"
                dangerouslySetInnerHTML={{ __html: ticket.content }}
              />
            )}
          </div>
        )}

        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="rounded border bg-white p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Paperclip className="h-3.5 w-3.5 text-gorgia-dark-blue" />
              <span className="font-medium text-xs text-gorgia-dark-blue">
                დანართები
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ticket.attachments.map((fileName, index) => {
                const displayName = fileName.replace(/^cid:/, "");
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-2 max-w-full"
                    onClick={() => handleDownload(fileName)}
                  >
                    {getFileIcon(displayName)}
                    <span className="truncate max-w-[200px]">
                      {displayName}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {ticket.ticketAnswer && (
          <div className="rounded border border-gorgia-dark-blue/10 bg-gorgia-dark-blue/5 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-gorgia-dark-blue" />
              <span className="font-medium text-xs text-gorgia-dark-blue">
                პასუხი
              </span>
            </div>
            <div className="text-sm text-muted-foreground break-words">
              {ticket.ticketAnswer.replace(/<br><br>.*/, "")}
            </div>
          </div>
        )}

        {status === "needsReply" && (
          <div className="space-y-2">
            <Label
              htmlFor={`reply-${ticket.id}`}
              className="text-xs font-medium"
            >
              პასუხის გაცემა
            </Label>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Textarea
                    id={`reply-${ticket.id}`}
                    placeholder="შეიყვანეთ პასუხი..."
                    value={replyContent}
                    onChange={(e) => onReplyChange(e.target.value)}
                    className="min-h-[80px] text-sm resize-none bg-white"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      id={`file-upload-${ticket.id}`}
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSelectedFiles(files);
                      }}
                    />
                    <label
                      htmlFor={`file-upload-${ticket.id}`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground cursor-pointer rounded border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      დანართის დამატება
                    </label>
                    {selectedFiles.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {selectedFiles.length} ფაილი არჩეული
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  disabled={isReplying}
                  onClick={() => onReply(selectedFiles)}
                  className="h-[80px] w-full sm:w-[80px] bg-gorgia-dark-blue hover:bg-gorgia-dark-blue/90"
                >
                  {isReplying ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-1.5 rounded-md border bg-muted/50 p-2">
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">დანართები</span>
                  </div>
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-sm bg-background p-1.5"
                      >
                        {getFileIcon(file.name)}
                        <span className="flex-1 truncate text-xs">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            setSelectedFiles((files) =>
                              files.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
