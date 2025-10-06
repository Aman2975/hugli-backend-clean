-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 29, 2025 at 04:10 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hugli_printing_db`
--
CREATE DATABASE IF NOT EXISTS `hugli_printing_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `hugli_printing_db`;

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` enum('new','read','replied') DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company` varchar(255) DEFAULT NULL,
  `service_type` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `contact_messages`:
--

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `subject`, `message`, `status`, `created_at`, `updated_at`, `company`, `service_type`) VALUES
(1, 'amandeep', 'amanil@gmail.com', '0123456789', 'service required', 'contact me', 'new', '2025-09-04 09:03:18', '2025-09-04 09:03:18', 'deep', 'Other'),
(2, 'aman', NULL, '5454545454', NULL, NULL, 'new', '2025-09-04 09:03:35', '2025-09-04 09:03:35', NULL, NULL),
(3, 'amandeepsingh', NULL, NULL, NULL, 'need to contact', 'new', '2025-09-23 10:54:33', '2025-09-23 10:54:33', NULL, 'ATM Pouches');

-- --------------------------------------------------------

--
-- Table structure for table `email_verifications`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `email_verifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `verification_token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `email_verifications`:
--   `user_id`
--       `users` -> `id`
--

--
-- Dumping data for table `email_verifications`
--

INSERT INTO `email_verifications` (`id`, `user_id`, `email`, `verification_token`, `expires_at`, `verified`, `created_at`) VALUES
(1, 5, 'test@example.com', 'eed5d18c4c36db6f3835e004f6536e082e0362270972cfb08192be60636589b2', '2025-09-11 17:53:18', 0, '2025-09-10 17:53:18');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `orders` (
  `id` varchar(36) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `customer_company` varchar(255) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `delivery_type` enum('pickup','delivery') DEFAULT 'pickup',
  `delivery_address` text DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `delivery_time` time DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `urgency` enum('normal','urgent','rush') DEFAULT 'normal',
  `contact_method` enum('phone','email','whatsapp') DEFAULT 'phone',
  `preferred_contact_time` enum('morning','afternoon','evening','anytime') DEFAULT 'anytime',
  `status` enum('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'pending',
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `orders`:
--

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_name`, `customer_email`, `customer_phone`, `customer_company`, `customer_address`, `delivery_type`, `delivery_address`, `delivery_date`, `delivery_time`, `special_instructions`, `urgency`, `contact_method`, `preferred_contact_time`, `status`, `total_amount`, `created_at`, `updated_at`) VALUES
('7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'aman', 'amandeep2975@gmail.com', '0123654789', 'aman', NULL, 'pickup', NULL, '2025-09-24', NULL, NULL, 'normal', 'phone', 'anytime', 'in_progress', 0.00, '2025-09-23 10:32:33', '2025-09-23 10:47:26'),
('b4689747-8f65-47bf-bac8-7fcbfce14d3d', 'Amandeep Singh', 'amandeep@gmail.com', '9876543210', 'Test Company', NULL, 'pickup', 'undefined, undefined, Ferozpur, Punjab undefined, India, Phone: 9876543210', '2025-09-12', NULL, NULL, 'normal', 'phone', 'anytime', 'completed', 0.00, '2025-09-03 08:37:41', '2025-09-03 09:04:23'),
('f7ccef0d-ac3f-483b-926c-6fa558f33512', 'aman', 'amandeep2975@gmail.com', '0123654789', 'aman', NULL, 'pickup', NULL, '2025-09-30', NULL, NULL, 'normal', 'phone', 'anytime', 'pending', 0.00, '2025-09-28 05:30:52', '2025-09-28 05:30:52'),
('test-order-1756879904770', 'Test User', 'test@example.com', '9876543210', 'Test Company', 'Test Address', 'pickup', 'Test Address', '2025-09-10', '10:00:00', 'Test instructions', 'normal', 'phone', 'anytime', 'completed', 0.00, '2025-09-03 06:11:44', '2025-09-03 10:13:16');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_description` text DEFAULT NULL,
  `product_icon` varchar(10) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `order_items`:
--   `order_id`
--       `orders` -> `id`
--

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_name`, `product_description`, `product_icon`, `quantity`, `options`, `created_at`) VALUES
(1, 'test-order-1756879904770', 'Test Product', 'Test Description', '📄', 1, '{\"test\":\"value\"}', '2025-09-03 06:11:44'),
(6, 'b4689747-8f65-47bf-bac8-7fcbfce14d3d', 'Pamphlets', 'High-quality pamphlets for marketing and information distribution', '📄', 1, '{\"paperQuality\":\"70 GSM Maplitho Paper\",\"quantity\":100}', '2025-09-03 08:37:41'),
(11, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'ENVELOPE - 9.70x4.20', 'Medium office letter envelope', '✉️', 1, '{\"size\":\"ENVELOPE - 9.70x4.20\",\"utility\":\"For Office Letters\",\"category\":\"Office Envelopes\",\"quantity\":104}', '2025-09-23 10:32:33'),
(12, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'ENVELOPE - 6x8', 'Large invitation envelope', '💌', 1, '{\"size\":\"ENVELOPE - 6x8\",\"utility\":\"For Invitations / Cards\",\"category\":\"Invitation Envelopes\",\"quantity\":102}', '2025-09-23 10:32:33'),
(13, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'LETTER HEAD PAPER', 'Professional letterhead paper with custom design', '📄', 1, '{\"type\":\"LETTER HEAD PAPER\",\"category\":\"Digital Paper Printing\",\"productionTime\":\"1 day\",\"quantity\":51}', '2025-09-23 10:32:33'),
(14, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'TEXTURE PAPER', 'Textured paper with unique surface finish', '📋', 1, '{\"type\":\"TEXTURE PAPER\",\"category\":\"Digital Paper Printing\",\"productionTime\":\"1 day\",\"quantity\":51}', '2025-09-23 10:32:33'),
(15, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'NT / PVC SHEETS', 'Durable NT and PVC sheet printing', '🔄', 1, '{\"type\":\"NT / PVC SHEETS\",\"category\":\"Digital Paper Printing\",\"productionTime\":\"1 day\",\"quantity\":51}', '2025-09-23 10:32:33'),
(16, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'ATM Pouch - Matt Lamination', 'ATM pouch with matt lamination finish for professional appearance', '💳', 1, '{\"type\":\"ATM Pouch - Matt Lamination\",\"category\":\"ATM Pouches\",\"lamination\":\"Matt Lamination\",\"minimumOrder\":1000,\"quantity\":1000}', '2025-09-23 10:32:33'),
(17, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'ATM Pouch - Gloss Lamination', 'ATM pouch with gloss lamination finish for premium look', '💳', 1, '{\"type\":\"ATM Pouch - Gloss Lamination\",\"category\":\"ATM Pouches\",\"lamination\":\"Gloss Lamination\",\"minimumOrder\":1000,\"quantity\":1000}', '2025-09-23 10:32:33'),
(18, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'A4 Bill Book - 2 Copy', 'Professional A4 bill book with 2 carbon copies', '📊', 1, '{\"type\":\"A4 Bill Book - 2 Copy\",\"category\":\"Bill Books\",\"size\":\"A4\",\"copies\":\"2 Copy\",\"minimumOrder\":100,\"quantity\":100}', '2025-09-23 10:32:33'),
(19, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'ENVELOPE - 9.70x4.20', 'Medium office letter envelope', '✉️', 1, '{\"size\":\"ENVELOPE - 9.70x4.20\",\"utility\":\"For Office Letters\",\"category\":\"Office Envelopes\",\"quantity\":101}', '2025-09-23 10:32:33'),
(20, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'Standard Visiting Cards', 'Standard Visiting Cards with Custom Size and Glossy Finish', '💼', 1, '{\"cardType\":\"Standard Visiting Cards\",\"size\":\"Custom Size\",\"material\":\"Glossy Finish\",\"quantity\":100}', '2025-09-23 10:32:33'),
(21, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'Premium Visiting Cards', 'Premium Visiting Cards with Custom Size and Glossy Finish', '💎', 1, '{\"cardType\":\"Premium Visiting Cards\",\"size\":\"Custom Size\",\"material\":\"Glossy Finish\",\"quantity\":100}', '2025-09-23 10:32:33'),
(22, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'Metal Visiting Cards', 'Metal Visiting Cards with Custom Size and Glossy Finish', '🔗', 4, '{\"cardType\":\"Metal Visiting Cards\",\"size\":\"Custom Size\",\"material\":\"Glossy Finish\",\"quantity\":100}', '2025-09-23 10:32:33'),
(23, '7f5ffb21-027c-4ecf-a376-fd6a8ddee7b1', 'Standard Visiting Cards', 'Standard Visiting Cards with Large (3.5\" x 2.5\") and Glossy Finish', '💼', 1, '{\"cardType\":\"Standard Visiting Cards\",\"size\":\"Large (3.5\\\" x 2.5\\\")\",\"material\":\"Glossy Finish\",\"quantity\":100}', '2025-09-23 10:32:33'),
(24, 'f7ccef0d-ac3f-483b-926c-6fa558f33512', 'Sticker (Without Half Cut)', 'Sticker (Without Half Cut) with Small (2\" x 2\") and Vinyl', '🏷️', 3, '{\"stickerType\":\"Sticker (Without Half Cut)\",\"size\":\"Small (2\\\" x 2\\\")\",\"material\":\"Vinyl\",\"quantity\":100}', '2025-09-28 05:30:52');

-- --------------------------------------------------------

--
-- Table structure for table `otp_codes`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `otp_codes` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `purpose` enum('login','password_reset','email_verification') NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `otp_codes`:
--

--
-- Dumping data for table `otp_codes`
--

INSERT INTO `otp_codes` (`id`, `email`, `otp_code`, `purpose`, `expires_at`, `used`, `created_at`) VALUES
(2, 'test2@example.com', '307986', 'email_verification', '2025-09-10 18:15:08', 0, '2025-09-10 18:05:08'),
(3, 'test2@example.com', '235914', 'login', '2025-09-10 18:15:20', 0, '2025-09-10 18:05:20'),
(5, 'amandeepd2975@gmail.com', '199894', 'email_verification', '2025-09-10 18:18:37', 0, '2025-09-10 18:08:37'),
(7, 'testuser@example.com', '906419', 'email_verification', '2025-09-11 01:55:19', 0, '2025-09-11 01:45:19'),
(8, 'amandeep2975@gmail.com', '484177', 'email_verification', '2025-09-11 01:50:53', 1, '2025-09-11 01:50:14'),
(17, 'amansingh2975@gmail.com', '398523', 'login', '2025-09-11 02:18:09', 0, '2025-09-11 02:08:10'),
(18, 'amansingh2975@gmail.com', '327805', 'email_verification', '2025-09-11 02:26:53', 0, '2025-09-11 02:16:53'),
(23, 'amandeep29752975@gmail.com', '186088', 'email_verification', '2025-09-12 19:53:11', 1, '2025-09-12 19:52:53'),
(25, 'amandeep2975@gmail.com', '427377', 'login', '2025-09-15 06:31:20', 0, '2025-09-15 06:21:21'),
(27, 'amandeep@gmail.com', '975178', 'login', '2025-09-15 07:01:04', 0, '2025-09-15 06:51:04'),
(30, 'amandeep2975@gmail.com', '255245', 'password_reset', '2025-09-28 05:40:04', 0, '2025-09-28 05:30:04');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reset_token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `password_reset_tokens`:
--   `user_id`
--       `users` -> `id`
--

-- --------------------------------------------------------

--
-- Table structure for table `products`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `products`:
--

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `icon`, `category`, `options`, `created_at`, `updated_at`) VALUES
(1, 'Visiting Cards', 'Professional business cards with premium quality', '💳', 'Business Cards', '{\"paperQuality\":[\"Premium Card Stock\",\"Standard Card Stock\"],\"finish\":[\"Matte\",\"Glossy\",\"UV Coated\"],\"quantity\":[100,250,500,1000]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(2, 'Pamphlets', 'High-quality pamphlets for marketing and information distribution', '📄', 'Marketing Materials', '{\"paperQuality\":[\"70 GSM Maplitho Paper\",\"80 GSM Maplitho Paper\",\"100 GSM Art Paper\"],\"size\":[\"A4\",\"A5\",\"A6\"],\"quantity\":[100,250,500,1000]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(3, 'Posters', 'Eye-catching posters for events and promotions', '📢', 'Marketing Materials', '{\"paperQuality\":[\"120 GSM Art Paper\",\"150 GSM Art Paper\",\"200 GSM Art Paper\"],\"size\":[\"A3\",\"A2\",\"A1\",\"A0\"],\"quantity\":[10,25,50,100]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(4, 'Garment Tags', 'Custom garment tags and labels', '🏷️', 'Labels & Tags', '{\"material\":[\"Paper\",\"Plastic\",\"Fabric\"],\"size\":[\"Small\",\"Medium\",\"Large\"],\"quantity\":[100,500,1000,2000]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(5, 'Files', 'Professional file covers and folders', '📁', 'Office Supplies', '{\"material\":[\"Cardboard\",\"Plastic\",\"Leather\"],\"size\":[\"A4\",\"A5\",\"Legal\"],\"quantity\":[10,25,50,100]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(6, 'Letter Heads', 'Professional letterhead designs', '📝', 'Business Stationery', '{\"paperQuality\":[\"80 GSM Bond Paper\",\"100 GSM Bond Paper\",\"120 GSM Bond Paper\"],\"design\":[\"Simple\",\"Logo\",\"Custom Design\"],\"quantity\":[100,250,500,1000]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(7, 'Envelopes', 'Custom envelopes for business correspondence', '✉️', 'Business Stationery', '{\"size\":[\"A4\",\"A5\",\"DL\",\"C4\"],\"paperQuality\":[\"Standard\",\"Premium\"],\"quantity\":[100,250,500,1000]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(8, 'Digital Paper Printing', 'High-quality digital printing services', '🖨️', 'Digital Printing', '{\"paperType\":[\"Bond Paper\",\"Art Paper\",\"Photo Paper\"],\"color\":[\"Black & White\",\"Color\"],\"quantity\":[1,10,50,100]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(9, 'ATM Pouches', 'Secure ATM pouches and covers', '🏦', 'Security Products', '{\"material\":[\"Plastic\",\"Vinyl\",\"Fabric\"],\"size\":[\"Standard\",\"Large\"],\"quantity\":[10,25,50,100]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(10, 'Bill Books', 'Professional bill books and receipt books', '🧾', 'Business Forms', '{\"size\":[\"A4\",\"A5\",\"A6\"],\"pages\":[50,100,200],\"quantity\":[1,5,10,25]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07'),
(11, 'Stickers', 'Custom stickers and labels', '🏷️', 'Labels & Tags', '{\"material\":[\"Vinyl\",\"Paper\",\"Transparent\"],\"size\":[\"Small\",\"Medium\",\"Large\"],\"quantity\":[100,500,1000,2000]}', '2025-09-03 06:09:07', '2025-09-03 06:09:07');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','pending') DEFAULT 'pending',
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `email_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `users`:
--

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `company`, `status`, `role`, `created_at`, `updated_at`, `email_verified`) VALUES
(1, 'Amandeep Singh', 'amandeep@gmail.com', '$2a$10$7ro/mSPEjJmcP0nm.l6nm.OrdcduXHsv10vS19ba/06HQ7wPGY7g6', '9876543210', 'Test Company', 'active', '', '2025-09-03 06:09:08', '2025-09-03 06:09:08', 0),
(2, 'Rahul Sharma', 'rahul@gmail.com', '$2a$10$pKtSbiCIYO04f/jf3/VBpehNYwUe8r44mgesoGsowhkzMcc3pP73W', '9876543211', 'Another Company', 'active', '', '2025-09-03 06:09:08', '2025-09-03 06:09:08', 0),
(3, 'Admin User', 'admin@hugly.com', '$2a$10$4CLD4uZX1A/Mz9paOxO2s.jOqdUXhFrxcQqJLu5yGepDfqXcbLHWe', '+1234567892', 'Hugly Printing Press', 'active', 'admin', '2025-09-03 07:17:27', '2025-09-03 07:17:27', 0),
(4, 'ramandeep', 'ramandeep@gmail.com', '$2a$10$nPizxYz2YQb2KUKwZ3I.ROUPbdD.bkxpk5Y1nlkRoyxPZ//HsRdfW', '9464820510', 'kidz ', 'active', '', '2025-09-04 05:44:06', '2025-09-04 05:44:06', 0),
(5, 'Test User', 'test@example.com', '$2a$10$OPEgp3GyOM83ReGFLoYvcez8eJbeHvm27Bghpam0q8Y.ss6EcwWWa', '1234567890', 'Test Company', 'pending', 'user', '2025-09-10 17:53:18', '2025-09-10 17:53:18', 0),
(7, 'Test User 2', 'test2@example.com', '$2a$10$G4qGqL5Cge.waypCBZ9btu0z7Ddw2kENeOnFDS0XEXBmw2dIfWMQe', '1234567890', 'Test Company 2', 'pending', 'user', '2025-09-10 18:05:08', '2025-09-10 18:05:08', 0),
(8, 'amandeep', 'amandeepd2975@gmail.com', '$2a$10$ZKlp4mubzFqI795Hz3iYmezE02PJs3t2TbwLw248eGyRQL328Flae', '1234567890', 'aman', 'pending', 'user', '2025-09-10 18:08:37', '2025-09-10 18:08:37', 0),
(9, 'Test User', 'testuser@example.com', '$2a$10$hGY/vNGsI/.58eUaCPnZO.k8O7aqET.8qxlORZIRTF8TJCV3dNi4K', '1234567890', 'Test Company', 'pending', 'user', '2025-09-11 01:45:19', '2025-09-11 01:45:19', 0),
(10, 'aman', 'amandeep2975@gmail.com', '$2a$10$OB1ez5wGhFVjRYXDqr9D2ejswHPG.HB.GKp6jo0CkYnRkakklrozm', '0123654789', 'aman', 'active', 'user', '2025-09-11 01:50:14', '2025-09-23 09:24:11', 1),
(11, 'aman', 'amansingh2975@gmail.com', '$2a$10$rR0kleZmbUjEmfmIB.nXhushFlcc30knFU6ptwBq677fB9k9fcN.K', '0123654789', 'aman', 'pending', 'user', '2025-09-11 02:07:40', '2025-09-11 02:07:40', 0),
(12, 'aman', 'amandeep29752975@gmail.com', '$2a$10$K9oe.G//O8h/vLOrYx9Wc.TMRTr.mlBltRye4iQYBZKpE6hS44y3S', '0123654789', 'aman', 'active', 'user', '2025-09-12 19:52:53', '2025-09-12 19:53:11', 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--
-- Creation: Sep 29, 2025 at 02:06 PM
--

CREATE TABLE `user_addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `user_addresses`:
--   `user_id`
--       `users` -> `id`
--

--
-- Dumping data for table `user_addresses`
--

INSERT INTO `user_addresses` (`id`, `user_id`, `name`, `phone`, `address`, `city`, `state`, `pincode`, `country`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 1, 'Amandeep Singh', '9876543210', 'Rao ke hithar, Mamdot', 'Ferozpur', 'Punjab', '152023', 'India', 1, '2025-09-03 06:09:08', '2025-09-03 06:09:08'),
(2, 2, 'Rahul Sharma', '9876543211', 'Sector 15, Chandigarh', 'Chandigarh', 'Punjab', '160015', 'India', 1, '2025-09-03 06:09:08', '2025-09-03 06:09:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `email_verifications`
--
ALTER TABLE `email_verifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `verification_token` (`verification_token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `otp_codes`
--
ALTER TABLE `otp_codes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reset_token` (`reset_token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `email_verifications`
--
ALTER TABLE `email_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `otp_codes`
--
ALTER TABLE `otp_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `email_verifications`
--
ALTER TABLE `email_verifications`
  ADD CONSTRAINT `email_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
