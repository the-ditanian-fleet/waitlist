DROP TABLE IF EXISTS `ban`;
DROP TABLE IF EXISTS `alliance`;
DROP TABLE IF EXISTS `corporation`;

CREATE TABLE `ban` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `entity_id` bigint NOT NULL,
  `entity_name` varchar(64),
  `entity_type` varchar(16) NOT NULL CHECK (
    `entity_type` in (
      'Account',
      'Character',
      'Corporation',
      'Alliance'
    )
  ),
  `issued_at` bigint NOT NULL,
  `issued_by` bigint NOT NULL,
  `public_reason` varchar(512),
  `reason` varchar(512) NOT NULL,
  `revoked_at` bigint,
  `revoked_by` bigint NULL,
  CONSTRAINT `issued_by` FOREIGN KEY (`issued_by`) REFERENCES `character` (`id`),
  CONSTRAINT `revoked_by` FOREIGN KEY (`revoked_by`) REFERENCES `character` (`id`)
);


CREATE TABLE `alliance` (
  `id` BIGINT PRIMARY KEY NOT NULL,
  `name` text NOT NULL
);

CREATE TABLE `corporation` (
  `id` BIGINT PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `alliance_id` BIGINT NULL,
  `updated_at` BIGINT NOT NULL,
  CONSTRAINT `alliance_id` FOREIGN KEY (`alliance_id`) REFERENCES `alliance` (`id`)
);

ALTER TABLE `character` ADD COLUMN `corporation_id` BIGINT NULL,
  ADD CONSTRAINT `corporation_id` FOREIGN KEY (`corporation_id`) REFERENCES `corporation` (`id`);
