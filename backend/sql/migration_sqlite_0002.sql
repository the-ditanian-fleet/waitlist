CREATE TABLE `announcement` (
  `id` INTEGER PRIMARY KEY NOT NULL,
  `message` TEXT NOT NULL,
  `character_id` bigint NOT NULL,
  `created_at` bigint NOT NULL,
   CONSTRAINT `created_by` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`)
);