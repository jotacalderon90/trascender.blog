app.controller("ctrl", function($scope){
	this.start = async function(){
		this.apps = [];
		for(module in app.modules){
			this.apps.push(module);
			this[module] = app.modules[module];
			this[module].parent = this;
			if(this[module].start){
				await this[module].start();
			}
		}
		if(this.apps.length == 0){
			console.log("No hay aplicaciones instaladas");
		}else{
			setTimeout(()=>{this.refreshView()}, 500);
		}
	}
	this.start();
	this.refreshView = function(){
		$scope.$digest(function(){});
	}
	this.isIp = function(ip){
		if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)){
			return true;
		}
		return false;
	}
	this.hasRole = function(role){
		return (user && user.roles && user.roles.indexOf(role)>-1)?true:false;
	}
	this.copy = function(id_elemento,content) {
		let aux = document.createElement("input");
		let val = '';
		if(id_elemento!=null){
			val = document.getElementById(id_elemento).innerHTML;
		}else{
			val = content;
		}
		
		val = val.split("\n").join("");
		console.log(val);
		aux.setAttribute("value", val);
		document.body.appendChild(aux);
		aux.select();
		console.log(aux);
		document.execCommand("copy");
		//alert(aux.value + ' copiado al portapapeles');
		document.body.removeChild(aux);
	}
	this.copyURL = function(uri){
		this.copy(null,host + uri);
	}
	this.getURI = function(uri){
		return host + uri;
	}
});