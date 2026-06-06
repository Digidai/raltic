CREATE TABLE `agent_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`task_id` text,
	`source` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`runtime_mode` text NOT NULL,
	`caller_id` text,
	`caller_type` text,
	`trigger_message_id` text,
	`output_message_id` text,
	`input_preview` text,
	`error` text,
	`metadata` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ix_agent_runs_server_status_created` ON `agent_runs` (`server_id`,`status`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `ix_agent_runs_channel_created` ON `agent_runs` (`channel_id`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `ix_agent_runs_agent_status_created` ON `agent_runs` (`agent_id`,`status`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `ix_agent_runs_trigger_message` ON `agent_runs` (`trigger_message_id`);--> statement-breakpoint
CREATE INDEX `ix_agent_runs_task_created` ON `agent_runs` (`task_id`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `ix_agent_runs_status_updated` ON `agent_runs` (`status`,`updated_at`);
