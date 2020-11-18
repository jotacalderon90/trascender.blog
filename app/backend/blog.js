"use strict";

const fs = require('fs');

const self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.mongodb = a.mongodb;
	this.helper = a.helper;
	this.microservice = a.microservice;
	
	this.IMG_BACK_PATH = this.dir + "/app/frontend/assets/media/img/blog/";
	if (!fs.existsSync(this.IMG_BACK_PATH)) {
		fs.mkdirSync(this.IMG_BACK_PATH);
	}
	
	this.start();
}

self.prototype.start = async function(){
	try{
		this.setting = await this.mongodb.find("setting",{type: 'blog'},{limit: 1});
		if(this.setting.length==1){
			this.setting = this.setting[0];
		}else{
			this.setting = await this.mongodb.insertOne("setting",{type: 'blog'});
			this.setting = this.setting.ops[0];
		}
		this.setTagsByRole();
		
		//const parche = await this.mongodb.updateMany('blog',{tag: {$in: ['Blog']}},{$pull: {tag: 'Blog'}});//eliminar si se uso en producción!
		//console.log(parche);
	}catch(e){
		console.log('ERROR:BLOG:START');
		console.log(e);
	}
}

self.prototype.setTagsByRole = function(){
	this.setting.roles_tag = {};
	if(this.setting.roles && this.setting.tag){
		let tags;
		for(let i=0;i<this.setting.roles.length;i++){
			this.setting.roles_tag[this.setting.roles[i]] = this.forTag(this.setting.roles[i],this.setting.tag);
		}
	}
}

self.prototype.forTag = function(role,tag){
	let r = [];
	for(let i=0;i<tag.length;i++){
		if(typeof tag[i]==='string'){
			r.push(tag[i]);
		}else if(typeof tag[i]==='object' && (!tag[i].roles || tag[i].roles.indexOf(role) > -1)){
			r.push(tag[i].label);
			if(tag[i].tag){
				r = r.concat(this.forTag(role,tag[i].tag));
			}
		}
	}
	return r;
}

self.prototype.distinct = function(array){
	let a = [];
	for(let i=0;i<array.length;i++){
		if(a.indexOf(array[i])==-1){
			a.push(array[i]);
		}
	}
	return a;
}

self.prototype.getUserRole = function(req){
	return ((req.user && req.user.roles && req.user.roles.length > 0)?req.user.roles[0]:'anonymous');
}

self.prototype.getTagsEnabledByUserRole = function(req){
	const userRole = this.setting.roles_tag[this.getUserRole(req)];
	console.log(userRole);
	console.log(userRole);
	console.log(userRole);
	if(req.query.tag && typeof req.query.tag==='string' && userRole.indexOf(req.query.tag) > -1){
		return req.query.tag;
	}else if(req.query.tag && req.query.tag['$in']){
		return {$in: req.query.tag['$in'].filter((r)=>{
			return userRole.indexOf(r)>-1;
		})};
	}else{
		return {$in: userRole};
	}
}

/*******/
/*VIEWS*/
/*******/

/*render blog collection
//@route('/blog')
//@method(['get'])
*/
self.prototype.renderCollection = async function(req,res){
	try{
		const data = await this.mongodb.find("blog",{},{limit: 10, sort: {created: -1}, projection: {uri: 1,thumb: 1,resume: 1,title: 1,created: 1}});
		res.render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "blog", action: "open", data: data}});
	}catch(e){
		console.log(e);
		res.status(500).render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "alert", action: "messageFromServer", data: {title: "Error en el Servidor", msg: e.toString(), class: "danger"}}});
	}
}

/*render blog tag x
//@route('/blog/categoria/:id')
//@method(['get'])
*/
self.prototype.renderCollectionTag = async function(req,res){
	try{
		res.render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "blog", action: "getByTag2", data: req.params.id}});
		//let data = await this.mongodb.find("blog",{tag: req.params.id},{limit: 10, sort: {created: -1}});
		//res.render("blog/collection",{title: req.params.id.charAt(0).toUpperCase() + req.params.id.slice(1),rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "alert", action: "messageFromServer", data: {title: "Error en el Servidor", msg: e.toString(), class: "danger"}}});
	}
}

/*render blog page
//@route('/blog/:id')
//@method(['get'])
*/
self.prototype.render_id = async function(req,res,next){
	let view = "blog/" + req.params.id;
	if(this.helper.exist(view)){
		res.render(view);
	}else{
		return next();
	}
}

/*render blog new
//@route('/blog/new')
//@method(['get'])
//@roles(['admin'])
*/
self.prototype.new = async function(req,res){
	res.render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "blog", action: "newByServer"}});
}

/*render blog document
//@route('/blog/:id')
//@method(['get'])
*/
self.prototype.renderDocument = async function(req,res){
	try{	
		let data = await this.mongodb.find("blog",{uri:req.params.id});
		if(data.length!=1){
			throw("No se encontró el documento solicitado");
		}else{
			res.render("index",{
				title: data[0].title,
				description: data[0].resume, 
				keywords: 'blog,' + data[0].tag.join(','),
				author: data[0].author,
				img: data[0].img,
				onOpen: {
					app: "blog", 
					action: "openRow", 
					data: data[0]
				},
				user: req.user, 
				ip: req.real_ip
			});
		}
	}catch(e){
		console.log(e);
		res.status(500).render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "alert", action: "messageFromServer", data: {title: "Error en el Servidor", msg: e.toString(), class: "danger"}}});
	}
}

/*render blog edit
//@route('/blog/edit/:id')
//@method(['get'])
//@roles(['admin'])
*/
self.prototype.edit = async function(req,res){
	try{	
		let row = await this.mongodb.findOne("blog",req.params.id);
		res.render("blog/form",{row: row});
	}catch(e){
		console.log(e);
		res.status(500).render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "alert", action: "messageFromServer", data: {title: "Error en el Servidor", msg: e.toString(), class: "danger"}}});
	}
	
}

/*****/
/*API*/
/*****/

/*service total
//@route('/api/blog/total')
//@method(['get','post'])
*/
self.prototype.total = async function(req,res){
	try{
		req.query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		req.query.tag = this.getTagsEnabledByUserRole(req);
		if(req.query.tag['$in']==undefined){
			delete req.query.tag;
		}
		console.log(req.query);
		const total = await this.mongodb.count("blog",req.query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service collection
//@route('/api/blog/collection')
//@method(['get','post'])
*/
self.prototype.collection = async function(req,res){
	try{
		const options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		req.query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		req.query.tag = this.getTagsEnabledByUserRole(req);
		if(req.query.tag['$in']==undefined){
			delete req.query.tag;
		}
		console.log(req.query);
		const data = await this.mongodb.find("blog",req.query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service tags
//@route('/api/blog/tag/collection')
//@method(['get'])
*/
self.prototype.tag = async function(req,res){
	try{
		//const data = await this.mongodb.distinct("blog","tag");
		//res.send({data: data});
		res.send({data: this.setting.roles_tag[this.getUserRole(req)]});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service create
//@route('/api/blog')
//@method(['post'])
//@roles(['admin'])
*/
self.prototype.create = async function(req,res){
	try{
		req.body.user = req.user._id;
		req.body.created = new Date();
		req.body.img = "/assets/media/img/logo.png";
		req.body.thumb = "/assets/media/img/logo.png";
		
		await this.mongodb.insertOne("blog",req.body);
		this.microservice.noWait("post","/api/wall/blog",{title: req.body.title});
		
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service read
//@route('/api/blog/:id')
//@method(['get'])
*/
self.prototype.read = async function(req,res){
	try{
		const row = await this.mongodb.findOne("blog",req.params.id);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service update
//@route('/api/blog/:id')
//@method(['put'])
//@roles(['admin'])
*/
self.prototype.update = async function(req,res){
	try{
		req.body.user = req.user._id;
		req.body.updated = new Date();
		
		await this.mongodb.updateOne("blog",req.params.id,req.body);
		this.microservice.noWait("put","/api/wall/blog",{id: req.params.id});
		
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service delete
//@route('/api/blog/:id')
//@method(['delete'])
//@roles(['admin'])
*/
self.prototype.delete = async function(req,res){
	try{
		const row = await this.mongodb.findOne("blog",req.params.id);
		await this.mongodb.deleteOne("blog",req.params.id);
		this.microservice.noWait("delete","/api/wall/blog",{title: row.title, author: req.user._id});
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/***********/
/*API:ADMIN*/
/***********/

/*service upload image
//@route('/api/blog/:id/image')
//@method(['post'])
//@roles(['admin'])
*/
self.prototype.upload = async function(req,res){
	try{
		if (!req.files || Object.keys(req.files).length != 1) {
			throw("no file");
		}
		const d = "/assets/media/img/blog/" + req.params.id + ".jpg";
		await this.helper.upload_process(req.files.file, this.dir + "/app/frontend" + d);
		await this.mongodb.updateOne("blog",req.params.id,{$set: {img: d, thumb: d}});
		
		//res.redirect("/blog/edit/" + req.params.id);
		res.redirect("/");
	}catch(e){
		res.status(500).render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "alert", action: "messageFromServer", data: {title: "Error en el Servidor", msg: e.toString(), class: "danger"}}});
	}
}

/*service to get setting blog
//@route('/api/blog/admin/setting')
//@method(['get'])
//@roles(['admin'])
*/
self.prototype.get_setting = async function(req,res){
	try{
		res.send({data: this.setting});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service to setting blog
//@route('/api/blog/admin/setting')
//@method(['put'])
//@roles(['admin'])
*/
self.prototype.put_setting = async function(req,res){
	try{
		req.body.type = 'blog';
		await this.mongodb.updateOne("setting",this.setting._id,req.body);
		await this.start();
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;