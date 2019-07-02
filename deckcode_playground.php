<?php

	// alternative:
	// https://github.com/mlntn/hearthstone-deckcodes

	// https://www.php.net/manual/en/function.intval.php (search for variable length)

	//require_once('/Users/oelna/Desktop/Binary.php');

	class VarInt {
		/**
		 * Reads from the stream
		 *
		 * @param $fd resource the stream to read from
		 * @param $length int the length to read
		 * @return string|false the read bytes or false if read failed
		 */
		private static function read($fd, $length)
		{
			$bytes = fread($fd, $length);
			if (false === $bytes) {
				return false;
			}
			return $bytes;
		}
		/**
		 * Read a varint from beginning of the string.
		 *
		 * @param $data String the data
		 * @throws InvalidDataException on invalid data
		 * @return VarInt|false the parsed VarInt if parsed, false if not enough data
		 */
		public static function readUnsignedVarInt($data)
		{
			$fd = fopen('data://text/plain,' . urlencode($data), 'rb');
			$original = '';
			$result = $shift = 0;
			do {
				$readValue = self::read($fd, 1);
				if(false === $readValue || $readValue === null) {
					return false;
				}
				$original .= $readValue;
				$byte = ord($readValue);
				$result |= ($byte & 0x7f) << $shift++ * 7;
				if($shift > 5) {
					throw new InvalidDataException('VarInt greater than allowed range');
				}
			} while ($byte > 0x7f);
			// return new VarInt($result, $original, $shift);
			return array(
				'result' => $result,
				'original' => $original,
				'shift' => $shift
			);
		}
		/**
		 * Writes a VarInt
		 *
		 * @param $data int the value to write
		 * @return VarInt the encoded value
		 * @throws InvalidDataException
		 */
		public static function writeUnsignedVarInt($data) {
			if($data < 0) {
				throw new InvalidDataException('Cannot write negative values');
			}
			$orig = $data;
			//single bytes don't need encoding
			if ($data < 0x80) {
				return new VarInt($data, pack('C', $data), 1);
			}
			$encodedBytes = [];
			while ($data > 0) {
				$encodedBytes[] = 0x80 | ($data & 0x7f);
				$data >>= 7;
			}
			//remove most sig bit from final value
			$encodedBytes[count($encodedBytes)-1] &= 0x7f;
			//build the actual bytes from the encoded array
			$bytes = call_user_func_array('pack', array_merge(array('C*'), $encodedBytes));;
			return new VarInt($orig, $bytes, strlen($bytes));
		}
	}
	
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
	
	$deckstring = 'AAECAZICBvIFrqsClL0C+cACws4CmdMCDEBf/gHEBuQItLsCy7wCz7wC3b4CyccCoM0Ch84CAA==';
	
	$deckstring = 'AAEBAc2xAgjAAe0E7QX3DdYRh6wC8fsCoIADC8kDqwTLBPsMhRDH0wKW6AK0/ALNiQPXiQOfmwMA';
	//$deckstring = 'AAEBAf0GDADyBbYHkBCtEJfTApz4Apj7Avb9AqCAA4+CA+qJAwnJB8QIjg6UD+fLAvLQAojSAujnAtGAAwA=';
	$deckstring = 'AAEBAaoICvYCshS1FKC2ApS9Ava9AuTCAsLOAuHpAs30AgbTAfAH96oC+6oCh7wClO8CAtYPBdG8AgM='; // with n-off cards!
	
	$decoded = base64_decode($deckstring);
	
	
	$byte_array = unpack('C*', $decoded);
	//var_dump($byte_array);
	$data_array = vlq_decode($byte_array, true);
	var_dump($data_array);
	
	$hs_data_json = file_get_contents('https://api.hearthstonejson.com/v1/31353/enUS/cards.collectible.json');
	$hs_data = json_decode($hs_data_json);

	$cards = array();
	
	$version = $data_array[1];
	$format = $data_array[2];
	
	$next_array_length = $data_array[3];
	$array_counter = 4; // set first data item
	// heroes
	for ($i=0; $i<$next_array_length; $i++) {
		echo($data_array[$array_counter+$i]." x hero\n");
		$array_counter += 1;
	}
	
	$next_array_length = $data_array[$array_counter];
	echo('array of length '.$next_array_length.' for 1-off cards'."\n");
	$array_counter += 1; // move on to first data item
	// 1-off cards
	for ($i=0; $i<$next_array_length; $i++) {
		$key = array_search($data_array[$array_counter+$i], array_column($hs_data, 'dbfId'));
		$card = array(
			'dbfId' => $data_array[$array_counter+$i],
			'name' => $hs_data[$key]->name,
			'cost' => $hs_data[$key]->cost,
			'amount' => 1
		);
		
		$cards[] = $card;
	}
	$array_counter += $next_array_length; // fast-forward
	
	$next_array_length = $data_array[$array_counter];
	echo('array of length '.$next_array_length.' for 2-off cards'."\n");
	$array_counter += 1; // move on to first data item
	// 2-off cards
	for ($i=0; $i<$next_array_length; $i++) {
		$key = array_search($data_array[$array_counter+$i], array_column($hs_data, 'dbfId'));
		$card = array(
			'dbfId' => $data_array[$array_counter+$i],
			'name' => $hs_data[$key]->name,
			'cost' => $hs_data[$key]->cost,
			'amount' => 2
		);
		
		$cards[] = $card;
	}
	$array_counter += $next_array_length; // fast-forward
	
	$next_array_length = $data_array[$array_counter];
	echo('array of length '.$next_array_length.' for n-off cards'."\n");
	$array_counter += 1; // move on to first data item
	// n-off cards. these are handled a little differently!
	for ($i=0; $i<$next_array_length*2; $i++) {
		$key = array_search($data_array[$array_counter+$i], array_column($hs_data, 'dbfId'));
		$card = array(
			'dbfId' => $data_array[$array_counter+$i],
			'name' => $hs_data[$key]->name,
			'cost' => $hs_data[$key]->cost,
			'amount' => $data_array[$array_counter+$i+1]
		);
		
		$cards[] = $card;
		$i += 1;
	}
	$array_counter += $next_array_length; // fast-forward
	
	// sort by cost and name
	array_multisort(array_column($cards, 'cost'), SORT_ASC, array_column($cards, 'name'), SORT_ASC, $cards);
	
	print_r($cards);
	
	// discard the possibility of n-off cards for now
?>