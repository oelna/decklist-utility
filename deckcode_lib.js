'use strict';

var oelna = window.oelna || {};
oelna.dl = window.oelna.dl || {};

oelna.dl.cardData = []; // holds data for ALL cards
oelna.dl.deckData = []; // holds the current deck
oelna.dl.activeDeckcode = '';

oelna.dl.loadCardData = function(callback) {
  const url = 'https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json';

  fetch(url)
  .then((resp) => resp.json())
  .then(function(data) {
    oelna.dl.cardData = data;

    if (callback) callback();
  })
}

// varint writeup by google: https://developers.google.com/protocol-buffers/docs/encoding
// VLQ decode with help from SO (url)
oelna.dl.varintDecode = function(bytes, swapEndian) {
	const result = [];
	let segments = [];
	for (var byte in bytes) {
		if (swapEndian) {
			segments.unshift(0x7f & bytes[byte]);
		} else {
			segments.push( 0x7f & bytes[byte] );
		}

		if ((bytes[byte] & 0x80) === 0) {
			let integer = 0;
			for(let segment in segments) {
				integer <<= 7;
				integer |= ( 0x7f & segments[segment] );
			}
			result.push(integer);
			segments = [];
		}
	}
	if ((bytes[byte] & 0x80) !== 0) {
		console.error('Incomplete byte sequence.');
	}

	return result;
}

oelna.dl.extractDeckstring = function(inputString) {
  const deckstring = inputString.match(/[A-Za-z0-9+\/=]{16,}/g);

  if (typeof deckstring[0] === 'string') {
    console.log('found deckstring:', deckstring[0]);
    return deckstring[0];
  } else {
    console.error('No deckstring found in input!');
    return false;
  }
}

oelna.dl.prepareDeckstring = function(deckstring) {
  if (!unpack) return [];

	const decoded = window.atob(deckstring);
	const byteArray = unpack('C*', decoded);
	const dataArray = oelna.dl.varintDecode(byteArray, true);

	return dataArray;
}

oelna.dl.fillCardData = function(parsedDeckstring) {
  if (oelna.dl.cardData.length > 0) {
    // todo: what is this? needed?
  }
}

oelna.dl.getManacurve = function(parsedDeckstring) {
  const manacurve = [0,0,0,0,0,0,0,0];

  if (oelna.dl.cardData.length > 0) {
    for (let i in parsedDeckstring.cards) {
      const manacost = (parsedDeckstring.cards[i].cost >= 7) ? 7 : parsedDeckstring.cards[i].cost;
      manacurve[manacost] += parsedDeckstring.cards[i].amount;
    }

    return manacurve;
  }

  return false;
}

oelna.dl.lookupCardByDbfId = function(dbfId) {
  if (!dbfId) return false;
  if (oelna.dl.cardData.length === 0) return false;

  const card = oelna.dl.cardData.filter(function(v,i) {
      return v.dbfId === dbfId;
  });

  return card[0];
}

oelna.dl.parseDeckstring = function(dataArray, addCardData) {

  if (oelna.dl.cardData.length === 0 && addCardData !== false) {
    console.warn('Card data was unavailable!');
    addCardData = false;
  }

	const cards = [];

	const version = dataArray[1];
	const format = dataArray[2];

	let nextArrayLength = dataArray[3];
  let arrayCounter = 4; // set first data item
  // heroes
  const heroes = [];
  for (let i = 0; i < nextArrayLength; i++) {

    const dbfId = dataArray[arrayCounter+i];
    let cardData;
    if (addCardData) {
      cardData = oelna.dl.lookupCardByDbfId(dbfId);
    }

  	const hero = {
  		'dbfId': dataArray[arrayCounter+i]
  	};

    if (addCardData && cardData !== undefined) {
      Object.assign(hero, cardData);
    }

  	heroes.push(hero);

  	arrayCounter += 1;
  }

  nextArrayLength = dataArray[arrayCounter];
  console.log(nextArrayLength + ' 1-off cards');
  arrayCounter += 1; // move on to first data item
  // 1-off cards
  for (let i = 0; i < nextArrayLength; i++) {

    const dbfId = dataArray[arrayCounter+i];
    let cardData;
    if (addCardData) {
      cardData = oelna.dl.lookupCardByDbfId(dbfId);
    }

  	const card = {
      'dbfId': dbfId,
      'amount': 1
    };

    if (addCardData && cardData !== undefined) {
      Object.assign(card, cardData);
    }

  	cards.push(card);
  }
  arrayCounter += nextArrayLength; // fast-forward

  nextArrayLength = dataArray[arrayCounter];
  if (nextArrayLength > 0) {
    console.log(nextArrayLength + ' 2-off cards');
    arrayCounter += 1; // move on to first data item
    // 2-off cards
    for (let i = 0;  i < nextArrayLength; i++) {

    	const dbfId = dataArray[arrayCounter+i];
      let cardData;
      if (addCardData) {
        cardData = oelna.dl.lookupCardByDbfId(dbfId);
      }

      const card = {
        'dbfId': dbfId,
        'amount': 2
      };

      if (addCardData && cardData !== undefined) {
        Object.assign(card, cardData);
      }

      cards.push(card);
    }
    arrayCounter += nextArrayLength; // fast-forward
  }

  nextArrayLength = dataArray[arrayCounter];
    if (nextArrayLength > 0) {
    console.log(nextArrayLength + ' n-off cards');
    arrayCounter += 1; // move on to first data item
    // n-off cards. these are handled a little differently!
    for (let i = 0; i < nextArrayLength*2; i++) {

      const dbfId = dataArray[arrayCounter+i];
      let cardData;
      if (addCardData) {
        cardData = oelna.dl.lookupCardByDbfId(dbfId);
      }

      const card = {
        'dbfId': dbfId,
        'amount': dataArray[arrayCounter+i+1]
      };

      if (addCardData && cardData !== undefined) {
        Object.assign(card, cardData);
      }

      cards.push(card);
      i += 1; // increase by an additional 1!
    }
  }
  // end of format

  return {
  	'version': version,
  	'format': format,
  	'heroes': heroes,
  	'cards': cards
  };
}