# Hearthstone Decklist Utility

A small web app to keep track of your Hearthstone deck codes. It contains two simple deck string parsing libraries in `PHP` ([deckcode_lib.php](deckcode_lib.js)) and `Javascript` ([deckcode_lib.js](deckcode_lib.js)) I put together from various sources in different languages. See below for standalone usage.

*If any of this benefits or is of value to you, consider donating. I put my info in the GitHub Sponsor button. Your support is greatly appreciated!*

## Demo

I host a demo that is completely usable (with no guarantees though!) on [dcklst.at](https://dcklst.at)

![](https://user-images.githubusercontent.com/1279725/66777979-b3de3700-eeca-11e9-83d8-146563f7fa90.png)

## Instructions

I tried to make everything self-explanatory. Import a deck code (either the [full text](https://hearthstone.gamepedia.com/Deck_Importing#Example_2), or just the Base64 string) to preview the deck and cards – no need to make an account or anything. If you choose to save the deck for later, put in a name and, if you like, description, so you can identify it later. Your deck info is saved in a small database that resides on the webserver. Ideally I'd like to make offline storage in the browser possible via Javascript localstorage, but I haven't gotten to it yet, and who knows if I will. Take it as is.

The app also displays the deck code and mana curve of the decklist. There is also a list of your saved decks, so you can easily access them at any point. There is currently no hard limit on the amount of decks that can be saved by a single user, but I may need to put one in if spam or abuse become a problem.

If you would like to build on my code, read on:

## Using the standalone Javascript parser

**This works without a Node.js server, any weird dependencies or setup! Just plain Javascript in your browser.**

Download and link to [deckcode_lib.js](deckcode_lib.js) and [unpack.js](unpack.js)

In your code do something like

```javascript
let deckstring = 'AAECAf0ECMUEigeQB7gIvuwCxvgCoIADip4DC4oByQOrBMsElgXhB/sMw/gC24kDg5YDn5sDAA==';
let preparedDeckstring = oelna.dl.prepareDeckstring(deckstring);
let deckData = oelna.dl.parseDeckstring(preparedDeckstring, false);
```

`deckData` will contain an Object of deck information, such as format, hero and card IDs, which can be matched to cards via [hearthstonejson.com API](https://api.hearthstonejson.com).

Use `oelna.dl.extractDeckstring()` on your input first, if you want to allow for dirty input, eg. the Base64 string is somewhere inside the input string.

## Using the standalone PHP parser

**No external dependencies or setup! PHP 5+**

Download and include [deckcode_lib.php](deckcode_lib.php)

In your code do something like

```php
$deckstring = 'AAECAf0ECMUEigeQB7gIvuwCxvgCoIADip4DC4oByQOrBMsElgXhB/sMw/gC24kDg5YDn5sDAA==';
$deckData = decode_deckstring($deckstring);
```

`$deckData` will contain an array with hero and card IDs with amounts (one, two, n). The card IDs can be matched to actual cards via [hearthstonejson.com API](https://api.hearthstonejson.com).

## Sources

I read a lot on Stackoverflow, and marked code that I got from there with comments, but I'd like to call out the Javascript `unpack()` function from the locutus PHPjs project (which I learned about on this [SO answer](https://stackoverflow.com/questions/7305508/javascript-equivalent-to-php-unpack-function)). Without it, my code does nothing. I use it despite [the known issues](https://github.com/kvz/locutus/issues/221).

I tried to base my port on the [parser in python-hearthstone](https://github.com/HearthSim/python-hearthstone/blob/master/hearthstone/deckstrings.py) but got nowhere.

Also, thanks to SO user [Sammitch](https://stackoverflow.com/users/1064767/sammitch), who, in their answer to my question on SO, put me on the right track with varint byte decoding.

And without the [Hearthsim info on deckstrings](https://hearthsim.info/docs/deckstrings/) I probably would never have started this project at all.
