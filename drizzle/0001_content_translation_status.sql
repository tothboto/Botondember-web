CREATE TABLE `translation_requests` (
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`field` text NOT NULL,
	`locale` text NOT NULL,
	`requested_at` integer NOT NULL,
	PRIMARY KEY(`entity`, `entity_id`, `field`, `locale`)
);
--> statement-breakpoint
ALTER TABLE `content_translations` ADD `origin` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_translations` ADD `source_hash` text DEFAULT '' NOT NULL;