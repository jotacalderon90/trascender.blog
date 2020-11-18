app.modules.alert = new trascender({
	properties: {
		name: "alert", 
		noApp: 1
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		
	},
	start: function(){
		$('#alert_modal_form').on('hidden.bs.modal', ()=>{
			this.parent[this.callback_app].workflow(this.userResponse);
		})
		
		$('#alert_modal_form').on('shown.bs.modal', ()=>{
			document.getElementById('alert_input').focus();
		})
	},
	open: function(){
		
	},
	
	class_title: "text-default",
	alert: function(title,msg,callback_app){
		this.title = title;
		this.msg = msg;
		this.options = [[null,'Aceptar']];
		this.callback_app = callback_app;
		this.showInput = false;
		$("#alert_modal_form").modal('show');
		this.parent.refreshView();
	},
	ask: function(title,msg,options,callback_app){
		this.title = title;
		this.msg = msg;
		this.options = options;
		this.callback_app = callback_app;
		this.showInput = false;
		$("#alert_modal_form").modal('show');
		this.parent.refreshView();
	},
	prompt: function(title,msg,callback,callback_app){
		this.title = title;
		this.msg = msg;
		this.options = [[callback,"Responder"]];
		this.callback_app = callback_app;
		this.answer = "";
		this.showInput = true;
		$("#alert_modal_form").modal('show');
		this.parent.refreshView();
	},
	response: function(r){
		this.userResponse = r;
		$("#alert_modal_form").modal('hide');
	},
	getResponse: function(){
		return this.answer;
	},
	messageFromServer: function(data){
		this.class_title = "text-" + data.class;
		this.alert(data.title,data.msg,"alert");
		console.log(data);
	},
	workflow: function(data){
		console.log(data);
		this.class_title = "text-default";
		this.parent.application.menuToggle();
	}/*,
	alertSync: function(title,msg,callback_app){
		return new Promise((resolve,reject)=>{
			this.alert(title,msg,callback_app);
			$('#alert_modal_form .modal-footer button').click((evt)=>{
				console.log(evt);
				resolve(true);
			});
		});
	}*/
});