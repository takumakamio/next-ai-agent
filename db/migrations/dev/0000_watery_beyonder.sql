CREATE TABLE "qa_logs" (
	"id" varchar PRIMARY KEY NOT NULL,
	"chat_session_id" varchar,
	"user_question" text NOT NULL,
	"user_question_embedding" vector(2000),
	"ai_answer" text,
	"similarity_score" double precision,
	"user_rating" integer,
	"user_feedback" text,
	"response_time" integer,
	"embedding_model" varchar(100) DEFAULT 'gemini-embedding-001',
	"qa_id" varchar,
	"qa_translation_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "qa_logs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "qa_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"qa_id" varchar NOT NULL,
	"question" text,
	"answer" text,
	"embedding" vector(2000),
	"embedding_model" varchar(100) DEFAULT 'gemini-embedding-001',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "qas" (
	"id" varchar PRIMARY KEY NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"category" varchar(100),
	"priority" integer DEFAULT 1,
	"view_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"website_link" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "qas_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "tag_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_id" varchar NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tags_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "qa_logs" ADD CONSTRAINT "qa_logs_qa_id_qas_id_fk" FOREIGN KEY ("qa_id") REFERENCES "public"."qas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_logs" ADD CONSTRAINT "qa_logs_qa_translation_id_qa_translations_id_fk" FOREIGN KEY ("qa_translation_id") REFERENCES "public"."qa_translations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_translations" ADD CONSTRAINT "qa_translations_qa_id_qas_id_fk" FOREIGN KEY ("qa_id") REFERENCES "public"."qas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_translations" ADD CONSTRAINT "tag_translations_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "qa_translations_embedding_idx" ON "qa_translations" USING hnsw ("embedding" vector_cosine_ops);