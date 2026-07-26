CREATE TABLE `marketing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`anonymous_id` text NOT NULL,
	`session_id` text NOT NULL,
	`journey_id` text NOT NULL,
	`user_id` text,
	`path` text NOT NULL,
	`target` text,
	`referrer_host` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`utm_content` text,
	`utm_term` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_marketing_events_event_time` ON `marketing_events` (`event`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_marketing_events_anonymous_time` ON `marketing_events` (`anonymous_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_marketing_events_journey_time` ON `marketing_events` (`journey_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_marketing_events_user_time` ON `marketing_events` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `user_attributions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`journey_id` text NOT NULL,
	`anonymous_id` text NOT NULL,
	`first_path` text NOT NULL,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`utm_content` text,
	`utm_term` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_attributions_journey` ON `user_attributions` (`journey_id`);--> statement-breakpoint
CREATE INDEX `idx_user_attributions_source` ON `user_attributions` (`utm_source`,`created_at`);