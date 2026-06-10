-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 07, 2026 at 07:52 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `the laundry dry`
--

-- --------------------------------------------------------

--
-- Table structure for table `kasir`
--

CREATE TABLE `kasir` (
  `idKasir` int(11) NOT NULL,
  `namaKasir` varchar(50) DEFAULT NULL,
  `noHP` varchar(15) DEFAULT NULL,
  `idToko` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kasir`
--

INSERT INTO `kasir` (`idKasir`, `namaKasir`, `noHP`, `idToko`) VALUES
(1, 'Andi', '08117693647', 1),
(2, 'Budi', '08225564865', 1),
(3, 'Citra', '08335476386', 1),
(4, 'Dewi', '08443390897', 1),
(5, 'Eka', '08554432785', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `idNotif` int(11) NOT NULL,
  `idUser` int(11) DEFAULT NULL,
  `pesan` varchar(100) DEFAULT NULL,
  `waktu` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`idNotif`, `idUser`, `pesan`, `waktu`) VALUES
(1, 1, 'Pesanan diproses', '2026-04-01 09:00:00'),
(2, 3, 'Pesanan selesai', '2026-04-02 09:00:00'),
(3, 4, 'Pesanan selesai', '2026-04-03 09:00:00'),
(4, 5, 'Pesanan dicuci', '2026-04-04 09:00:00'),
(5, 1, 'Pesanan selesai', '2026-04-05 09:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `orderitems`
--

CREATE TABLE `orderitems` (
  `idItem` int(11) NOT NULL,
  `idOrder` int(11) DEFAULT NULL,
  `idService` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `subtotal` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderitems`
--

INSERT INTO `orderitems` (`idItem`, `idOrder`, `idService`, `quantity`, `subtotal`) VALUES
(1, 1, 1, 5, 35000),
(2, 2, 2, 7, 70000),
(3, 3, 3, 6, 30000),
(4, 4, 4, 2, 40000),
(5, 5, 5, 2, 50000);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `idOrder` int(11) NOT NULL,
  `idUser` int(11) DEFAULT NULL,
  `idKasir` int(11) DEFAULT NULL,
  `idToko` int(11) DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `metodePengambilan` enum('Pickup','Self') DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `status` enum('DIPESAN','DIJEMPUT','DICUCI','SELESAI','DIBATALKAN') DEFAULT NULL,
  `catatan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`idOrder`, `idUser`, `idKasir`, `idToko`, `tanggal`, `metodePengambilan`, `total`, `status`, `catatan`) VALUES
(1, 1, 1, 1, '2026-04-01', 'Pickup', 50000, 'DIPESAN', 'Cepat ya'),
(2, 3, 2, 1, '2026-04-02', 'Self', 75000, 'SELESAI', '-'),
(3, 4, 3, 1, '2026-04-03', 'Pickup', 30000, 'SELESAI', 'Wangi ya'),
(4, 5, 4, 1, '2026-04-04', 'Self', 45000, 'DICUCI', '-'),
(5, 1, 5, 1, '2026-04-05', 'Pickup', 60000, 'SELESAI', 'Jangan panas');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `idPayment` int(11) NOT NULL,
  `idOrder` int(11) DEFAULT NULL,
  `metode` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `tanggalBayar` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`idPayment`, `idOrder`, `metode`, `status`, `tanggalBayar`) VALUES
(1, 1, 'Transfer', 'PAID', '2026-04-01'),
(2, 2, 'Cash', 'PAID', '2026-04-02'),
(3, 3, 'QRIS', 'PAID', '2026-04-03'),
(4, 4, 'Transfer', 'PENDING', '2026-04-04'),
(5, 5, 'Cash', 'PAID', '2026-04-05');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `idService` int(11) NOT NULL,
  `namaService` varchar(50) DEFAULT NULL,
  `harga` int(11) DEFAULT NULL,
  `satuan` varchar(20) DEFAULT NULL,
  `kategori` varchar(20) DEFAULT NULL,
  `isRecommended` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`idService`, `namaService`, `harga`, `satuan`, `kategori`, `isRecommended`) VALUES
(1, 'Cuci Kering', 7000, 'Kg', 'Reguler', 1),
(2, 'Cuci Setrika', 10000, 'Kg', 'Reguler', 1),
(3, 'Setrika Saja', 5000, 'Kg', 'Reguler', 0),
(4, 'Bed Cover', 20000, 'Unit', 'Premium', 1),
(5, 'Sepatu', 25000, 'Pasang', 'Premium', 0);

-- --------------------------------------------------------

--
-- Table structure for table `toko`
--

CREATE TABLE `toko` (
  `idToko` int(11) NOT NULL,
  `namaToko` varchar(50) DEFAULT NULL,
  `alamat` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `toko`
--

INSERT INTO `toko` (`idToko`, `namaToko`, `alamat`) VALUES
(1, 'The Laundry & Dry Clean', 'Jl.Telekomunikasi no.1');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `idUser` int(11) NOT NULL,
  `nama` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `noHP` varchar(15) DEFAULT NULL,
  `alamat` varchar(100) DEFAULT NULL,
  `role` enum('customer','admin') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`idUser`, `nama`, `email`, `password`, `noHP`, `alamat`, `role`) VALUES
(1, 'Resa', 'resa@gmail.com', '123', '081176936489', 'Jl.Jeruk no.6', 'customer'),
(2, 'Haris', 'haris@gmail.com', '000', '082168462983', 'Jl.Cengkeh no 11', 'admin'),
(3, 'Budi', 'budi@gmail.com', '111', '083321563497', 'Jl.Anggur no 2', 'customer'),
(4, 'Rangga', 'rangga@gmail.com', '222', '084278564923', 'Jl.Apel no 17', 'customer'),
(5, 'Andi', 'andi@gmail.com', '555', '085556382779', 'PBB Blok i.4', 'customer');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `kasir`
--
ALTER TABLE `kasir`
  ADD PRIMARY KEY (`idKasir`),
  ADD KEY `idToko` (`idToko`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`idNotif`),
  ADD KEY `idUser` (`idUser`);

--
-- Indexes for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD PRIMARY KEY (`idItem`),
  ADD KEY `idOrder` (`idOrder`),
  ADD KEY `idService` (`idService`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`idOrder`),
  ADD KEY `idUser` (`idUser`),
  ADD KEY `idKasir` (`idKasir`),
  ADD KEY `idToko` (`idToko`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`idPayment`),
  ADD KEY `idOrder` (`idOrder`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`idService`);

--
-- Indexes for table `toko`
--
ALTER TABLE `toko`
  ADD PRIMARY KEY (`idToko`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`idUser`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `kasir`
--
ALTER TABLE `kasir`
  MODIFY `idKasir` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `idNotif` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `orderitems`
--
ALTER TABLE `orderitems`
  MODIFY `idItem` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `idOrder` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `idPayment` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `idService` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `toko`
--
ALTER TABLE `toko`
  MODIFY `idToko` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `idUser` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `kasir`
--
ALTER TABLE `kasir`
  ADD CONSTRAINT `kasir_ibfk_1` FOREIGN KEY (`idToko`) REFERENCES `toko` (`idToko`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`);

--
-- Constraints for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD CONSTRAINT `orderitems_ibfk_1` FOREIGN KEY (`idOrder`) REFERENCES `orders` (`idOrder`),
  ADD CONSTRAINT `orderitems_ibfk_2` FOREIGN KEY (`idService`) REFERENCES `services` (`idService`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`idKasir`) REFERENCES `kasir` (`idKasir`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`idToko`) REFERENCES `toko` (`idToko`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`idOrder`) REFERENCES `orders` (`idOrder`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
