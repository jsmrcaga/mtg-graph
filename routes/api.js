let api = require('express').Router();

api.get('/cards', function(req, res, next){
	let cards = Utils.getCards();
	let edges = Utils.edges(cards);
	return res.json({
		count: cards.length,
		links: edges.length,
		cards: cards, 
		edges: edges
	});
});

api.post('/cards/filter', function(req, res, next){
	let cards = Utils.getCards();
	let filtered = Utils.filter(cards, req.body);
	let edges = Utils.edges(filtered);

	return res.json({
		count: filtered.length, 
		links: edges.length,
		cards: filtered,
		edges: edges
	});
});

api.get('/filters', function(req, res, next){
	// return all possible fiters
	return res.json(Utils.filters());
});

api.post('/update', function(req, res, next){
	if(!req.get('X-Super-Key') || req.get('X-Super-Key') !== Config.api.key){
		return res.json({lol: 'Well tried my friend'});
	}

	let updater = require(join(__dirname, '../lib/updater'));
	updater.run().then(res => {
		return res.json({success: true});
	}).catch(e => {
		return res.json({success: false, error:e});
	});
});

module.exports = api;