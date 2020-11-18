"use strict";

const self = function(a){
	this.mongodb = a.mongodb;
}

//@route('/api/comment/total')
//@method(['get'])
self.prototype.total = async function(req,res){
	try{
		const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		const total = await this.mongodb.count('comment',query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/comment/collection')
//@method(['get'])
self.prototype.collection = async function(req,res){
	try{
		const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		const options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		const data = await this.mongodb.find('comment',query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/comment')
//@method(['post'])
//@roles(['user'])
self.prototype.create = async function(req,res){
	try{
		if(!req.body.comment || typeof req.body.comment!='string' || req.body.comment.trim().length < 0 || req.body.comment.trim().length > 500){
			throw('error field comment');
		}
		req.body.author = req.user._id;
		req.body.created = new Date();
		await this.mongodb.insertOne('comment',req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;