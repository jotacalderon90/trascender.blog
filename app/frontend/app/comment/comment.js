const wComment = function(){
	return new trascender({
		increase: true,
		baseurl: "api/comment",
		default: function(){
			return {comment: ""};
		},
		onload: function(){
			this.service_user = this.serviceCreate("GET","/api/account/:id");
			this.users = {};
			this.usersToLoad = [];
			this.new();
		},
		load: function(id){
			this.obtained = 0;
			this.cant = 0;
			this.coll = [];
			this.query = {parent: id};
			this.options.sort = {created: -1};
			this.getTotal();
		},
		afterGetTotal: function(){
			this.refreshView();
		},
		beforeGetCollection: function(){
			$(".loader").fadeIn();
			return true;
		},
		afterGetCollection: async function(){
			for(let i=0;i<this.usersToLoad.length;i++){
				if(user && user.roles && user.roles.indexOf('user')>-1){
					this.users[this.usersToLoad[i]] = await this.service_user({id: this.usersToLoad[i]});
				}else{
					this.users[this.usersToLoad[i]] = {nickname: "Anónimo", thumb: "/assets/media/img/user.png"};
				}
			}
			this.refreshView();
			$(".loader").fadeOut();
		},
		formatToClient: function(doc){
			if(!this.users[doc.author] && this.usersToLoad.indexOf(doc.author)==-1){
				this.usersToLoad.push(doc.author);
			}
			doc.datefromnow = moment(new Date(doc.created), "YYYYMMDD, h:mm:ss").fromNow();
			doc.datetitle = moment(new Date(doc.created)).format("dddd, DD MMMM YYYY, h:mm:ss");
			return doc;
		},
		formatToServer: function(doc){
			doc.parent = this.query.parent;
			return doc;
		},
		beforeCreate: function(doc){
			if(doc.comment.trim().length > 500){
				alert('Intente con un mensaje más corto');
				return;
			}
			if(doc.comment.trim()!=''){
				return confirm('Confirme su comentario');
			}
			return;
		}, 
		afterCreate: function(){
			this.new();
			this.coll = [];
			this.obtained = 0;
			this.getTotal();
		}
	});
}