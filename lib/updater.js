let updater = {};
const join = require('path').join;
const fs = require('fs');

updater.__filters = function(){
	let properties = [];
	let legalities = [];
	let types = [];
	let sets = [];

	let cards = JSON.parse(fs.readFileSync(join(__dirname, '../data/cards.json')));
	for(let card of cards){
		if(card.properties){
			for(let p of card.properties.needs){
				if(properties.indexOf(p.name) === -1){
					properties.push(p.name);
				}
			}

			for(let p of card.properties.does){
				if(properties.indexOf(p.name) === -1){
					properties.push(p.name);
				}
			}
		}

		if(card.legalities){
			for(let l of card.legalities){
				if(legalities.indexOf(l.format) === -1){
					legalities.push(l.format);
				}
			}
		}

		if(card.types){
			for(let t of card.types){
				if(types.indexOf(t) === -1){
					types.push(t);
				}
			}
		}

		if(card.printings){
			for(let p of card.printings){
				if(sets.indexOf(p) === -1){
					sets.push(p);
				}
			}
		}
	}

	fs.writeFileSync(join(__dirname, '../data/filters.json'), JSON.stringify({
		properties: properties, 
		legalities: legalities, 
		types: types,
		sets: sets
	}));
};

updater.run = function(){
	let properties = JSON.parse(fs.readFileSync(join(__dirname, '../properties/properties.json')));
	let cards = JSON.parse(fs.readFileSync(join(__dirname, '../data/cards.json')));
	
	console.time('Updating...');
	let new_cards = update(cards, properties);
	console.timeEnd('Updating...');

	fs.writeFileSync(join(__dirname, '../data/cards2.json'), JSON.stringify(new_cards));
};

function update(cards, properties){
	let reg = properties;

	let ctr = 0;
	for (let card of cards){
		ctr++;
		console.log('Executing on card', ctr);
		if(!card.properties){
			card.properties = {
				needs: [],
				does: []
			};
		}

		for(let r of reg){
			regexr(r, card);
		}
	}

	return cards;
}

function regexr(reg, card){
	if(reg.reg.does){
		_regex(reg.name, reg.reg.does, card.text, card.properties.does, card.name);
	} 

	if(reg.reg.needs){
		_regex(reg.name, reg.reg.needs, card.text, card.properties.needs, card.name);
	}
}

function _regex(name, reg, text, result, cname){
	if(reg instanceof Array){
		for(let r of reg){
			let re = new RegExp(r, 'gim');
			if(re.test(text)){
				result.push({
					name: name
				});
				break;
			}
		}

	} else {
		let r = new RegExp(reg, 'gim');
		if(r.test(text)){
			result.push({
				name: name
			});
		}
	}
}

module.exports = updater;
