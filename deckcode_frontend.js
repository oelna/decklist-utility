'use strict';

var oelna = window.oelna || {};
oelna.dl = window.oelna.dl || {};

// UUID generator, as per https://stackoverflow.com/a/2117523/3625228
oelna.dl.uuid = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

// via https://stackoverflow.com/a/12462387/3625228
oelna.dl.arraySearch = function(nameKey, prop, myArray) {
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i][prop] === nameKey) {
            return myArray[i];
        }
    }
}

oelna.dl.live = function (eventType, elementQuerySelector, cb) {
	document.addEventListener(eventType, function (event) {

		const qs = document.querySelectorAll(elementQuerySelector);

		if (qs) {
			let el = event.target, index = -1;
			while (el && ((index = Array.prototype.indexOf.call(qs, el)) === -1)) {
				el = el.parentElement;
			}

			if (index > -1) {
				cb.call(el, event);
			}
		}
	});
}

oelna.dl.userDecksList = function() {
	let listElement = document.querySelector('ul.saved-decks');

	// empty list first, to be safe
	let listElementClone = listElement.cloneNode(false);
	listElement.parentNode.replaceChild(listElementClone, listElement);
	listElement = document.querySelector('ul.saved-decks');

	for (let i in oelna.dl.userDecks) {
		const listItem = document.createElement('li');
		const linkElement = document.createElement('a');
		linkElement.setAttribute('data-deckcode', oelna.dl.userDecks[i].deckcode);
		linkElement.setAttribute('href', '#');
		linkElement.innerHTML = oelna.dl.userDecks[i].deck_name;

		listItem.appendChild(linkElement);
		listElement.appendChild(listItem);
	}
}

oelna.dl.loadDeckFromDeckcode = function(deckcode) {

	if (typeof oelna.dl.prepareDeckstring !== 'function' ||
		typeof oelna.dl.parseDeckstring !== 'function') {
		console.error('Missing functions from deckcode_lib.js!');
		return false;
	}

	oelna.dl.activeDeckcode = deckcode;

	const prepared = oelna.dl.prepareDeckstring(deckcode);
	const parsed = oelna.dl.parseDeckstring(prepared, true);

	// clear the last deck notes
	document.querySelector('#user-deck-name').innerHTML = 'yyyy';
	document.querySelector('#user-deck-comment').innerHTML = 'xxx';

	oelna.dl.displayDeck(parsed);
}

oelna.dl.cardDataByDbfId = function(dbfId) {
	if (oelna.dl.cardData.length > 0) {
		for (let i in oelna.dl.cardData) {
			if (oelna.dl.cardData[i].dbfId == dbfId) return oelna.dl.cardData[i];
		}
	}

	return false;
}

oelna.dl.setCardData = function(dbfId, insertData) {
	// insertData needs to be a distionary
	if (oelna.dl.cardData.length > 0) {
		for (let i in oelna.dl.cardData) {
			if (oelna.dl.cardData[i].dbfId == dbfId) {
				// manually add all properties (overwrites existing!)
				for (let j in insertData) {
					oelna.dl.cardData[i][j] = insertData[j];
				}
			}
		}
	}

	return false;
}

oelna.dl.showCardDetail = function(dbfId) {
	// https://hearthstonejson.com/docs/images.html
	const apiURL = 'https://art.hearthstonejson.com/v1/render/latest';
	const assetSize = '256x';
	const containerElement = document.querySelector('#card');
	const image = containerElement.querySelector('img');

	const card = oelna.dl.cardDataByDbfId(dbfId);

	if (card.imageURL === undefined) {
		// create URL for the first time
		if (!card.id) return false;
		card.imageURL = apiURL+'/'+oelna.dl.gameLocale+'/'+assetSize+'/'+card.id+'.png';

		// preserve the image URL we generated upstream
		oelna.dl.setCardData(card.dbfId, {
			'imageURL': card.imageURL
		});
	}

	if (typeof card === 'object' && card.id) {
		image.setAttribute('src', card.imageURL);
		image.setAttribute('alt', 'Hearthstone Card: '+card.name);

		containerElement.classList.add('show');
	} else {
		console.warn('card '+dbfId+' was not found!');
	}
}

oelna.dl.hideCardDetail = function() {
	const containerElement = document.querySelector('#card');
	containerElement.classList.remove('show');
}

oelna.dl.resetUI = function() {
	oelna.dl.emptyDeck();
	oelna.dl.emptyManacurve();
	document.querySelector('#code').value = '';
	document.querySelector('#new-deck-name').value = '';
	document.querySelector('#new-deck-comment').value = '';

	console.warn('the entire user interface was reset.');
}

oelna.dl.emptyDeck = function() {
	// via https://stackoverflow.com/a/22966637/3625228

	let outputHero = document.querySelector('#hero');
	outputHero.innerHTML = '';

	let outputCards = document.querySelector('#deck');
	let outputCardsClone = outputCards.cloneNode(false);
	outputCards.parentNode.replaceChild(outputCardsClone, outputCards);
}

oelna.dl.displayDeck = function(deckData) {
	if (!deckData) return false;

	oelna.dl.deckData = deckData; // preserve the raw deck data

	const cards = deckData.cards;
	const hero = deckData.heroes[0];

	// sort alphabetically and by cost: https://stackoverflow.com/a/1129270/3625228
	cards.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
	cards.sort((a,b) => (a.cost > b.cost) ? 1 : ((b.cost > a.cost) ? -1 : 0));

	// empty table first
	oelna.dl.emptyDeck();

	let outputCards = document.querySelector('#deck');
	let outputHero = document.querySelector('#hero');
	outputHero.innerHTML = hero.name + ' (' + hero.cardClass.toLowerCase() + ')';

	for (let i = 0; i < cards.length; i++) {
	  	// row
		const row = document.createElement('tr');
		row.setAttribute('data-dbfid', cards[i].dbfId);
		row.classList.add('rarity-'+cards[i].rarity.toLowerCase());
		row.style.opacity = 0;
		row.style.animationDelay = (0.05*i)+'s';
		row.addEventListener('mouseout', oelna.dl.hideCardDetail);
		row.addEventListener('mouseover', function(e) {
			// todo: make this more robust and test in various browsers
			let dbfId = e.target.parentNode.getAttribute('data-dbfid');
			if (!dbfId) dbfId = e.target.parentNode.parentNode.getAttribute('data-dbfid'); // handle card name span element
			oelna.dl.showCardDetail(dbfId);
		});

		// cells
		const cardCost = document.createElement('td');
		cardCost.innerHTML = cards[i].cost;
		cardCost.classList.add('cost');
		const cardNameSpan = document.createElement('span');
		cardNameSpan.innerHTML = cards[i].name;
		const cardName = document.createElement('td');
		cardName.classList.add('name');
		cardName.appendChild(cardNameSpan);
		const cardAmount = document.createElement('td');
		cardAmount.innerHTML = cards[i].amount;
		cardAmount.classList.add('amount');

		row.appendChild(cardCost);
		row.appendChild(cardName);
		row.appendChild(cardAmount);

		outputCards.appendChild(row);
	}

	document.querySelector('#code').value = oelna.dl.activeDeckcode;

	// load user data, if possible
	const userData = oelna.dl.arraySearch(oelna.dl.activeDeckcode, 'deckcode', oelna.dl.userDecks);

	let userDeckName = document.querySelector('#user-deck-name');
	let userDeckComment = document.querySelector('#user-deck-comment');

	if (userData) {
		userDeckName.innerHTML = userData['deck_name'];
		userDeckComment.innerHTML = '<p>' + userData['deck_comment'] + '</p>';

		// make a pretty date
		const dateSaved = new Date(userData['date_saved'] * 1000);
		const day = dateSaved.getDate().toString().padStart(2, '0');
		const month = (dateSaved.getMonth()+1).toString().padStart(2, '0');

		const rfcDate = dateSaved.getFullYear() +'-'+ month +'-'+ day;

		userDeckComment.innerHTML += '<p class="comment">You saved this deck on <time datetime="'+rfcDate+'">' + rfcDate + '</time></p>';
	} else {
		userDeckName.innerHTML = 'Unknown deck';
		userDeckComment.innerHTML = 'This is a new deck. Save it and make some notes. They will appear here.';
	}

	oelna.dl.displayManacurve();
}

oelna.dl.emptyManacurve = function() {
	let manacurveElement = document.querySelector('#manacurve ul');

	let manacurveElementClone = manacurveElement.cloneNode(false);
	manacurveElement.parentNode.replaceChild(manacurveElementClone, manacurveElement);

	manacurveElement.setAttribute('data-manacurve', '[0,0,0,0,0,0,0,0]');
}

oelna.dl.displayManacurve = function() {
	const manacurve = oelna.dl.getManacurve(oelna.dl.deckData);
	const minValue = 0;
	const maxValue = Math.max(...manacurve);

	oelna.dl.emptyManacurve();
	let manacurveElement = document.querySelector('#manacurve ul');

	manacurveElement.setAttribute('data-manacurve', JSON.stringify(manacurve));

	for (let i = 0; i < manacurve.length; i++) {
		const curveItemHeight = Math.floor(manacurve[i]/maxValue*100);
		const curveItem = document.createElement('li');
		curveItem.style.height = (curveItemHeight) + '%';
		curveItem.setAttribute('title', manacurve[i] + ' cards with mana cost ' + ((i < 7) ? i : '7+'));

		manacurveElement.appendChild(curveItem);
	}
}

// copy to clipboard (from https://stackoverflow.com/a/30810322/3625228)
oelna.dl.fallbackCopyDeckcodeToClipboard = function(input) {
	input.focus();
	input.select();

	try {
		const successful = document.execCommand('copy');
		if (successful) console.log('Copied deckcode '+input.value+' to clipboard.');
	} catch (err) {
		console.error('Unable to copy to clipboard!', err);
	}

	document.body.removeChild(textArea);
}

oelna.dl.copyDeckcodeToClipboard = function(input) {
	if (!navigator.clipboard) {
		oelna.dl.fallbackCopyTextToClipboard(input);
		return;
	}
	navigator.clipboard.writeText(input.value).then(function() {
		console.log('Copied deckcode '+input.value+' to clipboard.');
	}, function(err) {
		console.error('Could not copy deckcode: ', err);
	});
}

oelna.dl.toggleUserIdOverlay = function() {
	const modal = document.querySelector('#change-user-dialog');

	if (window.getComputedStyle(modal).display === 'none') {
		modal.showModal();
	} else {
		modal.close();
	}

}

document.querySelector('#copy-deckcode').addEventListener('click', function() {
	const deckcodeInput = document.querySelector('#code');
	oelna.dl.copyDeckcodeToClipboard(deckcodeInput);
});

document.querySelector('#input-form').addEventListener('submit', function(e) {
	e.preventDefault();

	const deckstring = document.querySelector('#deckcode').value;
	oelna.dl.loadDeckFromDeckcode(deckstring);
});

document.querySelectorAll('.toggle-change-user-dialog').forEach(function(ele, i) {
	ele.addEventListener('click', function(e) {
		e.preventDefault();
		oelna.dl.toggleUserIdOverlay();
	});
});

document.querySelector('#userid-form').addEventListener('submit', function(e) {
	e.preventDefault();

	const newUserID = document.querySelector('#userid').value;
	console.log('setting user to ID ', newUserID);

	// todo: maybe validate the ID somewhat?
	oelna.dl.userUUID = newUserID;
	document.querySelector('#user-uuid').value = oelna.dl.userUUID;
	document.querySelector('#userid').value = oelna.dl.userUUID;
	localStorage.setItem('clientUUID', oelna.dl.userUUID);
	oelna.dl.initUI();
});

oelna.dl.live('click', 'a[data-deckcode]', function(e) {
	e.preventDefault();

	const deckstring = this.dataset.deckcode;
	oelna.dl.loadDeckFromDeckcode(deckstring);
});

document.querySelector('#save-deck-form').addEventListener('submit', function(e) {
	e.preventDefault();

	// todo: hide the save button if the deck is already in the user's decks

	const deck = {
		'user': oelna.dl.userUUID, // todo: get this from the form field instead? thoughts?
		'name': e.target.querySelector('#new-deck-name').value,
		'comment': e.target.querySelector('#new-deck-comment').value,
		'code': oelna.dl.activeDeckcode,
		'curve': JSON.parse(document.querySelector('#manacurve ul').getAttribute('data-manacurve')),
		'timestamp': Math.floor(Date.now() / 1000)
	};

	const formData = new FormData();
	formData.append('data', JSON.stringify(deck));

	(async () => {
		const rawResponse = await fetch(oelna.dl.appURL + '/save_deck.json.php', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
			},
			body: formData
		});
		const content = await rawResponse.json();

		// refresh the decks overview list
		oelna.dl.userDecks.push({
			'date_saved': deck.timestamp,
			'deck_comment': deck.comment,
			'deck_name': deck.name,
			'deckcode': deck.code
		});
		oelna.dl.userDecks.sort((a,b) => (a.deck_name > b.deck_name) ? 1 : ((b.deck_name > a.deck_name) ? -1 : 0)); // sort by name
		oelna.dl.userDecksList(); // re-render the decks list
	})();
});