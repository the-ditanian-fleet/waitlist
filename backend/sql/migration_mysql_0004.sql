CREATE TABLE admin (
    `character_id` BIGINT PRIMARY KEY NOT NULL,
    `role` VARCHAR(64) NOT NULL,
    `granted_at` BIGINT NOT NULL,
    `granted_by_id` BIGINT NOT NULL,
    CONSTRAINT `character_role` FOREIGN KEY (`character_id`) REFERENCES `character` (`id`),
    CONSTRAINT `admin_character` FOREIGN KEY (`granted_by_id`) REFERENCES `character` (`id`)
);

-- Set vars AdminId, CreatedAt
SELECT @admin_id := character_id FROM admins WHERE level='admin';
SELECT @created_at := UNIX_TIMESTAMP();

INSERT INTO admin (`character_id`, `role`, `granted_at`, `granted_by_id`)
SELECT `character_id`, `level`, @created_at, @admin_id FROM admins;
DROP TABLE admins;