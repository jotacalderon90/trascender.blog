app.modules.blog = new trascender({
	properties: {
		name: "blog", 
		label: "Blog", 
		icon: "fa-file-text"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.getTag();
		$("body").delegate("#blog a","click",(event)=>{this.hrefInSite(event);});
		this.addTouchEvent();
		this.title = 'Blog';
		this.fulltext = '';
		this.sorted = {created: -1};
	},
	start: function(){
		CKEDITOR.replace("blog_input_content");
		this.restart();
		
		if(this.parent.hasRole('admin')){
			this.service_get_setting = this.serviceCreate("GET","/api/blog/admin/setting");
			this.service_put_setting = this.serviceCreate("PUT","/api/blog/admin/setting");
			this.get_setting();
		}
		this.comment.refreshView = this.parent.refreshView;
	},
	open: function(){
		$("#blog_modal_list").modal("show");
	},
	
	increase: true,
	scroller: "#blog_modal_list .modal-content",
	rowsByPage: 6,
	baseurl: "api/blog",
	comment: new wComment(),
	afterChangeMode: function(action,doc){
		switch(action){
			case 'edit':
				CKEDITOR.instances["blog_input_content"].setData(this.doc.content);
				CKEDITOR.instances['blog_input_content'].setReadOnly(false);
			break;
			case 'new':
				CKEDITOR.instances["blog_input_content"].setData("");
				CKEDITOR.instances['blog_input_content'].setReadOnly(false);
			break;
		}
	},
	
	/*****/
	/*GET*/
	/*****/
	
	afterGetTag: function(){
		$("#blog_input_tag").autocomplete({source: this.tag, select: ( event, ui )=>{
			this.getDoc().tagbk = ui.item.value;
		}});
	},
	restart: function(){
		if(this.fulltext.trim()!=""){
			this.query["$text"] = {"$search": this.fulltext};
		}else{
			delete this.query["$text"];
		}
		this.options.sort = this.sorted;
		this.options.projection = {uri: 1,thumb: 1,resume: 1,title: 1,created: 1};
		this.coll = [];
		this.obtained = 0;
		this.index = 0;
		this.getTotal();
	},
	afterGetTotal: function(){
		this.getCollection();
	},
	afterGetCollection: function(){
		this.parent.refreshView();
	},
	beforeRead: function(){
		$(".loader").fadeIn();
		return true;
	},
	afterRead: function(){
		$("#blog_modal_list").modal("hide");
		$("#blog_modal_document").modal("show");
		$("#blog_document_content").html(this.doc.content);
		this.getRelations();
		this.comment.load(this.doc._id);
	},
	getByTag: function(tag,scrollto){
		this.fulltext = '';
		if(tag!=""){
			this.title = tag;
			this.query.tag = tag;
		}else{
			this.title = 'Blog';
			delete this.query.tag;
		}
		
		//document.ti
			//uri += '/categoria/' + tag;
		//let uri = '/blog';tle = this.title;
		//window.history.pushState({"html":document.innerHTML,"pageTitle":this.title},this.title, uri);
		
		if(scrollto===1){
			$('#blog_modal_list .modal-content').animate({scrollTop: 0}, 1000);
		}
		
		this.restart();
	},
	getRelations: async function(){
		try{
			const query = {tag: {$in: [this.doc.tag_main]}, title: {$ne: this.doc.title}};
			const options = {skip: 0, limit: 10, sort: {created: -1}, projection: {uri: 1, thumb: 1, title: 1, created: 1}};
			this.doc.relation = await this.service_collection({query: JSON.stringify(query), options: JSON.stringify(options)});
			this.doc.relation = this.randomArray(this.doc.relation).slice(0,2);
			this.doc.relation = this.doc.relation.map((r)=>{return this.formatToClient(r)});
		}catch(e){
			alert(e);
		}
		$(".loader").fadeOut();	
		this.parent.refreshView();
		$('#blog_modal_document .modal-content').animate({scrollTop: 0}, 1000);
	},
	search: async function(){
		try{
			this.fulltext = await _prompt('Buscar', 'text', 'Ingrese criterio de búsqueda...',this.open);
			$('#blog_modal_list').modal('show');
			this.restart();
		}catch(e){
			alert(e);
		}
	},
	sort: function(){
		this.sorted.created = this.sorted.created * -1;
		this.restart();
	},
	
	/**************/
	/*GET BY TITLE*/
	/**************/
	
	hrefInSite: function(event){
		if(event.target.hasAttribute("href") && event.target.getAttribute("href").indexOf("/blog/")===0){
			event.preventDefault();
			let data;
			data = event.target.getAttribute("href").split("/");
			data = data[data.length-1];
			this.getDocByTitle(data);
		}
	},
	getDocByTitle: async function(uri){
		try{
			$(".loader").fadeIn();
			let c = await this.service_collection({query: JSON.stringify({uri: uri}), options: JSON.stringify({limit: 1})});
			if(c.length!==1){
				throw("No se encontró el documento con URL " + uri);
			}
			this.openRow(c[0]);
		}catch(e){
			alert(e);
			$(".loader").fadeOut();	
		}
	},
	
	/*************/
	/*FROM SERVER*/
	/*************/
	
	newByServer: function(){
		$("#blog_modal_form").modal("show");
		this.new();
	},
	getByTag2: async function(data){
		await this.wait(500);
		$('#blog_modal_list').modal('show');
		this.getByTag(data);
	},
	openRow: function(row){
		this.action = "read";
		this.doc = this.formatToClient(row);
		this.afterRead();
	},
	
	
	/********/
	/*FORMAT*/
	/********/
	
	formatToClient: function(row){
		row.datefromnow = moment(new Date(row.created), "YYYYMMDD, h:mm:ss").fromNow();
		row.datetitle = moment(new Date(row.created)).format("dddd, DD MMMM YYYY, h:mm:ss");
		return row;
	},
	formatToServer: function(doc){
		delete doc.datefromnow;
		delete doc.datetitle;
		delete doc.tagbk;
		delete doc.relation;
		doc.content = CKEDITOR.instances["blog_input_content"].getData();
		return doc;
	},
	
	/**************/
	/*CUD WORKFLOW*/
	/**************/
	
	beforeCUD: function(title){
		if(!confirm("Confirme " + title)){
			return;
		}
		$("#blog_modal_form").modal("hide");
		$(".loader").fadeIn();
		return true;
	},
	beforeCreate: function(){
		return this.beforeCUD('creación');
	},
	beforeUpdate: function(){
		return this.beforeCUD('actualización');
	},
	beforeDelete: function(){
		return this.beforeCUD('eliminación');
	},
	afterCUD: async function(s,r){
		$(".loader").fadeOut();	
		if(!s){
			await _message('ERROR', r.json.error);
		}
		this.restart();
		$("#blog_modal_list").modal("show");
	},
	afterCreate: function(s,r){
		this.afterCUD(s,r);
	},
	afterUpdate: function(s,r){
		this.afterCUD(s,r);
	},
	afterDelete: function(s,r){
		this.afterCUD(s,r);
	},
	
	/*******************/
	/*ON CREATE OR EDIT*/
	/*******************/
	
	default: function(){
		return {tag: []};
	},
	getPostFileUpload: function(URL) {
        return "/api/blog/" + ((this.doc)?this.doc._id:"") + "/image";
    },	
	titleOnBlur: function(){
		if(this.action=="new"){
			this.newdoc.uri = this.cleaner(this.newdoc.title);
		}else{
			this.doc.uri = this.cleaner(this.doc.title);
		}
	},
	addTag: function(event){
		if(event.which === 13) {
			if(this.getDoc().tag.indexOf(this.getDoc().tagbk)==-1){
				this.getDoc().tag.push(this.getDoc().tagbk);
				this.getDoc().tagbk = "";
			}
		}
	},
	removeTag: function(i){
		this.getDoc().tag.splice(i,1);
	},
	
	/**************/
	/*MOBILE TOUCH*/
	/**************/
	
	addTouchEvent: function(){
		
		document.querySelector('#blog_modal_list .modal-body').addEventListener('touchstart', (evt)=>{this.handleTouchStart(evt)});
		document.querySelector('#blog_modal_list .modal-body').addEventListener('touchmove', (evt)=>{this.handleTouchMove(evt)});
		document.querySelector('#blog_modal_list .modal-body').addEventListener('touchend', ()=>{this.handleDetect_list()});
		
		document.querySelector('#blog_modal_document .modal-body').addEventListener('touchstart', (evt)=>{this.handleTouchStart(evt)});
		document.querySelector('#blog_modal_document .modal-body').addEventListener('touchmove', (evt)=>{this.handleTouchMove(evt)});
		document.querySelector('#blog_modal_document .modal-body').addEventListener('touchend', ()=>{this.handleDetect_document()});
	},  
	handleDetect_list: function(){
		switch(this.detectSwipe){
			case 'left':
				if(this.index<this.coll.length-1){
					this.index++;
					this.refreshRow();
					if(this.index==this.coll.length-1){
						this.getCollection();
					}
				}
			break;
			case 'right':
				if(this.index>0){
					this.index--;
					this.refreshRow();
				}
			break;
			case 'up':
				this.read(this.coll[this.index]._id);
			break;
		}
		this.detectSwipe = null;
	},
	handleDetect_document: function(){
		switch(this.detectSwipe){
			case 'right':
				$("#blog_modal_document").modal("hide");
				$("#blog_modal_list").modal("show");
			break;
			case 'left':
				$("#blog_modal_document").modal("hide");
				$("#blog_modal_list").modal("show");
			break;
		}
		this.detectSwipe = null;
	},
	refreshRow: function(){
		$(".loader").fadeIn(()=>{
			this.row = this.coll[this.index];
			this.parent.refreshView();
			$(".loader").fadeOut();
		});
	},
	
	/*********/
	/*SETTING*/
	/*********/
	
	get_setting: async function(){
		try{
			const setting = await this.service_get_setting();
			this.setting = JSON.stringify(setting, undefined, "\t")
		}catch(e){
			alert(e);
		}
	},
	put_setting: async function(){
		try{
			$(".loader").fadeIn();
			const r = await this.service_put_setting({},this.formatBody(JSON.parse(this.setting)));
			this.get_setting();
		}catch(e){
			alert(e.error || e.toString);
		}
		$(".loader").fadeOut();
	}
	
});
