<?php

	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);

	setlocale(LC_ALL, 'en_US');
	date_default_timezone_set('Europe/Berlin');
	DEFINE('ROOT', __DIR__);
	DEFINE('DS', DIRECTORY_SEPARATOR);

	$config = array();

	if(!is_writable(ROOT)) die('The project dir needs to be writable to use an SQLite database!');

	//do some setup, if the database file does not exist yet
	//make sure the 'ROOT' of the project is writable to PHP or create the folders yourself
	try {
		$db = new PDO('sqlite:'.ROOT.DS.'decks.db');
		$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

		$db->exec('BEGIN; CREATE TABLE IF NOT EXISTS deckcodes (
			ID integer PRIMARY KEY NOT NULL,
			deckcode TEXT UNIQUE NOT NULL,
			card_ids TEXT DEFAULT NULL,
			manacurve TEXT DEFAULT NULL,
			date_created integer DEFAULT 0,
			active boolean NOT NULL DEFAULT 1
		); CREATE TABLE IF NOT EXISTS users (
			ID integer PRIMARY KEY NOT NULL,
			user_uuid TEXT UNIQUE NOT NULL,
			date_created integer DEFAULT 0,
			active boolean NOT NULL DEFAULT 1
		); CREATE TABLE IF NOT EXISTS user_to_deck (
			ID integer PRIMARY KEY NOT NULL,
			user_id integer NOT NULL,
			deck_id integer NOT NULL,
			deck_name TEXT NOT NULL,
			deck_comment TEXT NOT NULL,
			date_saved integer DEFAULT 0,
			UNIQUE(user_id, deck_id)
		); COMMIT;');
	} catch(PDOException $e) {
		print 'Exception : '.$e->getMessage();
		die();
	}
	?>