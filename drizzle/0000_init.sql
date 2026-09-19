CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`area` text NOT NULL,
	`message` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_translations` (
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`field` text NOT NULL,
	`locale` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`entity`, `entity_id`, `field`, `locale`)
);
--> statement-breakpoint
CREATE TABLE `football_facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `football_moments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`media_id` integer,
	`link` text DEFAULT '' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `football_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`number` text DEFAULT '' NOT NULL,
	`position` text DEFAULT '' NOT NULL,
	`media_id` integer,
	`note` text DEFAULT '' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `football_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`body_md` text DEFAULT '' NOT NULL,
	`media_id` integer,
	`link` text DEFAULT '' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `football_sections_type_unique` ON `football_sections` (`type`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`platforms` text NOT NULL,
	`genre` text DEFAULT '' NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`review` text DEFAULT '' NOT NULL,
	`link` text DEFAULT '' NOT NULL,
	`cover_media_id` integer,
	`featured` integer DEFAULT false NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `generic_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`media_id` integer,
	`link` text DEFAULT '' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hobbies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`media_id` integer,
	`since` text DEFAULT '' NOT NULL,
	`tag` text DEFAULT '' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `legal_docs` (
	`slug` text NOT NULL,
	`locale` text NOT NULL,
	`body_md` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`slug`, `locale`)
);
--> statement-breakpoint
CREATE TABLE `locales` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`flag` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`ip` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`mime` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`size` integer NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`original_name` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'upload' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_path_unique` ON `media` (`path`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`slug` text NOT NULL,
	`template` text NOT NULL,
	`icon` text DEFAULT 'FileText' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`is_core` integer DEFAULT false NOT NULL,
	`intro_md` text DEFAULT '' NOT NULL,
	`body_md` text DEFAULT '' NOT NULL,
	`hero_media_id` integer,
	`accent_color` text,
	`seo_description` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_key_unique` ON `pages` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`key` text NOT NULL,
	`locale` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`key`, `locale`)
);
--> statement-breakpoint
CREATE TABLE `youtube_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`yt_id` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`thumb_media_id` integer,
	`note` text DEFAULT '' NOT NULL,
	`item_count` integer,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
