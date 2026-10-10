CREATE TABLE `gadgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`maker` text DEFAULT '' NOT NULL,
	`since` text DEFAULT '' NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`link` text DEFAULT '' NOT NULL,
	`media_id` integer,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
