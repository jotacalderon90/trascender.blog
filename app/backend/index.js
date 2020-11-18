"use strict";

const self = function(a){
	
}

/*index
//@route('/')
//@method(['get'])
*/
self.prototype.index = function(req,res,next){
	res.render("index",{ip: req.real_ip, headers: req.headers, user: req.user});
}

module.exports = self;