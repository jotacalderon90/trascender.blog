const clave = function(){
	return new Promise((resolve,reject)=>{
		const input = document.createElement('input');
		input.type = 'password';
		input.placeholder = 'Ingrese contraseña...';
		input.setAttribute('class','form-control');
		//input.focus();
		input.addEventListener( 'keypress' , function(event){
			if(event.which === 13){
				$('#mdClave').modal('hide');
				if(this.value=='123456'){
					resolve();
				}else{
					return reject('password incorrecta');
				}
			}
		});
		$('#mdClave .modal-content').html(input);
		$('#mdClave').modal('show');
	});
};