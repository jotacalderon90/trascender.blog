app.modules.application = new trascender({
	properties: {
		name: "application", 
		label: "Aplicaciones", 
		icon: "fa-bars"
	},
	showApp: function(){
		return false;
	},
	onload: function(){
		this.coll = [];
	},
	start: function(){	
		
		this.coll = this.parent.apps.map((r)=>{return this.parent[r].properties}).filter((r)=>{return r.noApp===undefined});
		//this.coll = this.SOABF(this.coll,"label");
		//this.reset();//para reiniciar memoria en desarrollo
		
		this.coll_to_menu = [this.coll.filter((r)=>{return r.name===this.properties.name})[0]];
		
		this.lastApps = JSON.parse(this.getLS("lastApps","[null,null,null,null]"));
		this.refreshSelectAppsInMenu();
		
		if(onOpen!==undefined){
			this.menuFadeOut();
			this.parent[onOpen.app][onOpen.action](onOpen.data);
		}
		
		$(".loader").fadeOut();
		$(".loader").addClass("opacity");
		
		/*
		this.menuToggle();
		document.getElementById("application").addEventListener("click", ()=>{
			this.menuToggle();
			setTimeout(()=>{this.menuFadeOut()}, 5000);
		}); */
	},
	open: function(){
		$("#application_modal_list").modal("show");
	},
	
	putLS: function(key,value){
		localStorage.setItem("app" + "." + this.properties.name + "." + key,value);
	},
	getLS: function(key,def){
		return localStorage.getItem("app" + "." + this.properties.name + "." + key)||def;
	},
	reset: function(){
		this.lastApps = [null,null,null,null];
		this.putLS("lastApps",JSON.stringify(this.lastApps));
	},
	refreshSelectApps: function(app){
		this.menuFadeOut();
		if(app===this.properties.name){
			return;
		}
		if(app===this.lastApps[0]){
			return;
		}
		if(this.lastApps.indexOf(app)>-1){
			this.lastApps.splice(this.lastApps.indexOf(app),1);
			this.lastApps.unshift(app);
		}else{
			this.lastApps.pop();
			this.lastApps.unshift(app);
		}
		this.putLS("lastApps",JSON.stringify(this.lastApps));
		this.refreshSelectAppsInMenu();
		
	},
	refreshSelectAppsInMenu: function(){
		let coll = [];
		for(let i=0;i<this.lastApps.length;i++){
			if(this.lastApps[i]!=null){
				let a = this.coll.filter((r)=>{return r.name===this.lastApps[i]});
				if(a.length===1){
					coll.push(a[0]);
				}
			}
		}
		coll.push(this.coll.filter((r)=>{return r.name===this.properties.name})[0]);
		this.coll_to_menu = coll;
	},
	menuToggle: function(){
		$("#application .btn-group").fadeIn();
	},
	menuFadeOut: function(){
		$("#application .btn-group").fadeOut();
	}
});