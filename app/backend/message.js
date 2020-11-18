"use strict";

const self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	
	if(this.config.recaptcha && this.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(this.config.recaptcha.public,this.config.recaptcha.private);
		this.recaptcha.render();
	}
}

/*contact form
//@route('/api/message')
//@method(['post'])
*/
self.prototype.message = async function(req,res,next){
	try{
		req.body.email = req.body.email.toLowerCase();
		if(this.helper.isEmail(req.body.email)){
			if(this.recaptcha!=undefined){
				await this.helper.recaptcha(this.recaptcha,req);
			}
			req.body.created = new Date();
			req.body.to = req.body.email;
			req.body.html = this.render.processTemplateByPath(this.dir + this.config.properties.views + "message/memo.html",req.body);
			
			//insertar usuario si no existe
			let e = await this.mongodb.count("user",{email: req.body.email});
			if(e==0){
				let u = {};
				u.email = req.body.email;
				u.hash = this.helper.random(10);
				u.password = this.helper.toHash("123456" + u.email,u.hash);
				u.nickname = u.email;
				u.notification = true;
				u.thumb = "/media/img/user.png";
				u.roles = ["user","message"];
				u.created = new Date();
				u.activate = true;
				await this.mongodb.insertOne("user",u);
				console.log("nuevo usuario insertado");
			}else{
				console.log("usuario ya insertado: " + e);
			}
			
			await this.mongodb.insertOne("message",req.body);
			
			if(this.config.smtp.enabled){
				await this.mailing.send(req.body);
			}
			res.send({data: true});
		}else{
			throw("IMAIL INVALIDO");
		}
	}catch(e){
		res.send({data: null, error: e});
	}
}

module.exports = self;