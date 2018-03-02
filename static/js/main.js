;(function(){
	let exec = {};

	exec.__images = {
		colors: ['b', 'w', 'g', 'r', 'u', 'x'],
		identities: {
			'W': {color: '#e6d976', font: '#000000'},
			'G': {color: '#7A9B76', font: '#FFFFFF'},
			'B': {color: '#000000', font: '#FFFFFF'},
			'U': {color: '#134074', font: '#FFFFFF'},
			'R': {color: '#5A2328', font: '#FFFFFF'}
		}
	};

	exec.data = {
		cards: null,
		edges: null
	};

	exec.settings = {
		drawmana: false
	};

	window.showMana = function(dod){
		exec.settings.drawmana = dod;
		exec.graph.redraw();
	}

	exec.images = {
		colors: {},
		symbols: {}
	}
	exec.__rarity = {
		'Rare': '#dac385',
		'Common': '#000',
		'Uncommon': '#b1d0db',
		'Mythic Rare': '#bd510e'
	};
	Workshop.http = function(params){
		let func = function(resolve, reject){
			Workshop.ajax(params, function(err, res, xhr){
				if(err){
					return reject(err);
				}
				return resolve({
					response: res,
					xhr: xhr
				});
			});
		}
		return new Promise(func);
	};

	// request cards for the first time
	Cards({
		colors:{
			colors:["White", "Black"],
			and: false
		},
		sets:["AKH", "RIX", "HOU", "XLN"],
		types: {
			types:["Creature"],
			and: true
		}
	}).then(res => {
		let response = JSON.parse(res.response);
		initGraph(response.cards, response.edges);
	}).catch(e => {
		console.error(e);
	});

	function initGraph(data, edges){
		let nodes = makeNodes(data, edges);
		exec.data.cards = data;
		exec.data.nodes = nodes;
		exec.data.edges = edges;

		console.time('Drawing');
		exec.graph = new vis.Network(document.querySelector('.container'), {
			nodes: nodes,
			edges: edges
		}, {
			layout:{improvedLayout: false},
			physics:{
				enabled:false,
				solver: 'forceAtlas2Based'
			}
		});
		console.timeEnd('Drawing');

		exec.graph.on('afterDrawing', function(ctx){
			if(exec.settings.drawmana){
				drawCosts(ctx, exec.data.cards);
			}
		});

		exec.graph.addEventListener('doubleClick', function(event){
			return clickedNode(event.nodes, exec.data.cards, event.pointer.canvas);
		});

		exec.graph.addEventListener('click', function(event){
			if(event.nodes.length === 0){
				recolor(exec.data.nodes);
			} else if(event.nodes.length === 1){
				grey(exec.data.nodes, exec.data.edges, event.nodes[0]);
			}
		});

		console.time('Stabilizing...');
		exec.graph.stabilize(2000);
		console.timeEnd('Stabilizing...');
		loadImages();
	}

	function makeNodes(data, edges){
		console.time('Cleaning nodes...');
		let cleanedNodes = cleanNodes(data, edges);
		
		let nodes = new vis.DataSet();
		for(let node of cleanedNodes){
			let ncolor = '#ebebeb';
			let nfont = '#000000';
			if(node.colorIdentity){
				ncolor = exec.__images.identities[node.colorIdentity[0]].color;
				nfont = exec.__images.identities[node.colorIdentity[0]].font;
			}
			nodes.add({
				id: node.id,
				label: node.name,
				color: {
					background: ncolor,
					border: exec.__rarity[node.rarity],
					highlight: ncolor,
				},
				original_color: {
					background: ncolor,
					border: exec.__rarity[node.rarity],
					highlight: ncolor,
				},
				shape: 'circle',
				font:{
					face: 'matrix bold',
					color: nfont,
				},
				widthConstraint:{
					maximum: 100
				}
			});
		}
		console.timeEnd('Cleaning nodes...');
		return nodes;
	}

	function loadImages(){
		for(let i of exec.__images.colors){
			let im = new Image();
			im.src = `/img/mana/${i}.svg`;
			exec.images.colors[i] = im;
		}
	}

	function cleanNodes(cards, edges){
		let ret = [];
		for(let c of cards){
			let isLinked = edges.find(e => {
				return e.from === c.id || e.to === c.id;
			});
			if(isLinked){
				ret.push(c);
			}
		}
		return ret;
	}

	function clickedNode(nodes, data, coords){
		if(nodes.length === 0){
			console.log('No nodes selected');
			return;
		}

		let card = data.find(e=>{
			return e.id === nodes[0];
		});

		if(!card){
			console.warn('Card not found for id', nodes[0]);
			return;
		}

		let image = new Image();
		
		function drawCard(ctx){
			ctx.drawImage(image, coords.x, coords.y);
		}

		image.addEventListener('load', function(){
			exec.graph.on('afterDrawing', drawCard);
			exec.graph.redraw();
		});

		exec.graph.addEventListener('click', function(event){
			return clearGraphAddons(drawCard);
		});

		image.src = `http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`;
	}

	function clearGraphAddons(fct){
		exec.graph.off('afterDrawing', fct);
	}

	function drawCosts(ctx, cards){
		let positions = exec.graph.getPositions();
		for(let id in positions){
			let pos = positions[id];
			let card = cards.find(c => c.id === id);
			
			if(card.manaCost){
				let mana = card.manaCost.split('}{').map(m => {
					let p = m.replace(/{|}/gi, '');
					if(!isNaN(p)){
						return parseInt(p);
					} 
					return p.toLowerCase();
				});

				drawMana(ctx, mana, pos.x+15, pos.y-40);
			}
			if(card.printings){
				drawSet(ctx, card.printings, card.rarity.substr(0,1), pos.x, pos.y);
			}
		}
	}

	function drawMana(ctx, mana, x, y){
		for(let c of mana){
			if(!isNaN(c)){
				drawSimpleMana(ctx, c, x, y);	
			} else {
				// draw mana from image	
				ctx.drawImage(exec.images.colors[c], x, y-10, 20, 20);
			}
			x += 22;
		}
	}

	function drawSimpleMana(ctx, qtty, x, y){
		x+=10;
		ctx.beginPath();
		ctx.arc(x,y, 10 , 0, 2*Math.PI);
		ctx.fillStyle = '#d9d2cf';
		ctx.fill();

		ctx.fillStyle = '#000';
		ctx.font = '20px matrix bold'
		ctx.fillText(qtty.toString(), x-5, y-3);
	}

	function drawSet(ctx, printings, rarity, x, y){
		let r = ['C', 'U', 'R', 'M'];
		if(r.indexOf(rarity) === -1){
			return;
		}

		let ctr = 1;
		let set = printings[printings.length - ctr];
		while(set.length > 3 && ctr < printings.length){
			ctr++;
			set = printings[printings.length - ctr];
		}

		if(!exec.images.symbols[set] || !exec.images.symbols[set][rarity]){
			// preload
			let image = new Image();

			image.src = `http://gatherer.wizards.com/Handlers/Image.ashx?type=symbol&set=${set}&size=small&rarity=${rarity}`;
			if(!exec.images.symbols[set]){
				exec.images.symbols[set] = {};
			}
			exec.images.symbols[set][rarity] = image;

		} else {
			ctx.drawImage(exec.images.symbols[set][rarity], x+15, y-75);
		}
	}

	function grey(nodes, edges, node){
		recolor(nodes);

		let stedges = edges.filter(e => e.from === node || e.to === node);
		let greynodes = nodes.get().filter(n => {
			let in_edges = stedges.find(e => e.from === n.id || e.to === n.id);
			if(in_edges){
				return false;
			}
			return true;
		});

		greynodes = greynodes.map(n => {
			n.color = {
				background: '#8a8686',
				border: exec.__rarity[node.rarity],
				highlight: '#8a8686',
			};
			return n;
		});

		nodes.update(greynodes);
	}

	function recolor(nodes){
		let greynodes = nodes.get().map(n => {
			n.color = Object.assign({},n.original_color);
			return n;
		});
		nodes.update(greynodes);
	}

	function Cards(filters) {
		return Workshop.http({
			method: 'POST',
			url : location.protocol + '//' + location.host + '/api/cards/filter',
			data: filters,
			headers: {
				'Content-Type':'application/json'
			}
		});
	}

	// get filters
	Workshop.http({
		method: 'GET',
		url : location.protocol + '//' + location.host + '/api/filters',
	}).then(res => {
		let response = JSON.parse(res.response);
			
		UI.buildOptions(response.properties, UI.elements.filters.properties);
		UI.buildOptions(response.types, UI.elements.filters.types);
		UI.buildOptions(response.legalities, UI.elements.filters.legalities);
		UI.buildOptions(response.sets, UI.elements.filters.sets);
	}).catch(e => {
		console.error('Could not set filters', e);
	})

	UI.elements.form.addEventListener('submit', function(event){
		event.preventDefault();
		let filters = {};
		// get colors
		let colors = UI.getColors();
		if(colors.length > 0){
			filters.colors = {
				colors: colors,
				and: document.querySelector('#color-and').checked
			}
		}

		// get types
		let types = UI.getOptions(UI.elements.filters.types);
		if(types.length > 0){
			filters.types = {
				types: types,
				and: document.querySelector('#type-and').checked
			};
		}
		// get cmc
		let cmc = {
			gt: document.querySelector('#cmc-gt').checked,
			value: parseInt(document.querySelector('#cmc').value)
		};
		if(cmc.value && !isNaN(cmc.value)){
			filters.cmc = cmc;
		}

		// get properties
		let props = UI.getOptions(UI.elements.filters.properties);
		if(props.length > 0){
			filters.properties = {
				properties: props,
				and: document.querySelector('#properties-and').checked
			};
		}

		// get legalities
		let leg = UI.getOptions(UI.elements.filters.legalities);
		if(leg.length > 0){
			if(leg.length === 1 && leg[0] === ""){

			} else {
				filters.legalities = leg;
			}
		}
		// get sets
		let set = UI.getOptions(UI.elements.filters.sets);
		if(set.length > 0){
			filters.sets = set;
		}

		// execute
		Cards(filters).then(res => {
			let response = JSON.parse(res.response);
			if(response.cards && response.edges){
				let nodes = makeNodes(response.cards, response.edges);
				exec.data.cards = response.cards;
				exec.data.edges = response.edges;
				exec.data.nodes = nodes;

				exec.graph.setData({
					nodes: nodes,
					edges: response.edges
				});
				exec.graph.stabilize(1000);
			}
		}).catch(e => {
			console.error('Could not filter', e);
		});
	});


})();