const logger = function(msg,type){
	console[(type?type:'log')](new Date().toLocaleString() + " == " + msg);
}

logger('start application');

logger('import readline');
const readline = require('readline');

logger('import fs');
const fs = require('fs');

logger('import path');
const path = require('path');

logger('import express');
const express = require('express');

logger('import body-parser');
const bodyParser = require('body-parser');

logger('import cookie-parser');
const cookieParser = require('cookie-parser');

logger('import express-session');
const session = require('express-session');

logger('import express-fileupload');
const upload = require('express-fileupload');

logger('import helmet');
const helmet = require('helmet');

logger('import compression');
const compression = require('compression');

logger('import http');
const http = require('http');

logger('import cors');
const cors = require('cors');

logger('import trascender.router');
const router = require('trascender.router');

logger('import trascender.render');
const render = require('trascender.render');

const self = function(){
	try{
		this.start();
	}catch(e){
		console.error(e);
		logger(e,'error');
		process.exit();
	}
}

self.prototype.start = async function(){
	
	logger('set default data');
	this.setDefaultData();
	
	logger('set default express');
	this.setDefaultExpress();
	
	logger('import local libs');
	this.importLIBS();
	
	logger('start mongoDB');
	if(this.mongodb){
		await this.mongodb.start();
	}
	
	logger('execute first start');
	if(!fs.existsSync(this.config.properties.log)){
		await this.importDefaultData();
		await this.configDefaultAdmin();
	}
	
	logger('public files');
	this.publicFiles();
	
	logger('public folders');
	this.publicFolders();
	
	logger('public routers');
	new router(this,this.dir + '/app/backend');
	
	logger('public redirect');
	this.publicRedirect();
	
	logger('public 404');
	this.public404();
	
	logger('open Port');
	this.openPort(this.config.properties.port)	
}

self.prototype.setDefaultData = function(){
	
	//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';//20200824:eliminar si no sucede nada especial
	//this.process = process;//20200824:eliminar si no sucede nada especial
	
	this.dir = __dirname;
	
	this.config = JSON.parse(fs.readFileSync('./app.json','utf8'));
	
	this.config.properties.log = './log.csv';
	this.config.properties.limit = '50mb';
	this.config.properties.object = './app/backend/script/objects.json';
	this.config.properties.lib = './app/backend/lib/';
	this.config.properties.views = '/app/frontend/app/';
	
	this.config.files = (this.config.files)?this.config.files:[];
	this.config.files.push({uri: '/favicon.ico',	src: '/app/frontend/assets/media/img/favicon.ico'});
	this.config.files.push({uri: '/robots.txt',		src: '/app/frontend/assets/media/doc/robots.txt'});
	this.config.files.push({uri: '/manifest.json',	src: '/app/frontend/assets/pwa/manifest.json'});
	this.config.files.push({uri: '/sw.js',			src: '/app/frontend/assets/pwa/sw.js'});
	
	this.config.folders = (this.config.folders)?this.config.folders:[];
	this.config.folders.push({uri: '/', src: '/app/frontend'});
}

self.prototype.setDefaultExpress = function(){
	this.express = express();
	this.express.use(bodyParser.json({limit: this.config.properties.limit})); 
	this.express.use(bodyParser.urlencoded({extended: true}));
	this.express.use(cookieParser());
	this.express.use(compression());
	
	const sessionOptions = {
		secret: this.config.properties.secret,
		resave: false,
		saveUninitialized: false,
		cookie: (this.config.properties.cookie_domain)?this.config.properties.cookie_domain:undefined
	}
	
	this.express.use(session(sessionOptions));
	this.express.use(upload());
	this.express.use(helmet());
	this.server = http.Server(this.express);
	this.render = new render(this, __dirname + this.config.properties.views);
	
	if(this.config.properties.cors===true){
		this.express.use(cors());
	}
}

self.prototype.importLIBS = function(){
	const libFolder = this.config.properties.lib;
	if(fs.existsSync(libFolder)){
		const libs = fs.readdirSync(libFolder,"utf8").filter((row)=>{
			return fs.statSync(path.join(libFolder,row)).isFile();
		});
		for(let i=0;i<libs.length;i++){
			const l = libs[i].replace(".js","");
			logger('import lib ' + l);
			this[l]	= new(require(libFolder + l))(this);
		}
	}
}

self.prototype.importDefaultData = async function(){
	let r;
	const objects = JSON.parse(fs.readFileSync(this.config.properties.object,"utf8"));
	for(let i=0;i<objects.length;i++){
		r = await this.mongodb.count("object",{name: objects[i].name});
		if(r==0){
			r = await this.mongodb.insertOne("object",objects[i]);
			logger('insert lib ' + r.insertedCount + ' object ' + objects[i].name);
			if(r.insertedCount==1){
				if(objects[i].doc){
					for(let x=0;x<objects[i].doc.length;x++){
						r = await this.mongodb.insertOne(objects[i].name,objects[i].doc[x]);
						logger('insert lib ' + r.insertedCount + ' document in ' + objects[i].name);
					}
				}
			}
		}
	}
}

self.prototype.configDefaultAdmin = async function(){
	let r = await this.readline.ask("Debe tener al menos un usuario administrador, ¿desea crearlo? [S/N]?: ");
	if(r.toUpperCase()=="S"){
		const user = await this.readline.ask("Ingrese un nombre de usuario: ");
		r = await this.mongodb.count("user",{email: user});
		if(r==0){
			const pass = await this.readline.ask("Ingrese una contraseña: ");
			const hash = this.helper.random(10);
			const doc = {
				email: user,
				hash: hash,
				password: this.helper.toHash(pass + user,hash),
				nickname: user,
				notification: true,
				thumb: "/media/img/user.png",
				roles: ["admin","user"],
				created: new Date().toLocaleString(),
				activate: true
			};
			
			r = await this.mongodb.insertOne("user",doc);
			logger('user admin created correctly');
		}else{
			logger('user ' + user + ' already exist');
		}
	}
}

self.prototype.beforeExecute = function(params){
	return async (req,res,next) => {
		try{
			req.type = params.type;
			
			req.real_ip = (req.connection.remoteAddress!="::ffff:127.0.0.1" && req.connection.remoteAddress!='::1')?req.connection.remoteAddress:req.headers["x-real-ip"];
			
			req.token = this.getToken(req);
			
			if(req.token!=null && req.token!=undefined && !req.token.error){
				req.user = await this.mongodb.findOne("user",req.token.sub);
			}
			
			this.new_request(req);
			
			if(params.roles==undefined || params.roles.length==0){
				return next();
			}else if(req.token==null || req.token==undefined){
				throw("Acción restringida"); 
			}else if(req.token.error){
				throw(req.token.error); 
			}else{
				let a = await this.mongodb.find("user_active",{user_id: req.token.sub});
				if(a.length==0){ 
					throw("Acción restringida"); 
				}
				a = false;
				for(let i=0;i<params.roles.length;i++){
					if(req.user.roles.indexOf(params.roles[i])>-1){
						a = true;
					}
				}
				if(a){
					return next();
				}else{
					throw("Acción restringida");
				}
			}
		}catch(e){
			console.error(e);
			if(req.url.indexOf("/api/")==-1){
				req.session.redirectTo = req.url;
			}
			res.status(401).render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "alert", action: "messageFromServer", data: {title: "Error 401", msg: e.toString(), class: "danger"}}});
		}
	}
}

self.prototype.getToken = function(req){
	let token = null;
	if(req.headers && req.headers.cookie){
		let cookies = req.headers.cookie.split(";");
		for(let i=0;i<cookies.length;i++){
			if(cookies[i].indexOf("Authorization=")>-1 && cookies[i].indexOf("=null")==-1){
				token = this.auth.decode(cookies[i].split("=")[1].split(";")[0]);
				token = (token==null)?{error: this.auth.error.toString()}:token;
			}
		}
	}
	return token;
}

self.prototype.new_request = function(req){
	req.created = new Date().toLocaleString();
	let content = "\n";
	content += req.created + ";";
	content += req.type + ";";
	content += req.real_ip + ";";
	content += ((req.user)?req.user.email:null) + ";";
	content += req.originalUrl + ";";
	content += req.method + ";";
	content += JSON.stringify(req.body);
	console.log(content);
	fs.appendFile(this.config.properties.log, content, function (err) {});		
}

self.prototype.getFile = function(file){
	return function(req,res){
		res.sendFile(file);
	};
}

self.prototype.getRedirect = function(to){
	return function(req,res){
		res.redirect(to);
	};
}

self.prototype.publicFiles = function(){
	if(this.config.files){
		for(let i=0;i<this.config.files.length;i++){
			this.express.get(this.config.files[i].uri, this.beforeExecute({type: "FILE", roles: this.config.files[i].roles}), this.getFile(this.dir + this.config.files[i].src));
		}
	}
}

self.prototype.publicFolders = function(){
	if(this.config.folders){
		for(let i=0;i<this.config.folders.length;i++){
			this.express.use(this.config.folders[i].uri, this.beforeExecute({type: "FOLDER", roles: this.config.folders[i].roles}), express.static(this.dir + this.config.folders[i].src));
		}
	}
}

self.prototype.publicRedirect = function(){
	if(this.config.redirect){
		for(let i=0;i<this.config.redirect.length;i++){
			this.express.use(this.config.redirect[i].from, this.beforeExecute({type: "REDIRECT", roles: this.config.redirect[i].roles}), this.getRedirect(this.config.redirect[i].to));
		}
	}
}

self.prototype.public404 = function(){
	this.express.use(function(req,res,next){
		logger("error 404 " + req.originalUrl);
		res.status(404).render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "alert", action: "messageFromServer", data: {title: "Error 404", msg: "URL not found: " + req.originalUrl, class: "danger"}}});
	});
}

self.prototype.openPort = function(port){
	this.server.listen(port, () => {
		logger("started trascender in " + port + " port");
	});
}

module.exports = new self();