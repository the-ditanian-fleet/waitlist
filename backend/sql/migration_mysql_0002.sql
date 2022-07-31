CREATE TABLE `announcement` (
  `id` bigint NOT NULL,
  `message` TEXT NOT NULL,
  `character_id` bigint NOT NULL,
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `character_id` (`character_id`),
  CONSTRAINT `created_by` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
