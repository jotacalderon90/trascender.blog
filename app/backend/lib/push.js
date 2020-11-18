"use strict";

const fs = require("fs");
const webpush = require('web-push');

const self = function(a){
	if(!a.config.push){
		const vapidKeys = webpush.generateVAPIDKeys();
		a.config.push = {
			public: vapidKeys.publicKey,
			private: vapidKeys.privateKey
		}
		fs.writeFileSync(a.dir + "/app.json",JSON.stringify(a.config,undefined,"\t"));
	}
	webpush.setVapidDetails(
		'mailto:' + a.config.properties.admin,
		a.config.push.public,
		a.config.push.private
	);
	this.publicKey = a.config.push.public;
	this.mongodb = a.mongodb;
	
	a.helper.socket_methods.push(["subscribe",this]);
	a.helper.socket_methods.push(["unsubscribe",this]);
	a.helper.socket_methods.push(["notificate",this]);
}

self.prototype.subscribe = async function(data){
	try{
		data.created = new Date();
		await this.mongodb.insertOne("push",data);
		this.notificateToAdmin("new push subscribe",data.created);
	}catch(e){
		console.error("push:subscribe:error:" + res);
	}
}

self.prototype.unsubscribe = async function(data){
	try{
		let row = await this.mongodb.find("push",{endpoint: data.endpoint});
		if(row.length==1){
			await this.mongodb.deleteOne("push",row[0]._id);
			row[0].razon = data.razon;
			await this.mongodb.insertOne("pushd",row[0]);
			this.notificateToAdmin("new push unsubscribe",data.razon);
		}
	}catch(e){
		console.error("push:unsubscribe:error:" + res);
	}
}

self.prototype.notificate = async function(data){
	for(let i=0;i<data.receptor.length;i++){
		await webpush.sendNotification(data.receptor[i].push, JSON.stringify({title: data.title,body: data.body,uri: data.uri}));
	}
	this.notificateToAdmin("new push notification",data.body);
}

self.prototype.notificateToAdmin = async function(title,body,uri){
	try{
		const rows = await this.mongodb.find("user",{roles: {$in: ["admin"]}, push: {$exists: true}});
		for(let i=0;i<rows.length;i++){
			for(let x=0;x<rows[i].push.length;x++){
				const push = await this.mongodb.findOne("push",rows[i].push[x]);
				await webpush.sendNotification(push, JSON.stringify({title: title,body: body,uri: uri}));
			}
		}
	}catch(e){
		console.error(e);
	}
}

module.exports = self;