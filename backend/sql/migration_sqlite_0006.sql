DROP TABLE announcement;

CREATE TABLE `announcement` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `message` VARCHAR(512) NOT NULL,
    `is_alert` BOOLEAN NOT NULL DEFAULT FALSE,
    `pages` TEXT,
    `created_by_id` BIGINT NOT NULL,
    `created_at` BIGINT NOT NULL,
    `revoked_by_id` BIGINT,
    `revoked_at` BIGINT,
    CONSTRAINT `announcement_by` FOREIGN KEY (`created_by_id`) REFERENCES `character` (`id`),
    CONSTRAINT `announcement_revoked_by` FOREIGN KEY (`revoked_by_id`) REFERENCES `character` (`id`)
);
