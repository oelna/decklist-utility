<?php

	require_once(__DIR__.DIRECTORY_SEPARATOR.'config.php');
	require_once(ROOT.DS.'deckcode_lib.php');

	$input = (isset($_POST['user'])) ? $_POST['user'] : file_get_contents('php://input');
	$user_uuid = (!empty($input)) ? $input : '';
	$return_data = array();

	/*
	$user_uuid = 'edb19733-7147-4afa-ac39-c8e5eb41fb82';
	*/

	try {
		$statement = $db->prepare('SELECT d.deckcode, l.date_saved, l.deck_name, l.deck_comment FROM deckcodes d LEFT JOIN user_to_deck l ON d.ID=l.deck_id LEFT JOIN users u ON u.id=l.user_id WHERE u.user_uuid = :user_uuid ORDER BY l.date_saved DESC');
		$statement->bindParam(':user_uuid', $user_uuid, PDO::PARAM_STR);

		$deck_select = $statement->execute();
		$return_data = $statement->fetchAll(PDO::FETCH_OBJ);
	} catch(PDOException $e) {
		die('Unknown failure during deck insert: '.$e->getMessage());
	}

	header('Content-Type: application/json');
	echo(json_encode($return_data));

?>