const _message = function(title,message){
	return new Promise((resolve,reject)=>{
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.innerHTML = 'Aceptar';
		btn.setAttribute('class','btn btn-primary');
		btn.addEventListener( 'click' , function(event){
			$('#alert_message').modal('hide');
			resolve(this.value);
		});
		$('#alert_message .modal-footer').html(btn);
		$('#alert_message h4').html(title);
		$('#alert_message p').html(message);
		$('#alert_message').modal('show');
	});
};