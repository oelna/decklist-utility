<?php

	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);

	// https://github.com/exercism/php/blob/master/exercises/variable-length-quantity/example.php
	function vlq_decode(array $bytes, $swap_endian=false) {
		$result = [];
		$segments = [];
		foreach ($bytes as $byte) {
			if( $swap_endian ) {
				array_unshift($segments, 0x7f & $byte);
			} else {
				$segments[] = ( 0x7f & $byte );
			}

			if (($byte & 0x80) === 0) {
				$integer = 0;
				foreach($segments as $segment) {
					$integer <<= 7;
					$integer |= ( 0x7f & $segment );
				}
				$result[] = $integer;
				$segments = [];
			}
		}
		if (($byte & 0x80) !== 0) {
			throw new InvalidArgumentException('Incomplete byte sequence.');
		}
		return $result;
	}


	function decode_deckstring(string $deckstring) {
		if(!$deckstring) return array();

		$clean_deckstring = '';
		if(preg_match('/[A-Za-z0-9+\/=]{16,}/', $deckstring, $matched) === 1) {
			$clean_deckstring = $matched[0];
		} else {
			return array();
		}

		$decoded = base64_decode($clean_deckstring);

		$byte_array = unpack('C*', $decoded);

		$data_array = vlq_decode($byte_array, true);

		$deck = array(
			'heroes' => array(),
			'cards' => array(
				'one' => array(),
				'two' => array(),
				'n' => array()
			)
		);

		$version = $data_array[1];
		$format = $data_array[2];

		$next_array_length = $data_array[3];
		$array_counter = 4; // set first data item
		// heroes
		for ($i=0; $i<$next_array_length; $i++) {
			$deck['heroes'][] = $data_array[$array_counter+$i];
			$array_counter += 1;
		}

		$next_array_length = $data_array[$array_counter];
		$array_counter += 1; // move on to first data item
		// 1-off cards
		for ($i=0; $i<$next_array_length; $i++) {
			$deck['cards']['one'][] = $data_array[$array_counter+$i];
		}
		$array_counter += $next_array_length; // fast-forward

		$next_array_length = $data_array[$array_counter];
		$array_counter += 1; // move on to first data item
		// 2-off cards
		for ($i=0; $i<$next_array_length; $i++) {
			$deck['cards']['two'][] = $data_array[$array_counter+$i];
		}
		$array_counter += $next_array_length; // fast-forward

		$next_array_length = $data_array[$array_counter];
		$array_counter += 1; // move on to first data item
		// n-off cards. these are handled a little differently!
		for ($i=0; $i<$next_array_length*2; $i++) {
			$card = array(
				$data_array[$array_counter+$i], // card dbfId
				$data_array[$array_counter+$i+1] // amount
			);

			$deck['cards']['n'][] = $card;
			$i += 1;
		}
		$array_counter += $next_array_length; // fast-forward

		// sort by cost and name
		//array_multisort(array_column($cards, 'cost'), SORT_ASC, array_column($cards, 'name'), SORT_ASC, $cards);
		return $deck;
	}

	function generate_manacurve($deck) {
		// todo: build this? is this needed?
		foreach($deck['cards']['one'] as $card) {
			var_dump($card);
		}
		foreach($deck['cards']['two'] as $card) {
			var_dump($card);
		}
		foreach($deck['cards']['n'] as $card) {
			var_dump($card);
		}
	}

	// print_r(generate_manacurve(decode_deckstring('AAEBAR8ejQG1A4cEyQSXCMUI2wntCbkN9w2BDpAQ1BHKFMMW4KwCm8IC5MIC3sQC080C3dIC39IChtMC4eMC6uYCw+oCgPMCufgCoIADpIgDAAA=')));

?>