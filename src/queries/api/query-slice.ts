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
  id: z.number(),
  isDeleted: z.boolean(),
});

export type Ticket = z.infer<typeof TicketSchema>;

const TicketsResponse = z.array(TicketSchema);
const TicketsPath = "/Ticket";

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

export const SignInAPI = {
  signIn,
};

export const TicketsAPI = {
  getTickets,
};
