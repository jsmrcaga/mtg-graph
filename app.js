global.Utils = require('./lib/utils');
let express = require('express');
let app = express();

let bodyParser = require('body-parser');
let cors = require('cors');
app.use(cors());

app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let mustache = require('mustache-express');
app.engine('html', mustache());
app.set('view engine', 'html');

app.set('views', __dirname+'/views');
app.use(express.static(__dirname+'/static'));

app.get('/', function (req, res, err){
	res.render('index');
});

app.use('/api', require('./routes/api'));

app.listen(process.env.PORT || 1234, function(){
	console.log(`Server listening on port ${process.env.PORT || 1234}!`);
});