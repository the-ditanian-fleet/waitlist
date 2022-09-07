CREATE TABLE admin (
  `character_id` bigint PRIMARY KEY NOT NULL, 
  `role` varchar(64) NOT NULL, 
  `granted_at` bigint NOT NULL, 
  `granted_by_id` bigint NULL, 
  CONSTRAINT `character_rank` FOREIGN KEY (`character_id`) REFERENCES character (`id`), 
  CONSTRAINT `admin_character` FOREIGN KEY (`granted_by_id`) REFERENCES character (`id`)
);

INSERT INTO admin ( `character_id`, `level`, `granted_at`, `granted_by_id`) 
SELECT `character_id`, `role`, (SELECT strftime('%s', 'now')), (SELECT `character_id` FROM admins WHERE level = 'admin') FROM admins;
DROP TABLE admins;