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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "qa_logs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "qas" (
	"id" varchar PRIMARY KEY NOT NULL,
	"category" varchar(100),
	"website_link" varchar(500),
	"question" text,
	"answer" text,
	"embedding" vector(2000),
	"embedding_model" varchar(100) DEFAULT 'gemini-embedding-001',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "qas_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "qa_logs" ADD CONSTRAINT "qa_logs_qa_id_qas_id_fk" FOREIGN KEY ("qa_id") REFERENCES "public"."qas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "qas_embedding_idx" ON "qas" USING hnsw ("embedding" vector_cosine_ops);