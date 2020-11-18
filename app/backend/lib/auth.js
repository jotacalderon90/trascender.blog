"use strict";

const jwt = require("jwt-simple");

const self = function(application){
	this.secret = application.config.properties.secret;
}

self.prototype.encode = function(user){
	const iat = new Date();
	const exp = new Date(iat.getFullYear(),iat.getMonth(),iat.getDate(),iat.getHours(), iat.getMinutes() + 60);
	return jwt.encode({
		sub: user._id,
		//roles: user.roles,
		iat: iat,
		exp: exp
	},this.secret);
}

self.prototype.decode = function(token){
	try{
		const payload = jwt.decode(token,this.secret);
		if(new Date(payload.exp) <= new Date()){
			throw("expired");
		}
		return payload;
	}catch(e){
		this.error = e;
		return null;
	}
}

module.exports = self;