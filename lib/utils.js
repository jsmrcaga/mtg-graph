const fs = require('fs');
const join = require('path').join;
let utils = {};

let cards_cache = null;
let filters_cache = null;

utils.filter = function(cards, params){
	return cards.filter(card => {
		if(params.colors){
			// filter by color
			let valid = false;
			for(let c of params.colors.colors){
				if(!card.colors){
					continue;
				}

				if(params.colors.and){
					if(card.colors.indexOf(c) === -1){
						return false;
					}
				} else {
					if(card.colors.indexOf(c) > -1){
						valid = true;
					}
				}
			}

			if(!params.colors.and && !valid){
				return false;
			}
		}

		if(params.types){
			// filter by type
			let valid = false;
			if(!card.types){
				return false;
			}
			for(let c of params.types.types){
				if(params.types.and){
					if(card.types.indexOf(c) === -1){
						return false;
					}
				} else {
					if(card.types.indexOf(c) > -1){
						valid = true;
					}
				}
			}

			if(!params.types.and && !valid){
				return false;
			}
		}

		if(params.cmc){
			// filter by mana cost
			if(params.cmc.gt){
				if(card.cmc < params.cmc.value){
					return false;
				}
			} else {
				if(card.cmc > params.cmc.value){
					return false;
				}
			}
		}

		if(params.properties){
			// filter by properties
			if(!card.properties || !card.properties.does){
				return false;
			}
			let valid = false;
			for(let p of params.properties.properties){
				let exists = card.properties.does.find(e => e.name === p);
				if(params.properties.and){
					if(!exists){
						return false;
					}

				} else {
					if(exists){
						valid = true;
					}	
				}
			}

			if(!params.properties.and && !valid){
				return false;
			}
		}

		if(params.legalities){
			// filter by legality
			if(!card.legalities){
				return false;
			}

			for(let l of params.legalities){
				let exists = card.legalities.find(e => e.format === l && e.legality === 'Legal');
				if(!exists){
					return false
				}
			}
		}

		if(params.sets){
			if(!card.printings){
				return false;
			}

			let valid = false;
			for(let s of params.sets){
				if(card.printings.indexOf(s) > -1){
					valid = true;
					break;
				}
			}
			if(!valid){
				return false;
			}
		}

		return true;
	});
};

utils.edges = function(cards){
	let edges = [];
	for(let card of cards){
		if(!card.properties){
			continue;
		}

		for(let need of card.properties.needs){
			for(let cc of cards){
				if(cc.id === card.id || !cc.properties){
					continue;
				}

				for(let doe of cc.properties.does){
					if(doe.name === need.name){
						edges.push({
							from: cc.id,
							to: card.id,
							arrows:{
								to: true
							}
						});
					}
				}
			}
		}
	}
	return edges;
};

utils.getCards = function(){
	if(cards_cache){
		return cards_cache;
	} 

	let cards = JSON.parse(fs.readFileSync(join(__dirname, '../data/cards.json')));
	cards_cache = cards;
	return cards;
};

utils.filters = function(){
	if(!filters_cache){
		filters_cache = require(join(__dirname, '../data/filters.json'));
	}
	return filters_cache;
};

module.exports = utils;