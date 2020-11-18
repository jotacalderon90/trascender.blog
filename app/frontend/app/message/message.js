app.modules.message = new trascender({
	properties: {
		name: "message", 
		label: "Contáctame", 
		icon: "fa-envelope"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		
	},
	start: function(){
		this.message.create = {};
		this.message.create.on = "Enviando mensaje";
		this.message.create.error = "Error al enviar su mensaje";
		this.message.create.success = "Su mensaje ha sido enviado correctamente :D";
		this.new();
	},
	open: function(){
		$("#message_modal_form").modal("show");
	},
	
	service: {
		create: ["POST","/api/message"]
	},
	default: function(){
		return {email: "", message: ""}
	},
	isMail: function(data){
		let exp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if(data!=undefined && data.trim()!="" && exp.test(data)){
			return true;
		}else{
			return false;
		}
	},
	create: async function(){
		this.logger("Enviando mensaje","alert-info");
		try{
			
			this.newdoc = this.formatToServer(this.newdoc);
			
			if(!this.isMail(this.newdoc.email)){
				throw("Email inválido");
			}
			
			this.newdoc = this.recaptcha(this.newdoc);
			
			$(".loader").fadeIn();
			
			await this.service_create({},this.formatBody(this.newdoc));
						
			$(".loader").fadeOut();
				
			this.logger("Mensaje enviado","alert-success");
			this.new();
			this.parent.refreshView();
		}catch(e){
			this.logger(e.toString(),"alert-danger");
		}
	},
	recaptcha: function(doc){
		try{
			doc["g-recaptcha-response"] = grecaptcha.getResponse();
		}catch(e){
			if(e.toString()!="ReferenceError: grecaptcha is not defined"){
				throw(e);
			}
		}
		return  doc;
	},
	logger: function(message,classname){
		$("#message_log").html(message);
		$("#message_log").addClass("alert " + classname);
	}
});