window.UI = {};

UI.elements = {
	filters:{
		legalities: document.querySelector('#filter-legalities'),
		properties: document.querySelector('#filter-properties'),
		sets: document.querySelector('#filter-sets'),
		types: document.querySelector('#filter-type'),
		colors: {
			Black: document.querySelector('#color-black'),
			Green: document.querySelector('#color-green'),
			Blue: document.querySelector('#color-blue'),
			White: document.querySelector('#color-white'),
			Red: document.querySelector('#color-red')
		}
	},
	form: document.querySelector('#filter'),
	settigs:{
		mana: document.querySelector('#show-mana')
	}
};

UI.elements.settigs.mana.addEventListener('change', function(){
	showMana(this.checked);
});

UI.buildOptions = function(options, on){
	for(let op of options){
		let opt = document.createElement('option');
		opt.value = op;
		opt.innerText = op;
		on.appendChild(opt);
	}
};

UI.getOptions = function(select){
	let opts = select.options;
	let ret = [];
	for(let i = 0; i < opts.length; i++){
		if(opts[i].selected){
			ret.push(opts[i].value);
		}
	}
	return ret;
};

UI.getColors = function(){
	let ret = [];
	for(let color in UI.elements.filters.colors){
		let c = UI.elements.filters.colors[color];
		if(c.checked){
			ret.push(color);
		}
	}
	return ret;
};