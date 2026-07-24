import * as z from "zod";

export const quoteRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  pickup_location: z.string().optional().or(z.literal("")),
  drop_location: z.string().optional().or(z.literal("")),
  package_type: z.string().optional().or(z.literal("")),
  approx_weight: z.string().optional().or(z.literal("")),
  urgency: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  preferred_courier: z.string().optional().or(z.literal("")),
  preferred_service: z.string().optional().or(z.literal("")),
  package_description: z.string().optional().or(z.literal("")),
  additional_requirements: z.string().optional().or(z.literal("")),
  // Admin-only fields (should be ignored by public submissions)
  internal_notes: z.string().optional().or(z.literal("")),
  source: z.enum(["ADMIN", "PUBLIC"]).default("ADMIN"),
});

export type QuoteRequestFormValues = z.infer<typeof quoteRequestSchema>;
