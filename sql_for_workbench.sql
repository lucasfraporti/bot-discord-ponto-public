SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `pontos` (
  `id` int(255) NOT NULL,
  `user` varchar(50) NOT NULL,
  `id_user` varchar(50) NOT NULL,
  `day_open` date NOT NULL,
  `day_close` date DEFAULT NULL,
  `open` time NOT NULL,
  `close` time DEFAULT NULL,
  `total_time` time DEFAULT NULL,
  `log_msg_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `pontos`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `pontos`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;
COMMIT;