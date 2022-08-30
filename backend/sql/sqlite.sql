PRAGMA foreign_keys = ON;

/* Permanent data store */

CREATE TABLE `character` (
  `id` bigint PRIMARY KEY NOT NULL,
  `name` varchar(255) NOT NULL
);

CREATE TABLE `access_token` (
  `character_id` bigint PRIMARY KEY NOT NULL,
  `access_token` varchar(2048) NOT NULL,
  `expires` bigint NOT NULL,
  `scopes` varchar(1024) NOT NULL,
  CONSTRAINT `access_token_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
);

CREATE TABLE `refresh_token` (
  `character_id` bigint PRIMARY KEY NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `scopes` varchar(1024) NOT NULL,
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
  `reason` varchar(255) DeFAULT NULL,
  `added_by` bigint DEFAULT NULL,
  PRIMARY KEY (`kind`,`id`),
  CONSTRAINT `ban_added_by_fk` FOREIGN KEY (`added_by`) REFERENCES `character` (`id`)
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

CREATE TABLE `announcement` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `message` TEXT NOT NULL,
  `character_id` bigint NOT NULL,
  `created_at` bigint NOT NULL,
   CONSTRAINT `created_by` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
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

CREATE TABLE `character_note` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `character_id` bigint NOT NULL,
  `author_id` bigint NOT NULL,
  `note` text NOT NULL,
  `logged_at` bigint NOT NULL,
  CONSTRAINT `character_note_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
  CONSTRAINT `character_note_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `character` (`id`)
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
  `is_alt` tinyint NOT NULL,
  CONSTRAINT `waitlist_entry_fit_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_2` FOREIGN KEY (`entry_id`) REFERENCES `waitlist_entry` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_3` FOREIGN KEY (`fit_id`) REFERENCES `fitting` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_4` FOREIGN KEY (`implant_set_id`) REFERENCES `implant_set` (`id`),
  CONSTRAINT `waitlist_entry_fit_chk_1` CHECK ((`approved` in (0,1)))
);

/* Seed Required Records */

INSERT INTO Waitlist (id, name, is_open, is_archived) VALUES (1, 'fleet waitlist', 1, 0);

CREATE TABLE `badge` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` VARCHAR(64) NOT NULL UNIQUE,
  `exclude_badge_id` INTEGER NULL,
  CONSTRAINT `exclude_badge` FOREIGN KEY ('exclude_badge_id') REFERENCES `badge` (`id`) ON DELETE SET NULL
);

CREATE TABLE `badge_assignment` (
  `characterId` BIGINT NOT NULL,
  `badgeId` INT NOT NULL,
  `grantedById` BIGINT NULL,
  `grantedAt` BIGINT NOT NULL,
  CONSTRAINT `characterId` FOREIGN KEY (`characterId`) REFERENCES `character` (`id`),
  CONSTRAINT `badgeId` FOREIGN KEY (`badgeId`) REFERENCES `badge` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grantedById` FOREIGN KEY (`grantedById`) REFERENCES `character` (`id`)
);

INSERT INTO badge (name) VALUES ('BASTION');
INSERT INTO badge (name) VALUES ('LOGI');
INSERT INTO badge (name) VALUES ('RETIRED-LOGI');
INSERT INTO badge (name) VALUES ('WEB');

-- Logi and Retired logi are exclusive, update rows to reflect this
UPDATE badge SET exclude_badge_id=(SELECT id FROM badge WHERE name='LOGI') WHERE id=(SELECT id WHERE name='RETIRED-LOGI');
UPDATE badge SET exclude_badge_id=(SELECT id FROM badge WHERE name='RETIRED-LOGI') WHERE id=(SELECT id WHERE name='LOGI');
