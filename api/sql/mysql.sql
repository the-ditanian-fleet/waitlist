CREATE TABLE `access_token` (
  `character_id` bigint NOT NULL,
  `access_token` varchar(255) NOT NULL,
  `expires` int NOT NULL,
  PRIMARY KEY (`character_id`),
  CONSTRAINT `access_token_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `admins` (
  `character_id` bigint NOT NULL,
  `level` varchar(64) NOT NULL,
  PRIMARY KEY (`character_id`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `alt_character` (
  `account_id` bigint NOT NULL,
  `alt_id` bigint NOT NULL,
  PRIMARY KEY (`account_id`,`alt_id`),
  KEY `alt_id` (`alt_id`),
  CONSTRAINT `alt_character_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `character` (`id`),
  CONSTRAINT `alt_character_ibfk_2` FOREIGN KEY (`alt_id`) REFERENCES `character` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ban` (
  `kind` varchar(11) NOT NULL,
  `id` bigint NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`kind`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `character` (
  `id` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `name` (`name`) WITH PARSER `ngram`
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `fit_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `character_id` bigint NOT NULL,
  `fit_id` int NOT NULL,
  `implant_set_id` int NOT NULL,
  `logged_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `character_id` (`character_id`),
  KEY `fit_id` (`fit_id`),
  KEY `implant_set_id` (`implant_set_id`),
  CONSTRAINT `fit_history_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
  CONSTRAINT `fit_history_ibfk_2` FOREIGN KEY (`fit_id`) REFERENCES `fitting` (`id`),
  CONSTRAINT `fit_history_ibfk_3` FOREIGN KEY (`implant_set_id`) REFERENCES `implant_set` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `fitting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dna` varchar(1024) CHARACTER SET ascii NOT NULL,
  `hull` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dna` (`dna`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `fleet` (
  `id` bigint NOT NULL,
  `boss_id` bigint NOT NULL,
  `is_updating` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `boss_id` (`boss_id`),
  CONSTRAINT `fleet_ibfk_1` FOREIGN KEY (`boss_id`) REFERENCES `character` (`id`),
  CONSTRAINT `fleet_chk_1` CHECK ((`is_updating` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `fleet_activity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `character_id` bigint NOT NULL,
  `fleet_id` bigint NOT NULL,
  `first_seen` int NOT NULL,
  `last_seen` int NOT NULL,
  `hull` int NOT NULL,
  `has_left` tinyint NOT NULL,
  `is_boss` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `character_id` (`character_id`),
  KEY `ix_fleet_activity_fleet_id` (`fleet_id`),
  CONSTRAINT `fleet_activity_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
  CONSTRAINT `fleet_activity_chk_1` CHECK ((`has_left` in (0,1))),
  CONSTRAINT `fleet_activity_chk_2` CHECK ((`is_boss` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `fleet_squad` (
  `fleet_id` bigint NOT NULL,
  `category` varchar(10) NOT NULL,
  `wing_id` bigint NOT NULL,
  `squad_id` bigint NOT NULL,
  PRIMARY KEY (`fleet_id`,`category`),
  CONSTRAINT `fleet_squad_ibfk_1` FOREIGN KEY (`fleet_id`) REFERENCES `fleet` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `implant_set` (
  `id` int NOT NULL AUTO_INCREMENT,
  `implants` varchar(255) CHARACTER SET ascii NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `implants` (`implants`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `refresh_token` (
  `character_id` bigint NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  PRIMARY KEY (`character_id`),
  CONSTRAINT `refresh_token_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `skill_current` (
  `character_id` bigint NOT NULL,
  `skill_id` int NOT NULL,
  `level` smallint NOT NULL,
  PRIMARY KEY (`character_id`,`skill_id`),
  CONSTRAINT `skill_current_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `skill_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `character_id` bigint NOT NULL,
  `skill_id` int NOT NULL,
  `old_level` smallint NOT NULL,
  `new_level` smallint NOT NULL,
  `logged_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `character_id` (`character_id`),
  CONSTRAINT `skill_history_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `waitlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_open` tinyint NOT NULL,
  `is_archived` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `waitlist_chk_1` CHECK ((`is_open` in (0,1))),
  CONSTRAINT `waitlist_chk_2` CHECK ((`is_archived` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `waitlist_entry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `waitlist_id` int NOT NULL,
  `account_id` bigint NOT NULL,
  `joined_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `waitlist_id` (`waitlist_id`,`account_id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `waitlist_entry_ibfk_1` FOREIGN KEY (`waitlist_id`) REFERENCES `waitlist` (`id`),
  CONSTRAINT `waitlist_entry_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `character` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `waitlist_entry_fit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `character_id` bigint NOT NULL,
  `entry_id` int NOT NULL,
  `fit_id` int NOT NULL,
  `implant_set_id` int NOT NULL,
  `approved` tinyint NOT NULL,
  `tags` varchar(255) NOT NULL,
  `category` varchar(10) NOT NULL,
  `fit_analysis` text,
  `review_comment` text,
  `cached_time_in_fleet` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `character_id` (`character_id`),
  KEY `entry_id` (`entry_id`),
  KEY `fit_id` (`fit_id`),
  KEY `implant_set_id` (`implant_set_id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_2` FOREIGN KEY (`entry_id`) REFERENCES `waitlist_entry` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_3` FOREIGN KEY (`fit_id`) REFERENCES `fitting` (`id`),
  CONSTRAINT `waitlist_entry_fit_ibfk_4` FOREIGN KEY (`implant_set_id`) REFERENCES `implant_set` (`id`),
  CONSTRAINT `waitlist_entry_fit_chk_1` CHECK ((`approved` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
