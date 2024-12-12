import { z } from "zod";
import { api } from "@/api/helper";
import {
  SignInAPIResponseSchema,
  SignInFormSchema,
} from "@/schemas/signInSchema";

const SignInRequest = SignInFormSchema;

const SignInResponse = SignInAPIResponseSchema;

const SignInPath = "/Auth";

export const TicketSchema = z.object({
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  date: z.string(),
  status: z.number(),
  shouldBeAnswered: z.boolean(),
  ticketAnswer: z.string().nullable(),
  id: z.number(),
  isDeleted: z.boolean(),
});

export type Ticket = z.infer<typeof TicketSchema>;

const TicketsResponse = z.array(TicketSchema);
const TicketsPath = "/Ticket";

export const ReplyTicketSchema = z.object({
  id: z.number(),
  content: z.string().min(1, "Reply content is required"),
});

export type ReplyTicketType = z.infer<typeof ReplyTicketSchema>;

const signIn = api<
  z.infer<typeof SignInRequest>,
  z.infer<typeof SignInResponse>
>({
  method: "GET",
  path: SignInPath,
  requestSchema: SignInRequest,
  responseSchema: SignInResponse,
  type: "public",
});

const getTickets = api<
  { page: number; amount: number },
  z.infer<typeof TicketsResponse>
>({
  method: "GET",
  path: TicketsPath,
  requestSchema: z.object({
    page: z.number(),
    amount: z.number(),
  }),
  responseSchema: TicketsResponse,
  type: "private",
});

const replyToTicket = api<ReplyTicketType, { success: boolean; message: string }>({
  method: "POST",
  path: ({ id, content }) => `${TicketsPath}?id=${id}&content=${encodeURIComponent(content)}`,
  requestSchema: ReplyTicketSchema,
  responseSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  type: "private",
});

const UsersPath = "/User";

export const UsersShcema = z.object({
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  isAdmin: z.boolean(),
  id: z.number(),
  isDeleted: z.boolean(),
});

const UsersResponse = z.array(UsersShcema);

const getUsers = api<
  { page: number; amount: number },
  z.infer<typeof UsersResponse>
>({
  method: "GET",
  path: UsersPath,
  requestSchema: z.object({
    page: z.number(),
    amount: z.number(),
  }),
  responseSchema: UsersResponse,
  type: "private",
});

export const UpdateUserSchema = z.object({
  id: z.number(),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  isAdmin: z.boolean(),
});

export type UpdateUserType = z.infer<typeof UpdateUserSchema>;

const updateUser = api<UpdateUserType, void>({
  method: "PUT",
  path: UsersPath,
  requestSchema: UpdateUserSchema,
  responseSchema: z.void(),
  type: "private",
});

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type CreateUserType = z.infer<typeof CreateUserSchema>;

const createUser = api<CreateUserType, void>({
  method: "POST",
  path: UsersPath,
  requestSchema: CreateUserSchema,
  responseSchema: z.void(),
  type: "private",
});

const deleteUser = api<number, void>({
  method: "DELETE",
  path: (id) => `${UsersPath}?id=${id}`,
  requestSchema: z.number(),
  responseSchema: z.void(),
  type: "private",
});

export const UsersAPI = {
  getUsers,
  updateUser,
  createUser,
  deleteUser,
};

export const SignInAPI = {
  signIn,
};

export const TicketsAPI = {
  getTickets,
  replyToTicket,
};



