PRAGMA foreign_keys = ON;

/* Permanent data store */

CREATE TABLE `character` (
  `id` bigint PRIMARY KEY NOT NULL,
  `name` varchar(255) NOT NULL
);

CREATE TABLE `access_token` (
  `character_id` bigint PRIMARY KEY NOT NULL,
  `access_token` varchar(255) NOT NULL,
  `expires` bigint NOT NULL,
  CONSTRAINT `access_token_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
);

CREATE TABLE `refresh_token` (
  `character_id` bigint PRIMARY KEY NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  CONSTRAINT `refresh_token_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
);

CREATE TABLE `admins` (
  `character_id` bigint PRIMARY KEY NOT NULL,
  `level` varchar(64) NOT NULL,
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
);

CREATE TABLE `alt_character` (
  `account_id` bigint NOT NULL,
  `alt_id` bigint NOT NULL,
  PRIMARY KEY (`account_id`,`alt_id`),
  CONSTRAINT `alt_character_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `character` (`id`),
  CONSTRAINT `alt_character_ibfk_2` FOREIGN KEY (`alt_id`) REFERENCES `character` (`id`)
);

CREATE TABLE `ban` (
  `kind` varchar(11) NOT NULL,
  `id` bigint NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`kind`,`id`)
);

CREATE TABLE `fitting` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `dna` varchar(1024) NOT NULL,
  `hull` int4 NOT NULL,
  UNIQUE (`dna`)
);

CREATE TABLE `implant_set` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `implants` varchar(255) NOT NULL,
  UNIQUE (`implants`)
);

CREATE TABLE `fit_history` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `character_id` bigint NOT NULL,
  `fit_id` bigint NOT NULL,
  `implant_set_id` bigint NOT NULL,
  `logged_at` bigint NOT NULL,
  CONSTRAINT `fit_history_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
  CONSTRAINT `fit_history_ibfk_2` FOREIGN KEY (`fit_id`) REFERENCES `fitting` (`id`),
  CONSTRAINT `fit_history_ibfk_3` FOREIGN KEY (`implant_set_id`) REFERENCES `implant_set` (`id`)
);

CREATE TABLE `fleet_activity` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `character_id` bigint NOT NULL,
  `fleet_id` bigint NOT NULL,
  `first_seen` bigint NOT NULL,
  `last_seen` bigint NOT NULL,
  `hull` int4 NOT NULL,
  `has_left` tinyint NOT NULL,
  `is_boss` tinyint NOT NULL,
  CONSTRAINT `fleet_activity_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
  CONSTRAINT `fleet_activity_chk_1` CHECK ((`has_left` in (0,1))),
  CONSTRAINT `fleet_activity_chk_2` CHECK ((`is_boss` in (0,1)))
);

CREATE TABLE `skill_current` (
  `character_id` bigint NOT NULL,
  `skill_id` int4 NOT NULL,
  `level` tinyint NOT NULL,
  PRIMARY KEY (`character_id`, `skill_id`)
  CONSTRAINT `skill_current_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
);

CREATE TABLE `skill_history` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `character_id` bigint NOT NULL,
  `skill_id` int4 NOT NULL,
  `old_level` smallint NOT NULL,
  `new_level` smallint NOT NULL,
  `logged_at` bigint NOT NULL,
  CONSTRAINT `skill_history_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
);

/* Temporary things */

CREATE TABLE `fleet` (
  `id` bigint PRIMARY KEY NOT NULL,
  `boss_id` bigint NOT NULL,
  `is_updating` tinyint DEFAULT NULL,
  CONSTRAINT `fleet_ibfk_1` FOREIGN KEY (`boss_id`) REFERENCES `character` (`id`),
  CONSTRAINT `fleet_chk_1` CHECK ((`is_updating` in (0,1)))
);

CREATE TABLE `fleet_squad` (
  `fleet_id` bigint NOT NULL,
  `category` varchar(10) NOT NULL,
  `wing_id` bigint NOT NULL,
  `squad_id` bigint NOT NULL,
  PRIMARY KEY (`fleet_id`,`category`),
  CONSTRAINT `fleet_squad_ibfk_1` FOREIGN KEY (`fleet_id`) REFERENCES `fleet` (`id`)
);

CREATE TABLE `waitlist` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_open` tinyint NOT NULL,
  `is_archived` tinyint NOT NULL,
  CONSTRAINT `waitlist_chk_1` CHECK ((`is_open` in (0,1))),
  CONSTRAINT `waitlist_chk_2` CHECK ((`is_archived` in (0,1)))
);

CREATE TABLE `waitlist_entry` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `waitlist_id` bigint NOT NULL,
  `account_id` bigint NOT NULL,
  `joined_at` bigint NOT NULL,
  UNIQUE (`waitlist_id`,`account_id`),
  CONSTRAINT `waitlist_entry_ibfk_1` FOREIGN KEY (`waitlist_id`) REFERENCES `waitlist` (`id`),
  CONSTRAINT `waitlist_entry_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `character` (`id`)
);

CREATE TABLE `waitlist_entry_fit` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `character_id` bigint NOT NULL,
  `entry_id` bigint NOT NULL,
  `fit_id` bigint NOT NULL,
  `implant_set_id` bigint NOT NULL,
  `approved` tinyint NOT NULL,
  `tags` varchar(255) NOT NULL,
  `category` varchar(10) NOT NULL,
  `fit_analysis` text,
  `review_comment` text,
  `cached_time_in_fleet` bigint NOT NULL,
  CONSTRAINT `waitlist_entry_fit_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_2` FOREIGN KEY (`entry_id`) REFERENCES `waitlist_entry` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_3` FOREIGN KEY (`fit_id`) REFERENCES `fitting` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_4` FOREIGN KEY (`implant_set_id`) REFERENCES `implant_set` (`id`),
  CONSTRAINT `waitlist_entry_fit_chk_1` CHECK ((`approved` in (0,1)))
);
