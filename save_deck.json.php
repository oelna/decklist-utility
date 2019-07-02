<?php

	require_once(__DIR__.DIRECTORY_SEPARATOR.'config.php');
	require_once(ROOT.DS.'deckcode_lib.php');

	$input = (isset($_POST['data'])) ? $_POST['data'] : file_get_contents('php://input');
	$decoded = (!empty($input)) ? json_decode($input) : array();
	$return_data = array();

	/*
	$decoded = new stdClass();
	$decoded->user = 'edb19733-7147-4afa-ac39-c8e5eb41fb82';
	$decoded->name = 'dogs masters';
	$decoded->curve = array(2, 2, 5, 5, 2, 5, 3, 6);
	$decoded->comment = 'xxxx';
	$decoded->code = 'AAECAf0ECMUEigeQB7gIvuwCxvgCoIADip4DC4oByQOrBMsElgXhB/sMw/gC24kDg5YDn5sDAA==';
	$decoded->timestamp = time();
	*/

	if(!empty($decoded)) {
		// check whether user exists and get their ID
		$statement = $db->prepare('SELECT id FROM users WHERE user_uuid = :user_uuid LIMIT 1');
		$statement->bindParam(':user_uuid', $decoded->user);
		$statement->execute();

		$userid_check = $statement->fetch(PDO::FETCH_OBJ);

		if($userid_check === false) {
			// create user
			$statement = $db->prepare('INSERT INTO users (user_uuid, date_created) VALUES (:user_uuid, :date_created)');
			$statement->bindParam(':user_uuid', $decoded->user, PDO::PARAM_STR);
			$statement->bindParam(':date_created', $decoded->timestamp, PDO::PARAM_INT);

			$insert_id = 0;
			if($statement->execute()) {
				//insert successful
				$insert_id = $db->lastInsertId();
				$user_id = $insert_id;
				$return_data[] = array('user_created' => true);
			}
		} else {
			$user_id = $userid_check->ID;
			$return_data[] = array('user_exists' => true);
		}

		if($user_id > 0) {
			// insert deck
			$decoded_deckstring = decode_deckstring($decoded->code);
			$card_ids = json_encode($decoded_deckstring);
			$manacurve = json_encode($decoded->curve);
			// $manacurve = generate_manacurve($decoded_deckstring); // this is done in JS instead

			try {
				$statement = $db->prepare('INSERT INTO deckcodes (deckcode, card_ids, manacurve, date_created) VALUES (:deckcode, :card_ids, :manacurve, :date_created)');
				$statement->bindParam(':deckcode', $decoded->code, PDO::PARAM_STR);
				$statement->bindParam(':card_ids', $card_ids, PDO::PARAM_STR);
				$statement->bindParam(':manacurve', $manacurve, PDO::PARAM_STR);
				$statement->bindParam(':date_created', $decoded->timestamp, PDO::PARAM_INT);

				$deck_insert = $statement->execute();
				$deck_insert_id = $db->lastInsertId();
			} catch(PDOException $e) {

				if((int) $e->getCode() == 23000) {
					// deck already exists
					$statement = $db->prepare('SELECT ID FROM deckcodes WHERE deckcode = :deckcode LIMIT 1');
					$statement->bindParam(':deckcode', $decoded->code);
					$statement->execute();

					$deckcode_id = $statement->fetch(PDO::FETCH_OBJ);

					if($deckcode_id !== false && $deckcode_id->ID > 0) {
						$deck_insert_id = $deckcode_id->ID;
					}
					$return_data[] = array('deck_exists' => true);
				} else {
					die('Unknown failure during deck insert: '.$e->getMessage());
				}
			}

			// insert link user<->deck
			try {
				$statement = $db->prepare('INSERT INTO user_to_deck (user_id, deck_id, deck_name, deck_comment, date_saved) VALUES (:user_id, :deck_id, :deck_name, :deck_comment, :date_saved)');
				$statement->bindParam(':user_id', $user_id, PDO::PARAM_INT);
				$statement->bindParam(':deck_id', $deck_insert_id, PDO::PARAM_INT);
				$statement->bindParam(':deck_name', $decoded->name, PDO::PARAM_STR);
				$statement->bindParam(':deck_comment', $decoded->comment, PDO::PARAM_STR);
				$statement->bindParam(':date_saved', $decoded->timestamp, PDO::PARAM_INT);

				$link_insert = $statement->execute();
			} catch(PDOException $e) {
				if((int) $e->getCode() == 23000) {
					// link already exists
					$link_insert = false;
					$return_data[] = array('link_exists' => true);
				} else {
					die('Unknown failure during link insert: '.$e->getMessage());
				}
			}

			// return a success code

		} else {
			$return_data[] = array('unknown_error' => true);
		}
	}

	header('Content-Type: application/json');
	echo(json_encode($return_data));

?>