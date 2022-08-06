CREATE TABLE `badge` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE `badge_assignment` (
  `CharacterId` BIGINT NOT NULL,
  `BadgeId` INT NOT NULL,
  `GrantedById` BIGINT NULL,
  `GrantedAt` BIGINT NOT NULL,
  CONSTRAINT `Characterid` FOREIGN KEY (`CharacterId`) REFERENCES `character` (`id`),
  CONSTRAINT `BadgeId` FOREIGN KEY (`BadgeId`) REFERENCES `badge` (`id`) ON DELETE CASCADE,
  CONSTRAINT `GrantedById` FOREIGN KEY (`GrantedById`) REFERENCES `character` (`id`)
);

INSERT INTO badge (name) VALUES ('BASTION');
INSERT INTO badge (name) VALUES ('LOGI');
INSERT INTO badge (name) VALUES ('RETIRED-LOGI');
INSERT INTO badge (name) VALUES ('WEB');