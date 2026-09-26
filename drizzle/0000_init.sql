CREATE TYPE "public"."calculator_status" AS ENUM('draft', 'coming-soon', 'live', 'retired');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('currency', 'percent', 'years', 'months');--> statement-breakpoint
CREATE TABLE "calculator_inputs" (
	"calculator_id" integer NOT NULL,
	"field_name" text NOT NULL,
	"field_type" "field_type" NOT NULL,
	"default_value" jsonb NOT NULL,
	"validation_rules" jsonb NOT NULL,
	CONSTRAINT "calculator_inputs_calculator_id_field_name_pk" PRIMARY KEY("calculator_id","field_name")
);
--> statement-breakpoint
CREATE TABLE "calculator_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calculator_id" integer NOT NULL,
	"inputs" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculators" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "calculators_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"formula_version" text,
	"status" "calculator_status" DEFAULT 'draft' NOT NULL,
	CONSTRAINT "calculators_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "calculator_inputs" ADD CONSTRAINT "calculator_inputs_calculator_id_calculators_id_fk" FOREIGN KEY ("calculator_id") REFERENCES "public"."calculators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculator_sessions" ADD CONSTRAINT "calculator_sessions_calculator_id_calculators_id_fk" FOREIGN KEY ("calculator_id") REFERENCES "public"."calculators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calculator_sessions_calculator_created_idx" ON "calculator_sessions" USING btree ("calculator_id","created_at");