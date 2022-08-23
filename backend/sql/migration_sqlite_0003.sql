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