app.modules.about = new trascender({
	properties: {
		name: "about", 
		label: "Acerca de",
		icon: "fa-info-circle"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.service_read = this.serviceCreate("GET","/api/directory/public/file/public/:id");
		this.service_save = this.serviceCreate("PUT","/api/directory/public/file/public/:id");
		this.action = '';
	},
	start: function(){
		
	},
	open: function(){
		$("#about_modal_about").modal('show');
	},
	
	edit: function(){
		document.getElementById('about_editable').setAttribute('contenteditable', 'true'); 
		this.action = 'edit';
	},
	save: async function(){
		$("#about_modal_about").modal('hide');
		try{
			$(".loader").fadeIn();
			
			const current = await this.service_read({id: btoa('app/about/index.html')});
			const divisor1 = '<!--editable-->';
			const divisor2 = '<!--/editable-->';
			
			const ini = current.indexOf(divisor1); 
			const fin = current.indexOf(divisor2); 
			
			const updated = current.substr(0,ini) + document.getElementById('about_editable').innerHTML.trim() + current.substr(fin + divisor2.length);
			
			await this.service_save({id: btoa('app/about/index.html')},JSON.stringify({content: updated})); 
			
			this.parent.alert.alert('Aviso', 'Archivo modificado correctamente',this.properties.name);
		}catch(e){
			this.parent.alert.alert('Error', e.toString(),this.properties.name);
		}
		document.getElementById('about_editable').removeAttribute('contenteditable'); 
		this.action = '';
		$(".loader").fadeOut();
	},
	workflow: function(){
		this.open();
	}
});
//YXBwL2Fib3V0L2luZGV4Lmh0bWw=
